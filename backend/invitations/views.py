"""API for individual guest invitations (product brief Sections 9 and 14).

Every endpoint is scoped to the authenticated organizer through the parent
event model — another organizer's invitations are indistinguishable from
missing ones (IDOR-safe 404s).

Lifecycle is enforced server-side on every request:
- expiry is derived (`active` + past `expires_at` behaves as `expired`),
- revocation and deletion are explicit actions (`/revoke/`, `DELETE`),
- deletion is soft (state `deleted`) so response history survives,
- creating new invitations is refused on deactivated event models.
"""
from __future__ import annotations

from django.db import transaction
from django.db.models import Exists, OuterRef, Q
from django.utils.timezone import now as timezone_now
from rest_framework import status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import DomainValidationError
from core.pagination import StandardPagination
from events.models import EventModel
from invitations.models import Invitation
from invitations.serializers import InvitationBulkSerializer, InvitationSerializer
from preferences.models import GuestResponse


def _get_event(request, pk) -> EventModel:
    event = EventModel.objects.filter(pk=pk, organizer=request.user).first()
    if event is None:
        raise NotFound("Ressource introuvable.")
    return event


def _get_invitation(request, pk) -> Invitation:
    invitation = (
        Invitation.objects.filter(pk=pk, event_model__organizer=request.user)
        .select_related("event_model")
        .first()
    )
    if invitation is None:
        raise NotFound("Ressource introuvable.")
    return invitation


class EventInvitationsView(APIView):
    """List (GET) and create (POST) invitations for one event model."""

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get(self, request, pk):
        event = _get_event(request, pk)
        queryset = (
            Invitation.objects.filter(event_model=event)
            .exclude(state=Invitation.State.DELETED)
            .select_related("event_model")
            .annotate(has_response=Exists(GuestResponse.objects.filter(invitation=OuterRef("pk"))))
        )

        query = request.query_params.get("q")
        if query:
            queryset = queryset.filter(guest_name__icontains=query)

        state = request.query_params.get("state")
        now = timezone_now()
        if state == Invitation.State.ACTIVE:
            queryset = queryset.filter(state=Invitation.State.ACTIVE).filter(
                Q(expires_at__isnull=True) | Q(expires_at__gt=now)
            )
        elif state == Invitation.State.EXPIRED:
            queryset = queryset.filter(
                Q(state=Invitation.State.EXPIRED) | Q(state=Invitation.State.ACTIVE, expires_at__lte=now)
            )
        elif state == Invitation.State.REVOKED:
            queryset = queryset.filter(state=Invitation.State.REVOKED)
        elif state:
            raise ValidationError({"state": "Filtre d'état invalide."})

        # Deterministic pagination order (alphabetical guest list).
        queryset = queryset.order_by("guest_name", "id")

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = InvitationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, pk):
        event = _get_event(request, pk)
        serializer = InvitationSerializer(data=request.data, context={"event": event})
        serializer.is_valid(raise_exception=True)
        serializer.save(event_model=event)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InvitationBulkGenerateView(APIView):
    """Batch generation from a guest list (all-or-nothing)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        event = _get_event(request, pk)
        if not event.is_active:
            raise DomainValidationError("Cet événement est désactivé.")

        payload = request.data if isinstance(request.data, dict) else {}
        rows = payload.get("invitations")
        if not isinstance(rows, list):
            raise ValidationError({"invitations": "La liste des invités est invalide."})

        serializer = InvitationBulkSerializer(data={"invitations": rows}, context={"event": event})
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            result = serializer.save()

        response = InvitationSerializer(result["invitations"], many=True)
        return Response(
            {"count": result["count"], "invitations": response.data},
            status=status.HTTP_201_CREATED,
        )


class InvitationDetailView(APIView):
    """Retrieve (GET), edit (PATCH/PUT) and soft-delete (DELETE) one invitation."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        invitation = _get_invitation(request, pk)
        return Response(InvitationSerializer(invitation).data)

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, *, partial: bool):
        invitation = _get_invitation(request, pk)
        if invitation.state == Invitation.State.DELETED:
            raise DomainValidationError("Cette invitation a été supprimée.")
        serializer = InvitationSerializer(invitation, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        invitation = _get_invitation(request, pk)
        if invitation.state != Invitation.State.DELETED:
            invitation.state = Invitation.State.DELETED
            invitation.save(update_fields=["state", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class InvitationRevokeView(APIView):
    """Revoke one invitation — terminal, and never a plain field write."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        invitation = _get_invitation(request, pk)
        if invitation.state == Invitation.State.DELETED:
            raise DomainValidationError("Cette invitation a été supprimée.")
        if invitation.state == Invitation.State.REVOKED:
            raise DomainValidationError("Cette invitation est déjà révoquée.")
        invitation.state = Invitation.State.REVOKED
        invitation.revoked_at = timezone_now()
        invitation.save(update_fields=["state", "revoked_at", "updated_at"])
        return Response(InvitationSerializer(invitation).data)


class InvitationDuplicateView(APIView):
    """Re-issue: a fresh token for the same guest (product brief Section 9).

    Explicit organizer action — exempt from the one-live-invitation-per-guest
    rule. A past expiry is intentionally NOT copied: the duplicate must open
    with its own, usable validity window.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        source = _get_invitation(request, pk)
        if source.state == Invitation.State.DELETED:
            raise DomainValidationError("Cette invitation a été supprimée.")

        expires_at = source.expires_at
        if expires_at is not None and expires_at <= timezone_now():
            expires_at = None

        duplicate = Invitation.objects.create(
            event_model=source.event_model,
            guest_name=source.guest_name,
            civility=source.civility,
            expires_at=expires_at,
        )
        serializer = InvitationSerializer(duplicate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
