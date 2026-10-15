"""CRUD API for event invitation models (product brief Section 8).

Ownership is enforced by queryset scoping: an organizer can never read or
modify another organizer's events (IDOR-safe 404s). Cover uploads are
validated (type + size) and stored through the configured storage backend.
"""
from __future__ import annotations

import os
import uuid

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.deletion import ProtectedError
from django.http import HttpResponse
from rest_framework import serializers, status, viewsets
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.exceptions import EventHasInvitationsError, EventHasResponsesError
from core.imaging import ImageRejected, optimize_image
from core.pagination import StandardPagination
from events.models import DressCodeImage, EventModel, EventTable
from events.serializers import EventModelSerializer
from invitations.models import Invitation
from templates_app.models import InvitationTemplate

# Cover image policy (product brief Section 17: type + size limits).
COVER_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_COVER_BYTES = 4 * 1024 * 1024  # 4 MB: under Vercel Functions' 4.5 MB request
# body cap (a 5 MB body is rejected 413 before Django validates).


def optimized_upload(uploaded) -> ContentFile:
    """Run a validated upload through the image optimiser.

    Returns a ``ContentFile`` whose name carries the final extension (the
    optimiser may switch format, e.g. a PNG photo to lossless WebP).
    """
    uploaded.seek(0)
    try:
        result = optimize_image(uploaded.read())
    except ImageRejected as exc:
        raise serializers.ValidationError({"image": str(exc)}) from exc
    return ContentFile(result.content, name=f"image{result.extension}")


class CoverUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()


class DressCodeUploadSerializer(serializers.Serializer):
    image = serializers.ImageField()
    caption = serializers.CharField(required=False, allow_blank=True, max_length=255, default="")
    order = serializers.IntegerField(required=False, min_value=0)


class DressCodePatchSerializer(serializers.Serializer):
    caption = serializers.CharField(required=False, allow_blank=True, max_length=255)
    order = serializers.IntegerField(required=False, min_value=0)


class EventTableSerializer(serializers.Serializer):
    """Read shape for one seating-registry table."""

    id = serializers.IntegerField(read_only=True)
    number = serializers.CharField(read_only=True)
    text = serializers.CharField(read_only=True)
    order = serializers.IntegerField(read_only=True)


class EventTableWriteSerializer(serializers.Serializer):
    """Create/patch a seating-registry table (organizer input, French messages)."""

    number = serializers.CharField(
        max_length=32,
        error_messages={
            "required": "Le numéro de table est obligatoire.",
            "blank": "Le numéro de table est obligatoire.",
            "max_length": "Le numéro de table ne doit pas dépasser 32 caractères.",
        },
    )
    text = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
        default="",
        error_messages={"max_length": "Le texte de table ne doit pas dépasser 255 caractères."},
    )
    order = serializers.IntegerField(required=False, min_value=0)

    def validate_number(self, value: str) -> str:
        return value.strip()

    def validate_text(self, value: str) -> str:
        return value.strip()


