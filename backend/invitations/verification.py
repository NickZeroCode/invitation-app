"""QR-authenticity verification: delegated links and door-side verdicts.

Two access paths to the same scanner experience:

* the **organizer** (authenticated) manages verification links for their own
  events and may scan directly from the account;
* a **delegate** (door staff) opens ``/verification/<token>``, proves
  possession of the organizer-chosen authorization code, then scans guests'
  QR codes at the door.

Security model ("the most secured possible"):

* the link URL carries a 256-bit token, the authorization code is the second
  factor — stored ONLY as a PBKDF2 hash and checked in constant time;
* code attempts are limited per link (temporary lock) and rate-limited per
  scope (``verify-code``);
* a successful authorization yields a stateless, tamper-proof session
  (``TimestampSigner`` — HMAC over the server SECRET_KEY, max age 12 h);
* EVERY scan re-checks the link's expiry/revocation server-side, so revoking
  a link immediately kills in-flight sessions;
* verdicts are computed ONLY from server-side state — never from QR pixels —
  and scans are strictly scoped to the link's event: foreign QR codes return
  ``wrong_event`` with zero identity data.

A QR payload is either a bare invitation token or the full guest link URL
(``…/i/<token>``); both are normalized before lookup.
"""
from __future__ import annotations

from urllib.parse import urlparse

from django.core import signing
from django.utils.timezone import now as timezone_now
from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from core.exceptions import DomainValidationError
from events.models import EventModel
from invitations.models import Invitation, VerificationLink
from invitations.public import find_public_invitation
from invitations.serializers import VerificationLinkSerializer

SESSION_SALT = "malaikaevents.verification.session"
SESSION_MAX_AGE = 12 * 60 * 60  # one door shift
SESSION_HEADER = "HTTP_X_VERIFICATION_SESSION"

UNKNOWN_LINK = "Ce lien de vérification n'est pas valide."
EXPIRED_LINK = "Ce lien de vérification a expiré."
REVOKED_LINK = "Ce lien de vérification a été révoqué."
LOCKED_LINK = "Trop de tentatives. Réessayez dans quelques minutes."
WRONG_CODE = "Code d'autorisation invalide."
SESSION_EXPIRED = "Session de vérification expirée. Saisissez à nouveau le code d'autorisation."


class VerificationSessionExpired(DomainValidationError):
    """Machine-readable session death (the SPA re-opens the code entry)."""

    default_code = "verification_session_expired"


def _session_error() -> DomainValidationError:
    return VerificationSessionExpired(SESSION_EXPIRED)


def _body_str(data, key: str) -> str:
    """Tolerant string field extraction (odd JSON bodies yield "")."""
    if not isinstance(data, dict):
        return ""
    value = data.get(key, "")
    return value.strip() if isinstance(value, str) else ""


def sign_session(link: VerificationLink) -> str:
    """Tamper-proof, stateless verifier session bound to ONE link."""
    return signing.TimestampSigner(salt=SESSION_SALT).sign_object({"link": link.pk})


def read_session(header_value: str | None, link: VerificationLink) -> None:
    """Validate the verifier session for `link`; raise 400 on any failure."""
    if not header_value:
        raise _session_error()
    try:
        payload = signing.TimestampSigner(salt=SESSION_SALT).unsign_object(
            header_value, max_age=SESSION_MAX_AGE
        )
    except (signing.BadSignature, signing.SignatureExpired):
        raise _session_error()
    if payload.get("link") != link.pk:
        raise _session_error()


def extract_invitation_token(raw: str) -> str:
    """Normalize a scanned QR payload to a bare invitation token.

    Accepts the bare token or any URL ending in ``/i/<token>`` (query strings
    and fragments included). Empty or unparseable payloads raise a French,
    user-safe domain error.
    """
    value = (raw or "").strip()
    if not value:
        raise DomainValidationError("QR code vide.")
    if "/" in value or "://" in value:
        path = urlparse(value).path if "://" in value else value
        segments = [segment for segment in path.split("/") if segment]
        value = segments[-1] if segments else ""
    value = value.split("?")[0].split("#")[0].strip()
    if not value:
        raise DomainValidationError("QR code illisible.")
    return value


def _get_event_or_404(request, pk: int) -> EventModel:
    event = EventModel.objects.filter(organizer=request.user, pk=pk).first()
    if event is None:
        raise NotFound()
    return event


def _get_link_or_404(pk: int) -> VerificationLink:
    link = VerificationLink.objects.select_related("event_model").filter(pk=pk).first()
    if link is None:
        raise NotFound()
    return link


def _link_payload(link: VerificationLink) -> dict:
    return {
        "status": link.status,
        "label": link.label,
        "event_title": link.event_model.title,
        "expires_at": link.expires_at.isoformat(),
        "revoked_at": link.revoked_at.isoformat() if link.revoked_at else None,
    }


def _ensure_link_usable(link: VerificationLink) -> None:
    """Reject dead links with their precise French reason."""
    if link.revoked_at is not None:
        raise DomainValidationError(REVOKED_LINK)
    if link.expires_at <= timezone_now():
        raise DomainValidationError(EXPIRED_LINK)


# ---------------------------------------------------------------------------
# Organizer endpoints
# ---------------------------------------------------------------------------


