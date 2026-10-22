"""Organizer-side delivery of an invitation to one recipient (WhatsApp, e-mail).

Two endpoints, both keyed by the invitation's public token so the guest page
and the guest list share one contract:

- ``GET  /api/share/invitations/{token}/`` — share context. Session-aware but
  open: a guest (or anyone) simply receives ``{"can_share": false}`` — no 401
  noise, and nothing about the event or its organizer leaks. The owning
  organizer receives the server-built public URL, the delivery options and
  the event facts used to compose the message.
- ``POST /api/share/invitations/{token}/email/`` — sends the invitation e-mail
  through the configured provider. Owner-only (another organizer's token is a
  404), throttled per account, validated server-side, and it only answers
  ``sent`` once the provider accepted the message.

WhatsApp needs no server call: the client opens WhatsApp's official
click-to-chat link with the message prefilled and the organizer presses
« Envoyer » in WhatsApp themselves — nothing is sent automatically.

Data minimisation: recipients are not stored. Logs carry the invitation id,
never the address.
"""
from __future__ import annotations

import logging
from datetime import date, time

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework import serializers, status
from rest_framework.exceptions import APIException, NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from core.exceptions import DomainValidationError
from invitations.models import Invitation

logger = logging.getLogger(__name__)

_WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
_MONTHS = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]

MESSAGE_MAX_LENGTH = 1500
SUBJECT_MAX_LENGTH = 150


class EmailDeliveryUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_code = "email_unavailable"
    default_detail = (
        "L’envoi d’e-mails n’est pas encore configuré sur NickEvents. "
        "Utilisez votre messagerie ou WhatsApp en attendant."
    )


class EmailDeliveryFailed(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_code = "email_failed"
    default_detail = (
        "Le service d’e-mail n’a pas accepté le message. Aucun e-mail n’a été envoyé ; "
        "réessayez dans quelques instants."
    )


def french_date(value: date) -> str:
    """« samedi 12 décembre 2026 » (no locale dependency on the server)."""
    return f"{_WEEKDAYS[value.weekday()]} {value.day} {_MONTHS[value.month - 1]} {value.year}"


def french_time(value: time | None) -> str:
    """« 15h » / « 15h30 »."""
    if value is None:
        return ""
    return f"{value.hour}h" if value.minute == 0 else f"{value.hour}h{value.minute:02d}"


def public_invitation_url(request, invitation: Invitation) -> str:
    """Absolute URL of the guest-facing page — never the editor or the API."""
    base = getattr(settings, "PUBLIC_APP_URL", "") or request.build_absolute_uri("/").rstrip("/")
    return f"{base}/i/{invitation.token}"


def owned_invitation(request, token: str) -> Invitation | None:
    """The token's invitation when the signed-in organizer owns it, else None."""
    user = getattr(request, "user", None)
    if user is None or not user.is_authenticated:
        return None
    return (
        Invitation.objects.filter(token=token, event_model__organizer=user)
        .exclude(state=Invitation.State.DELETED)
        .select_related("event_model")
        .first()
    )


def default_message(invitation: Invitation, url: str) -> str:
    """The prefilled, editable message — real event data, never samples."""
    event = invitation.event_model
    when = french_date(event.event_date)
    hour = french_time(event.event_time)
    if hour:
        when = f"{when} à {hour}"
    where = f", {event.venue_name}" if event.venue_name else ""
    return (
        f"Bonjour {invitation.display_name},\n\n"
        f"Vous êtes chaleureusement invité(e) : « {event.title} », le {when}{where}.\n\n"
        f"Votre invitation personnelle et tous les détails :\n{url}\n\n"
        "Au plaisir de partager ce moment avec vous."
    )


def default_subject(invitation: Invitation) -> str:
    return f"Invitation — {invitation.event_model.title}"[:SUBJECT_MAX_LENGTH]


class ShareContextView(APIView):
    """``GET /api/share/invitations/{token}/``."""

    permission_classes = [AllowAny]

    def get(self, request, token: str):
        invitation = owned_invitation(request, token)
        if invitation is None:
            return Response({"can_share": False})
        url = public_invitation_url(request, invitation)
        event = invitation.event_model
        return Response(
            {
                "can_share": True,
                # A revoked/expired link would only show the guest a dead end.
                "shareable": invitation.is_currently_valid(),
                "status": invitation.status,
                "invitation_id": invitation.pk,
                "display_name": invitation.display_name,
                "public_url": url,
                "email_enabled": bool(getattr(settings, "INVITATION_EMAIL_ENABLED", False)),
                "event": {
                    "title": event.title,
                    "event_date": event.event_date.isoformat(),
                    "event_time": event.event_time.isoformat() if event.event_time else "",
                    "venue_name": event.venue_name,
                },
                "default_subject": default_subject(invitation),
                "default_message": default_message(invitation, url),
            }
        )


class ShareEmailSerializer(serializers.Serializer):
    recipient = serializers.EmailField(max_length=254)
    subject = serializers.CharField(max_length=SUBJECT_MAX_LENGTH, required=False, allow_blank=True)
    message = serializers.CharField(max_length=MESSAGE_MAX_LENGTH, required=False, allow_blank=True)


class ShareEmailView(APIView):
    """``POST /api/share/invitations/{token}/email/``."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "share-email"

    def post(self, request, token: str):
        invitation = owned_invitation(request, token)
        if invitation is None:
            raise NotFound("Ressource introuvable.")
        if not invitation.is_currently_valid():
            raise DomainValidationError(
                "Cette invitation n’est plus active : réactivez-la ou créez-en une nouvelle avant de l’envoyer."
            )

        serializer = ShareEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not getattr(settings, "INVITATION_EMAIL_ENABLED", False):
            raise EmailDeliveryUnavailable()

        url = public_invitation_url(request, invitation)
        subject = serializer.validated_data.get("subject", "").strip() or default_subject(invitation)
        # Header injection guard: a subject is one line.
        subject = " ".join(subject.split())
        message = serializer.validated_data.get("message", "").strip() or default_message(invitation, url)
        event = invitation.event_model
        context = {
            "subject": subject,
            "paragraphs": [block.strip() for block in message.split("\n\n") if block.strip()],
            "message": message,
            "url": url,
            "url_in_message": url in message,
            "event_title": event.title,
            "event_when": " à ".join(filter(None, [french_date(event.event_date), french_time(event.event_time)])),
            "venue_name": event.venue_name,
            "venue_address": event.venue_address,
            "guest_name": invitation.display_name,
        }

        email = EmailMultiAlternatives(
            subject=subject,
            body=render_to_string("invitations/email/invitation.txt", context),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[serializer.validated_data["recipient"]],
            reply_to=[request.user.email] if request.user.email else None,
        )
        email.attach_alternative(render_to_string("invitations/email/invitation.html", context), "text/html")
        try:
            sent = email.send(fail_silently=False)
        except Exception:  # provider/network failure: never report success
            logger.exception("Invitation e-mail failed (invitation=%s)", invitation.pk)
            raise EmailDeliveryFailed()
        if sent != 1:
            logger.warning("Invitation e-mail not accepted (invitation=%s)", invitation.pk)
            raise EmailDeliveryFailed()

        logger.info("Invitation e-mail accepted by provider (invitation=%s)", invitation.pk)
        # "accepted" = handed to the provider; delivery/opening is not tracked.
        return Response({"status": "accepted"}, status=status.HTTP_200_OK)