class EventModelViewSet(viewsets.ModelViewSet):
    serializer_class = EventModelSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        queryset = (
            EventModel.objects.filter(organizer=self.request.user)
            .select_related("template")
            .prefetch_related("preference_questions__options", "program_items", "dress_code_images")
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
        """Deleting an event would cascade-destroy invitations — never silently.

        Soft-deleted (tombstoned) invitations count as already removed, so an
        organizer who cleared the guest list can delete the event model.
        Recorded guest answers are PROTECT at the model layer, so a delete
        that reaches answered questions is refused with a clean domain error
        instead of a server error.
        """
        event = self.get_object()
        if event.invitations.exclude(state=Invitation.State.DELETED).exists():
            raise EventHasInvitationsError()
        cover = event.cover_image
        dress_code_files = [item.image for item in event.dress_code_images.all()]
        with transaction.atomic():
            try:
                event.delete()
            except ProtectedError as exc:
                # GuestResponseAnswer.question is PROTECT: recorded answers
                # must never be silently destroyed along with the event.
                raise EventHasResponsesError() from exc
        # Storage cleanup runs only after the row delete succeeded, so a
        # blocked deletion can never leave the event coverless in S3.
        if cover:
            cover.delete(save=False)
        for image in dress_code_files:
            image.delete(save=False)
        return Response(status=status.HTTP_204_NO_CONTENT)


IMAGE_FILE_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def image_file_response(field_file) -> HttpResponse:
    """Serve a stored picture's bytes through the API (same origin as the app).

    The PDF export needs the raw pixels in the browser. Direct storage URLs are
    presigned (they expire after an hour) and need a CORS policy on the bucket;
    either one failing used to leave an empty photo frame in the PDF. This
    endpoint has neither dependency: it is authenticated, organizer-scoped and
    answers from the same origin as the application.
    """
    if not field_file:
        raise NotFound("Ressource introuvable.")
    try:
        field_file.open("rb")
        try:
            content = field_file.read()
        finally:
            field_file.close()
    except (FileNotFoundError, OSError) as exc:
        raise NotFound("Ressource introuvable.") from exc
    content_type = IMAGE_FILE_TYPES.get(
        os.path.splitext(field_file.name)[1].lower(), "application/octet-stream"
    )
    response = HttpResponse(content, content_type=content_type)
    # A replaced cover keeps its URL: never let a cache hand back the old one.
    response["Cache-Control"] = "private, no-store"
    return response


class EventCoverFileView(APIView):
    """``GET /api/events/<pk>/cover/file/`` — the cover picture's bytes."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = EventModel.objects.filter(pk=pk, organizer=request.user).first()
        if event is None:
            raise NotFound("Ressource introuvable.")
        return image_file_response(event.cover_image)


class EventDressCodeFileView(APIView):
    """``GET /api/events/<pk>/dress-code/<item_pk>/file/`` — one gallery picture."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk, item_pk):
        item = DressCodeImage.objects.filter(
            pk=item_pk, event__pk=pk, event__organizer=request.user
        ).first()
        if item is None:
            raise NotFound("Ressource introuvable.")
        return image_file_response(item.image)


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
                {"image": "L'image ne doit pas dépasser 4 Mo."}
            )

        optimized = optimized_upload(uploaded)
        extension = os.path.splitext(optimized.name)[1]

        with transaction.atomic():
            if event.cover_image:
                event.cover_image.delete(save=False)
            name = default_storage.save(
                f"covers/event-{event.pk}/{uuid.uuid4().hex}{extension}", optimized
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


class EventDressCodeView(APIView):
    """``POST /api/events/<pk>/dress-code/`` — add one dress-code image.

    Same upload policy as the cover (whitelisted types, 4 MB cap) and the
    same ownership scoping. Captions and ordering travel with the upload so
    the editor can persist a row in one round trip.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        event = EventModel.objects.filter(pk=pk, organizer=request.user).first()
        if event is None:
            raise NotFound("Ressource introuvable.")

        serializer = DressCodeUploadSerializer(data=request.data)
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
                {"image": "L'image ne doit pas dépasser 4 Mo."}
            )

        order = serializer.validated_data.get("order")
        if order is None:
            last = event.dress_code_images.order_by("-order", "-id").first()
            order = (last.order + 1) if last else 0

        optimized = optimized_upload(uploaded)
        extension = os.path.splitext(optimized.name)[1]

        with transaction.atomic():
            name = default_storage.save(
                f"dress-code/event-{event.pk}/{uuid.uuid4().hex}{extension}", optimized
            )
            item = DressCodeImage.objects.create(
                event=event,
                image=name,
                caption=serializer.validated_data.get("caption", "").strip(),
                order=order,
            )

        url = request.build_absolute_uri(item.image.url)
        return Response(
            {"id": item.pk, "url": url, "caption": item.caption, "order": item.order},
            status=status.HTTP_201_CREATED,
        )


class EventDressCodeItemView(APIView):
    """``PATCH/DELETE /api/events/<pk>/dress-code/<item_pk>/`` — caption/order or removal."""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, item_pk):
        item = (
            DressCodeImage.objects.filter(pk=item_pk, event__pk=pk, event__organizer=request.user)
            .select_related("event")
            .first()
        )
        if item is None:
            raise NotFound("Ressource introuvable.")

        serializer = DressCodePatchSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            if "caption" in serializer.validated_data:
                item.caption = serializer.validated_data["caption"].strip()
            if "order" in serializer.validated_data:
                item.order = serializer.validated_data["order"]
            item.save()

        url = request.build_absolute_uri(item.image.url)
        return Response({"id": item.pk, "url": url, "caption": item.caption, "order": item.order})

    def delete(self, request, pk, item_pk):
        item = (
            DressCodeImage.objects.filter(pk=item_pk, event__pk=pk, event__organizer=request.user)
            .select_related("event")
            .first()
        )
        if item is None:
            raise NotFound("Ressource introuvable.")
        with transaction.atomic():
            item.image.delete(save=False)
            item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _get_owned_event(request, pk) -> EventModel:
    """Organizer-scoped event lookup shared by the nested table endpoints."""
    event = EventModel.objects.filter(pk=pk, organizer=request.user).first()
    if event is None:
        raise NotFound("Ressource introuvable.")
    return event


class EventTablesView(APIView):
    """``GET/POST /api/events/<pk>/tables/`` — the event's seating registry.

    The registry is a convenience for quick table assignment when issuing
    invitations; it never rewrites existing invitations (each invitation
    keeps its own copied table strings).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = _get_owned_event(request, pk)
        tables = event.tables.all()
        return Response(EventTableSerializer(tables, many=True).data)

    def post(self, request, pk):
        event = _get_owned_event(request, pk)
        serializer = EventTableWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = serializer.validated_data.get("order")
        if order is None:
            last = event.tables.order_by("-order", "-id").first()
            order = (last.order + 1) if last else 0

        table = EventTable.objects.create(
            event=event,
            number=serializer.validated_data["number"],
            text=serializer.validated_data.get("text", ""),
            order=order,
        )
        return Response(EventTableSerializer(table).data, status=status.HTTP_201_CREATED)


class EventTableItemView(APIView):
    """``PATCH/DELETE /api/events/<pk>/tables/<table_pk>/`` — rename/reorder/remove."""

    permission_classes = [IsAuthenticated]

    def _get_table(self, request, pk, table_pk) -> EventTable:
        table = EventTable.objects.filter(
            pk=table_pk, event__pk=pk, event__organizer=request.user
        ).first()
        if table is None:
            raise NotFound("Ressource introuvable.")
        return table

    def patch(self, request, pk, table_pk):
        table = self._get_table(request, pk, table_pk)
        serializer = EventTableWriteSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if "number" in serializer.validated_data:
            table.number = serializer.validated_data["number"]
        if "text" in serializer.validated_data:
            table.text = serializer.validated_data["text"]
        if "order" in serializer.validated_data:
            table.order = serializer.validated_data["order"]
        table.save()
        return Response(EventTableSerializer(table).data)

    def delete(self, request, pk, table_pk):
        table = self._get_table(request, pk, table_pk)
        # SET_NULL on Invitation.table keeps existing invitations intact.
        table.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
