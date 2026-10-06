"""Health check and organizer dashboard overview.

Every statistic is computed from authoritative backend data — never from
frontend-side arithmetic.
"""
from __future__ import annotations

from django.db import connection
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from events.models import EventModel
from invitations.models import Invitation
from preferences.models import GuestResponse


@api_view(["GET"])
@permission_classes([AllowAny])
def health(request):
    database = "connected"
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:  # noqa: BLE001 — a health probe must never crash
        database = "unavailable"
    return Response({"status": "ok", "database": database})


class DashboardOverviewView(APIView):
    """Operational counts scoped to the authenticated organizer."""

    def get(self, request):
        organizer = request.user
        now = timezone.now()

        events = EventModel.objects.filter(organizer=organizer)
        invitations = Invitation.objects.filter(
            event_model__organizer=organizer, state__in=[s for s, _ in Invitation.State.choices if s != Invitation.State.DELETED]
        )
        responses = GuestResponse.objects.filter(invitation__event_model__organizer=organizer)

        active = invitations.filter(state=Invitation.State.ACTIVE).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=now)
        )
        expired = invitations.filter(
            Q(state=Invitation.State.EXPIRED) | Q(state=Invitation.State.ACTIVE, expires_at__lte=now)
        )
        revoked = invitations.filter(state=Invitation.State.REVOKED)

        return Response(
            {
                "events": {
                    "total": events.count(),
                    "upcoming": events.filter(is_active=True, event_date__gte=now.date()).count(),
                },
                "invitations": {
                    "total": invitations.count(),
                    "active": active.count(),
                    "expired": expired.count(),
                    "revoked": revoked.count(),
                },
                "responses": {"total": responses.count()},
                "generated_at": now.isoformat(),
            }
        )