class EventVerificationLinksView(APIView):
    """``GET|POST /api/events/{pk}/verification-links/`` (organizer-scoped)."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        event = _get_event_or_404(request, pk)
        links = VerificationLink.objects.filter(event_model=event)
        return Response({"results": VerificationLinkSerializer(links, many=True).data})

    def post(self, request, pk: int):
        event = _get_event_or_404(request, pk)
        serializer = VerificationLinkSerializer(data=request.data, context={"event": event})
        serializer.is_valid(raise_exception=True)
        link = serializer.save()
        return Response(VerificationLinkSerializer(link).data, status=status.HTTP_201_CREATED)


class VerificationLinkRevokeView(APIView):
    """``POST /api/verification-links/{pk}/revoke/`` — explicit owner revocation."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        link = VerificationLink.objects.select_related("event_model").filter(
            pk=pk, event_model__organizer=request.user
        ).first()
        if link is None:
            raise NotFound()
        if link.revoked_at is None:
            link.revoked_at = timezone_now()
            link.save(update_fields=["revoked_at", "updated_at"])
        return Response(VerificationLinkSerializer(link).data)


# ---------------------------------------------------------------------------
# Public endpoints (delegated verifier)
# ---------------------------------------------------------------------------


class PublicVerificationLinkView(APIView):
    """``GET /api/public/verify-links/{token}/`` — landing-page link status."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public"

    def get(self, request, token: str):
        link = VerificationLink.objects.select_related("event_model").filter(token=token).first()
        if link is None:
            raise NotFound(UNKNOWN_LINK)
        return Response(_link_payload(link))


class PublicVerificationAuthorizeView(APIView):
    """``POST /api/public/verify-links/{token}/authorize/`` — code exchange."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "verify-code"

    def post(self, request, token: str):
        link = VerificationLink.objects.select_related("event_model").filter(token=token).first()
        if link is None:
            raise NotFound(UNKNOWN_LINK)
        _ensure_link_usable(link)
        if link.is_locked():
            raise DomainValidationError(LOCKED_LINK)

        code = _body_str(request.data, "code")
        if not code:
            raise DomainValidationError(WRONG_CODE)
        if not link.check_code(code):
            link.register_failed_attempt()
            raise DomainValidationError(WRONG_CODE)
        link.reset_failed_attempts()
        return Response(
            {
                "session": sign_session(link),
                "event_title": link.event_model.title,
                "expires_at": link.expires_at.isoformat(),
            }
        )


def scan_invitation(raw_content: str, event_model: EventModel) -> dict:
    """Door-side verdict for one scanned QR payload, scoped to ``event_model``.

    The verdict is computed purely from server-side state. Unknown or foreign
    invitations never leak identity or event data — only the generic message.
    """
    invitation_token = extract_invitation_token(raw_content)
    invitation = find_public_invitation(invitation_token)
    verified_at = timezone_now().isoformat()

    if invitation is None:
        return {
            "result": "invalid",
            "is_authentic": False,
            "message": "Invitation introuvable. Ce QR code n'a pas été émis par le serveur.",
            "summary": None,
            "verified_at": verified_at,
        }

    if invitation.event_model_id != event_model.pk:
        # Foreign event: absolutely no identity or event data leaks here.
        return {
            "result": "wrong_event",
            "is_authentic": False,
            "message": "Cette invitation appartient à un autre événement.",
            "summary": None,
            "verified_at": verified_at,
        }

    event = invitation.event_model
    result = {"active": "valid", "expired": "expired", "revoked": "revoked"}.get(
        str(invitation.status), "invalid"
    )
    messages = {
        "valid": "Invitation authentique et valide.",
        "expired": "Cette invitation a expiré.",
        "revoked": "Cette invitation a été révoquée.",
    }
    return {
        "result": result,
        "is_authentic": True,
        "message": messages[result],
        "summary": {
            "display_name": invitation.display_name,
            "guest_name": invitation.guest_name,
            "civility": invitation.civility,
            "event_title": event.title,
            "event_date": event.event_date.isoformat(),
            "event_time": event.event_time.strftime("%H:%M") if event.event_time else None,
            "venue_name": event.venue_name,
            "table_number": invitation.table_number,
            "table_text": invitation.table_text,
            "issued_at": invitation.issued_at.isoformat(),
            "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
            "presence_confirmed": invitation.presence_confirmed_at is not None,
            "presence_confirmed_at": (
                invitation.presence_confirmed_at.isoformat()
                if invitation.presence_confirmed_at
                else None
            ),
        },
        "verified_at": verified_at,
    }


class PublicVerificationScanView(APIView):
    """``POST /api/public/verify-links/{token}/scan/`` — delegated door verdict.

    The session header proves the caller already exchanged the authorization
    code; the verdict itself is scoped to this link's event.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "verify"

    def post(self, request, token: str):
        link = VerificationLink.objects.select_related("event_model").filter(token=token).first()
        if link is None:
            raise NotFound(UNKNOWN_LINK)
        read_session(request.META.get(SESSION_HEADER), link)
        _ensure_link_usable(link)
        return Response(scan_invitation(_body_str(request.data, "content"), link.event_model))


class EventVerificationScanView(APIView):
    """``POST /api/events/{pk}/verification-scan/`` — owner-side door verdict.

    The authenticated organizer verifies their own event without needing a
    delegated link. Same verdict core, same event scoping, same throttling.
    """

    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "verify"

    def post(self, request, pk: int):
        event = _get_event_or_404(request, pk)
        return Response(scan_invitation(_body_str(request.data, "content"), event))
