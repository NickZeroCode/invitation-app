"""CRUD API for event invitation models (product brief Section 8).

Ownership is enforced by queryset scoping: an organizer can never read or
modify another organizer's events (IDOR-safe 404s). Cover uploads are
validated (type + size) and stored through the configured storage backend.
"""
from __future__ import annotations

import uuid

from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Count, Q
from rest_framework import serializers, status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import EventHasInvitationsError
from core.pagination import StandardPagination
from events.models import EventModel
from events.serializers import EventModelSerializer
from invitations.models import Invitation
from templates_app.models import InvitationTemplate

# Cover image policy (product brief Section 17: type + size limits).
COVER_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_COVER_BYTES = 5 * 1024 * 1024  # 5 MB


class CoverUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()


class EventModelViewSet(viewsets.ModelViewSet):
    serializer_class = EventModelSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = (
            EventModel.objects.filter(organizer=self.request.user)
            .select_related("template")
            .prefetch_related("preference_questions__options")
            .annotate(
                invitations_count=Count(
                    "invitations",
                    filter=~Q(invitations__state=Invitation.State.DELETED),
                    distinct=True,
                )
            )
        )

        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(title__icontains=query)

        category = self.request.query_params.get("category")
        if category in InvitationTemplate.Category.values:
            queryset = queryset.filter(template__category=category)

        is_active = self.request.query_params.get("is_active")
        if is_active in {"true", "1"}:
            queryset = queryset.filter(is_active=True)
        elif is_active in {"false", "0"}:
            queryset = queryset.filter(is_active=False)

        # Deterministic pagination order (annotations clear Meta ordering).
        return queryset.order_by("-event_date", "-created_at")

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """Deleting an event would cascade-destroy invitations — never silently."""
        event = self.get_object()
        if event.invitations.exists():
            raise EventHasInvitationsError()
        with transaction.atomic():
            if event.cover_image:
                event.cover_image.delete(save=False)
            event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventModelCoverView(APIView):
    """Upload (PUT) or remove (DELETE) the cover image of one event model."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request, pk):
        event = EventModel.objects.filter(pk=pk, organizer=request.user).first()
        if event is None:
            raise NotFound("Ressource introuvable.")

        serializer = CoverUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded = serializer.validated_data["image"]

        content_type = getattr(uploaded, "content_type", "") or ""
        extension = COVER_CONTENT_TYPES.get(content_type)
        if extension is None:
            raise serializers.ValidationError(
                {"image": "Format d'image non supporté (JPEG, PNG ou WebP uniquement)."}
            )
        if uploaded.size > MAX_COVER_BYTES:
            raise serializers.ValidationError(
                {"image": "L'image ne doit pas dépasser 5 Mo."}
            )

        with transaction.atomic():
            if event.cover_image:
                event.cover_image.delete(save=False)
            name = default_storage.save(
                f"covers/event-{event.pk}/{uuid.uuid4().hex}{extension}", uploaded
            )
            event.cover_image.name = name
            event.save(update_fields=["cover_image", "updated_at"])

        url = request.build_absolute_uri(event.cover_image.url)
        return Response({"cover_url": url, "updated_at": event.updated_at.isoformat()})

    def delete(self, request, pk):
        event = EventModel.objects.filter(pk=pk, organizer=request.user).first()
        if event is None:
            raise NotFound("Ressource introuvable.")
        with transaction.atomic():
            if event.cover_image:
                event.cover_image.delete(save=False)
                event.cover_image.name = ""
                event.save(update_fields=["cover_image", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
