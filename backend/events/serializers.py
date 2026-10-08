"""Serializers for event invitation models.

Product brief Section 8. Shared event information (title, message, date,
venue, cover, display config) is deliberately stored on the model so that
editing it updates every invitation derived from the model; guest-specific
information lives on each invitation and is never touched by these writes.

Nested preference questions are managed as one coherent set inside a
transaction: provided questions with an `id` are updated, new ones created,
and omitted ones deleted — unless guest responses already reference them
(see `preferences.serializers`).
"""
from __future__ import annotations

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.db import transaction
from rest_framework import serializers

from events.models import (
    FONT_SIZE_KEYS,
    MESSAGE_FONT_KEYS,
    DressCodeImage,
    EventModel,
    ProgramItem,
)
from preferences.serializers import (
    MAX_QUESTIONS,
    PreferenceQuestionSerializer,
)
from templates_app.models import InvitationTemplate
from templates_app.serializers import InvitationTemplateSerializer, clean_template_config

VALID_DISPLAY_CONFIG_KEYS = {"emphasis"}

# Programme rows per event: a ceremony programme is a page, not a database.
MAX_PROGRAM_ITEMS = 20


class ProgramItemSerializer(serializers.ModelSerializer):
    # Writable so the coherent-set sync can upsert by id (same as questions).
    id = serializers.IntegerField(required=False)

    class Meta:
        model = ProgramItem
        fields = ("id", "start_time", "end_time", "description", "order")

    def validate_description(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("La description de l'étape est obligatoire.")
        return value

    def validate(self, attrs: dict) -> dict:
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if end and start and end <= start:
            raise serializers.ValidationError(
                {"end_time": "L'heure de fin doit être postérieure à l'heure de début."}
            )
        return attrs


class DressCodeImageSerializer(serializers.ModelSerializer):
    """Read shape for stored dress-code images (writes are multipart, see views)."""

    class Meta:
        model = DressCodeImage
        fields = ("id", "image", "caption", "order")


def _clear_question_prefetch(event: EventModel) -> None:
    """Drop stale prefetched question/option caches on the instance."""
    cache = getattr(event, "_prefetched_objects_cache", None)
    if cache:
        cache.pop("preference_questions", None)


class EventModelSerializer(serializers.ModelSerializer):
    # Stable, environment-independent reference: the template registry key.
    template = serializers.SlugRelatedField(
        slug_field="key",
        queryset=InvitationTemplate.objects.filter(is_active=True),
        error_messages={
            "does_not_exist": "Ce modèle n'existe pas ou n'est plus disponible.",
            "invalid": "Modèle invalide.",
        },
    )
    template_detail = InvitationTemplateSerializer(source="template", read_only=True)
    preference_questions = PreferenceQuestionSerializer(many=True, required=False)
    program_items = ProgramItemSerializer(many=True, required=False)
    dress_code = serializers.SerializerMethodField()
    invitations_count = serializers.IntegerField(read_only=True)
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = EventModel
        fields = (
            "id",
            "template",
            "template_detail",
            "title",
            "message",
            "message_font",
            "font_size",
            "event_date",
            "event_time",
            "timezone",
            "venue_name",
            "venue_address",
            "venue_details",
            "cover_url",
            "display_config",
            "preference_questions",
            "program_items",
            "dress_code",
            "invitations_count",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "cover_url", "dress_code", "created_at", "updated_at")

    def get_cover_url(self, obj: EventModel) -> str | None:
        if not obj.cover_image:
            return None
        url = obj.cover_image.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def get_dress_code(self, obj: EventModel) -> list[dict]:
        request = self.context.get("request")
        images = []
        for image in obj.dress_code_images.all():
            url = image.image.url
            images.append(
                {
                    "id": image.pk,
                    "url": request.build_absolute_uri(url) if request else url,
                    "caption": image.caption,
                    "order": image.order,
                }
            )
        return images

    # --- Validation ------------------------------------------------------

    def validate_timezone(self, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise serializers.ValidationError("Fuseau horaire invalide.")
        return value

    def validate_title(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Le titre de l'événement est obligatoire.")
        return value

    def validate_message_font(self, value: str) -> str:
        value = (value or "").strip()
        if value and value not in MESSAGE_FONT_KEYS:
            raise serializers.ValidationError("Police du message invalide.")
        return value

    def validate_font_size(self, value: str) -> str:
        value = (value or "").strip()
        if value and value not in FONT_SIZE_KEYS:
            raise serializers.ValidationError("Taille du texte invalide.")
        return value

    def validate_display_config(self, value: dict) -> dict:
        if not isinstance(value, dict):
            raise serializers.ValidationError("La mise en forme doit être un objet.")
        unknown = set(value) - VALID_DISPLAY_CONFIG_KEYS
        if unknown:
            raise serializers.ValidationError(
                "Clés de mise en forme non supportées : " + ", ".join(sorted(unknown)) + "."
            )
        emphasis = value.get("emphasis", [])
        if not isinstance(emphasis, list) or any(not isinstance(item, str) for item in emphasis):
            raise serializers.ValidationError({"emphasis": "La mise en avant doit être une liste de champs."})
        if len(set(emphasis)) != len(emphasis):
            raise serializers.ValidationError({"emphasis": "La liste contient des doublons."})
        return value

    def validate(self, attrs: dict) -> dict:
        # Template capabilities bound display_config (never trust the client).
        template: InvitationTemplate | None = attrs.get("template") or getattr(self.instance, "template", None)
        display = attrs.get("display_config", getattr(self.instance, "display_config", None) or {})
        if display and template is not None:
            try:
                capabilities = clean_template_config(template.config)
            except ValueError:
                capabilities = {"emphasis_fields": []}
            allowed = set(capabilities["emphasis_fields"])
            invalid = [field for field in display.get("emphasis", []) if field not in allowed]
            if invalid:
                raise serializers.ValidationError(
                    {
                        "display_config": {
                            "emphasis": "Champs non supportés par ce modèle : " + ", ".join(invalid) + "."
                        }
                    }
                )

        questions = attrs.get("preference_questions")
        if questions is not None and len(questions) > MAX_QUESTIONS:
            raise serializers.ValidationError(
                {"preference_questions": f"Un événement ne peut pas dépasser {MAX_QUESTIONS} questions."}
            )
        program_items = attrs.get("program_items")
        if program_items is not None and len(program_items) > MAX_PROGRAM_ITEMS:
            raise serializers.ValidationError(
                {"program_items": f"Le programme ne peut pas dépasser {MAX_PROGRAM_ITEMS} étapes."}
            )
        return attrs

    # --- Nested preference questions ------------------------------------

    def create(self, validated_data: dict) -> EventModel:
        questions_data = validated_data.pop("preference_questions", [])
        program_items_data = validated_data.pop("program_items", [])
        with transaction.atomic():
            event = EventModel.objects.create(**validated_data)
            self._sync_questions(event, questions_data)
            self._sync_program_items(event, program_items_data)
        # Mirror the list annotation so create responses carry the count.
        event.invitations_count = 0
        return event

    def update(self, instance: EventModel, validated_data: dict) -> EventModel:
        questions_data = validated_data.pop("preference_questions", None)
        program_items_data = validated_data.pop("program_items", None)
        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if questions_data is not None:
                self._sync_questions(instance, questions_data)
            if program_items_data is not None:
                self._sync_program_items(instance, program_items_data)
        return instance

    @staticmethod
    def _sync_questions(event: EventModel, questions_data: list) -> None:
        # Nested writes must see fresh data: the retrieve queryset prefetches
        # questions/options and would otherwise leak stale rows into edits.
        _clear_question_prefetch(event)
        existing = {question.pk: question for question in event.preference_questions.all()}
        touched: set[int] = set()
        for position, data in enumerate(questions_data):
            data = dict(data)
            data.setdefault("order", position)
            question_id = data.pop("id", None)
            question = None
            if question_id is not None:
                if question_id in touched:
                    raise serializers.ValidationError(
                        {"preference_questions": "Question citée plusieurs fois."}
                    )
                question = existing.get(question_id)
                if question is None:
                    raise serializers.ValidationError({"preference_questions": "Question inconnue."})
                touched.add(question_id)
            serializer = PreferenceQuestionSerializer(instance=question, data=data, partial=question is not None)
            try:
                serializer.is_valid(raise_exception=True)
                serializer.save(event_model=event)
            except serializers.ValidationError as exc:
                raise serializers.ValidationError({"preference_questions": exc.detail})

        for question_id, question in existing.items():
            if question_id in touched:
                continue
            if question.answers.exists():
                raise serializers.ValidationError(
                    {
                        "preference_questions": (
                            f"La question « {question.label} » a déjà des réponses et ne peut pas être supprimée."
                        )
                    }
                )
            question.delete()
        _clear_question_prefetch(event)

    @staticmethod
    def _sync_program_items(event: EventModel, items_data: list) -> None:
        # Same coherent-set semantics as preference questions: provided rows
        # with an `id` are updated, new ones created, omitted ones deleted.
        # Programme rows carry no guest data, so deletions are always safe.
        cache = getattr(event, "_prefetched_objects_cache", None)
        if cache:
            cache.pop("program_items", None)
        existing = {item.pk: item for item in event.program_items.all()}
        touched: set[int] = set()
        for position, data in enumerate(items_data):
            data = dict(data)
            data.setdefault("order", position)
            item_id = data.pop("id", None)
            item = None
            if item_id is not None:
                if item_id in touched:
                    raise serializers.ValidationError(
                        {"program_items": "Étape citée plusieurs fois."}
                    )
                item = existing.get(item_id)
                if item is None:
                    raise serializers.ValidationError({"program_items": "Étape inconnue."})
                touched.add(item_id)
            serializer = ProgramItemSerializer(instance=item, data=data, partial=item is not None)
            try:
                serializer.is_valid(raise_exception=True)
                serializer.save(event=event)
            except serializers.ValidationError as exc:
                raise serializers.ValidationError({"program_items": exc.detail})

        for item_id, item in existing.items():
            if item_id not in touched:
                item.delete()
        if cache:
            cache.pop("program_items", None)
