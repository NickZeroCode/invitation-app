"""Guest response submission and organizer response reporting (Section 13).

Public submission is token-scoped and anonymous (the invitation token is the
credential). Responses are validated against the invitation's own event model:
arbitrary questions/options and submissions against expired, revoked or deleted
invitations are rejected server-side. Organizers see responses only for their
own events (IDOR-safe).
"""
from __future__ import annotations

from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from core.exceptions import DomainValidationError
from core.pagination import StandardPagination
from events.models import EventModel
from invitations.models import Invitation
from preferences.models import GuestResponse, GuestResponseAnswer
from preferences.serializers import GuestResponseSerializer, GuestResponseSubmissionSerializer


def _invalid_reason(invitation: Invitation) -> str:
    if invitation.state == Invitation.State.REVOKED:
        return "Cette invitation a été révoquée."
    return "Cette invitation a expiré."


class GuestResponseSubmitView(APIView):
    """``GET|POST /api/public/invitations/{token}/response/``.

    POST upserts the single response for the invitation (editable until it
    expires). A submission only succeeds after the server confirms it.
    """

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "public"

    def get(self, request, token: str):
        invitation = self._get_invitation(token)
        response = (
            GuestResponse.objects.filter(invitation=invitation)
            .select_related("invitation")
            .prefetch_related("answers__question", "answers__options")
            .first()
        )
        return Response(GuestResponseSerializer(response).data if response else None)

    def post(self, request, token: str):
        invitation = self._get_invitation(token)
        if not invitation.is_currently_valid():
            raise DomainValidationError(_invalid_reason(invitation))

        existed = GuestResponse.objects.filter(invitation=invitation).exists()
        serializer = GuestResponseSubmissionSerializer(
            data=request.data,
            event_model=invitation.event_model,
            invitation=invitation,
        )
        serializer.is_valid(raise_exception=True)
        response = serializer.save()
        return Response(
            GuestResponseSerializer(response).data,
            status=status.HTTP_200_OK if existed else status.HTTP_201_CREATED,
        )

    def _get_invitation(self, token: str) -> Invitation:
        invitation = (
            Invitation.objects.filter(token=token)
            .exclude(state=Invitation.State.DELETED)
            .select_related("event_model")
            .prefetch_related("event_model__preference_questions__options")
            .first()
        )
        if invitation is None:
            raise NotFound("Ce lien d'invitation n'est pas valide.")
        return invitation


class EventResponsesView(APIView):
    """``GET /api/events/{pk}/responses/`` — responses for one organizer's event.

    Returns a paginated list of individual responses plus a summary (response
    counts and per-option tallies) so the dashboard can show real aggregates.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        event = EventModel.objects.filter(pk=pk, organizer=request.user).first()
        if event is None:
            raise NotFound("Ressource introuvable.")

        responses = (
            GuestResponse.objects.filter(invitation__event_model=event)
            .select_related("invitation")
            .prefetch_related("answers__question", "answers__options")
            .order_by("-submitted_at")
        )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(responses, request)
        payload = paginator.get_paginated_response(GuestResponseSerializer(page, many=True).data).data
        payload["summary"] = self._summary(event)
        return Response(payload)

    @staticmethod
    def _summary(event: EventModel) -> dict:
        questions = []
        for question in event.preference_questions.filter(is_active=True).prefetch_related("options"):
            options = [
                {
                    "id": option.pk,
                    "label": option.label,
                    "count": GuestResponseAnswer.objects.filter(question=question, options=option)
                    .distinct()
                    .count(),
                }
                for option in question.options.all()
            ]
            questions.append(
                {
                    "id": question.pk,
                    "label": question.label,
                    "input_type": question.input_type,
                    "options": options,
                }
            )
        return {
            "invitations": event.invitations.exclude(state=Invitation.State.DELETED).count(),
            "responses": GuestResponse.objects.filter(invitation__event_model=event).count(),
            "questions": questions,
        }
