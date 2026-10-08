"""Public invitation pages and QR verification (product brief Sections 10–11).

Anonymous, token-scoped endpoints. The unguessable invitation token is the
only credential — sequential IDs are never used here. Lifecycle is enforced
authoritatively from the database: an expired or revoked invitation is never
presented as valid, and a QR verification verdict reflects stored state, never
the scanned pixels. Opening or scanning an invitation never mutates it.
"""
from __future__ import annotations

from django.utils.timezone import now as timezone_now
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from invitations.models import Invitation
from preferences.models import GuestResponse
from preferences.serializers import GuestResponseSerializer

UNKNOWN_LINK_MESSAGE = "Ce lien d'invitation n'est pas valide."


def find_public_invitation(token: str) -> Invitation | None:
    """Fetch a live (non-tombstoned) invitation by its public token, or None.

    Unknown and soft-deleted links are deliberately indistinguishable so a
    stale URL cannot confirm that an invitation once existed.
    """
    return (
        Invitation.objects.filter(token=token)
        .exclude(state=Invitation.State.DELETED)
        .select_related("event_model__template")
        .prefetch_related(
            "event_model__preference_questions__options",
            "event_model__program_items",
            "event_model__dress_code_images",
        )
        .first()
    )


def _load_response(invitation: Invitation):
    return (
        GuestResponse.objects.filter(invitation=invitation)
        .select_related("invitation")
        .prefetch_related("answers__question", "answers__options")
        .first()
    )


def build_public_payload(invitation: Invitation, request) -> dict:
    """Assemble the full public page payload (event + guest + preferences).

    Data policy after expiry/revocation: the event identity and guest name stay
    visible so the designed expired/revoked state can explain itself, but
    ``is_valid`` is false and no preference submission is accepted. A deleted
    invitation is a 404 and never reaches this payload.
    """
    event = invitation.event_model
    template = event.template
    questions = [q for q in event.preference_questions.all() if q.is_active]
    response = _load_response(invitation)
    cover_url = request.build_absolute_uri(event.cover_image.url) if event.cover_image else None
    dress_code = [
        {
            "url": request.build_absolute_uri(item.image.url),
            "caption": item.caption,
            "order": item.order,
        }
        for item in event.dress_code_images.all()
    ]
    program = [
        {
            "start_time": item.start_time.isoformat(),
            "end_time": item.end_time.isoformat() if item.end_time else None,
            "description": item.description,
            "order": item.order,
        }
        for item in event.program_items.all()
    ]

    return {
        "status": invitation.status,
        "is_valid": invitation.is_currently_valid(),
        "invitation": {
            "guest_name": invitation.guest_name,
            "civility": invitation.civility,
            "display_name": invitation.display_name,
            "issued_at": invitation.issued_at.isoformat(),
            "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
        },
        "event": {
            "title": event.title,
            "message": event.message,
            "message_font": event.message_font,
            "font_size": event.font_size,
            "event_date": event.event_date.isoformat(),
            "event_time": event.event_time.isoformat(),
            "timezone": event.timezone,
            "venue_name": event.venue_name,
            "venue_address": event.venue_address,
            "venue_details": event.venue_details,
            "cover_url": cover_url,
            "display_config": event.display_config,
            "template": {"key": template.key, "name": template.name, "config": template.config},
        },
        "preferences": {
            "enabled": bool(questions) and "preferences" in (template.config.get("sections") or []),
            "questions": [
                {
                    "id": q.pk,
                    "label": q.label,
                    "help_text": q.help_text,
                    "input_type": q.input_type,
                    "required": q.required,
                    "order": q.order,
                    "options": [{"id": o.pk, "label": o.label, "order": o.order} for o in q.options.all()],
                }
                for q in questions
            ],
        },
        # Dress code and programme are content-gated: an unfilled section is
        # reported as disabled so the public page never renders it empty.
        "dress_code": {"enabled": bool(dress_code), "images": dress_code},
        "program": {"enabled": bool(program), "items": program},
        "response": GuestResponseSerializer(response).data if response else None,
    }


class PublicInvitationView(APIView):
    """``GET /api/public/invitations/{token}/`` — the public invitation page data."""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public"

    def get(self, request, token: str):
        invitation = find_public_invitation(token)
        if invitation is None:
            raise NotFound(UNKNOWN_LINK_MESSAGE)
        return Response(build_public_payload(invitation, request))


class PublicVerificationView(APIView):
    """``GET /api/public/invitations/{token}/verify/`` — authoritative QR verdict.

    Returns one of ``valid | expired | revoked | invalid`` (product brief
    Section 11). The verdict comes from the database, never from the QR image.
    Guest/event identity is only disclosed for a known token; unknown or
    deleted tokens return a bare ``invalid`` result.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public"

    def get(self, request, token: str):
        verified_at = timezone_now().isoformat()
        invitation = find_public_invitation(token)
        if invitation is None:
            return Response({"result": "invalid", "is_valid": False, "verified_at": verified_at})

        if invitation.state == Invitation.State.REVOKED:
            result = "revoked"
        elif invitation.is_currently_valid():
            result = "valid"
        else:
            result = "expired"

        return Response(
            {
                "result": result,
                "is_valid": result == "valid",
                "verified_at": verified_at,
                "guest_name": invitation.display_name,
                "event_title": invitation.event_model.title,
            }
        )
