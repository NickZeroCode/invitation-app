"""Serializers for guest preference questions and options.

Nested writes follow strict rules so guest responses can never be silently
invalidated (product brief Sections 8 and 13):

- questions with recorded answers cannot be removed and cannot change type;
- options already used in answers cannot be removed (labels may change, new
  options may be added);
- unanswered questions can be freely edited or removed.
"""
from __future__ import annotations

from django.db import transaction
from rest_framework import serializers

from .models import (
    GuestResponse,
    GuestResponseAnswer,
    PreferenceOption,
    PreferenceQuestion,
)

MAX_OPTIONS = 20
MAX_QUESTIONS = 20


class PreferenceOptionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = PreferenceOption
        fields = ("id", "label", "order")

    def validate_label(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Le libellé de l'option est obligatoire.")
        return value


class PreferenceQuestionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    options = PreferenceOptionSerializer(many=True)

    class Meta:
        model = PreferenceQuestion
        fields = ("id", "label", "help_text", "input_type", "required", "order", "is_active", "options")

    def validate_label(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("L'intitulé de la question est obligatoire.")
        return value

    def validate_options(self, value: list) -> list:
        if not value:
            raise serializers.ValidationError("Ajoutez au moins une option de réponse.")
        if len(value) > MAX_OPTIONS:
            raise serializers.ValidationError(f"Une question ne peut pas dépasser {MAX_OPTIONS} options.")
        # Partial updates may omit labels (kept unchanged); new options must
        # carry one (enforced by PreferenceOptionSerializer). Distinctness is
        # checked on the labels actually provided.
        labels = [option["label"].strip().lower() for option in value if "label" in option]
        if len(set(labels)) != len(labels):
            raise serializers.ValidationError("Les options doivent être distinctes.")
        return value

    def validate(self, attrs: dict) -> dict:
        instance = self.instance
        if instance is not None and instance.answers.exists():
            if "options" in attrs:
                incoming_ids = {o.get("id") for o in attrs["options"] if o.get("id") is not None}
                current_ids = set(instance.options.values_list("id", flat=True))
                if not current_ids.issubset(incoming_ids):
                    raise serializers.ValidationError(
                        {"options": "Impossible de retirer des options déjà utilisées dans des réponses."}
                    )
            if "input_type" in attrs and attrs["input_type"] != instance.input_type:
                raise serializers.ValidationError(
                    {"input_type": "Le type ne peut plus changer : des réponses utilisent cette question."}
                )
        return attrs

    def create(self, validated_data: dict) -> PreferenceQuestion:
        options_data = validated_data.pop("options")
        question = PreferenceQuestion.objects.create(**validated_data)
        self._sync_options(question, options_data, allow_removal=True)
        return question

    def update(self, instance: PreferenceQuestion, validated_data: dict) -> PreferenceQuestion:
        options_data = validated_data.pop("options", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if options_data is not None:
            self._sync_options(instance, options_data, allow_removal=not instance.answers.exists())
        return instance

    @staticmethod
    def _sync_options(question: PreferenceQuestion, options_data: list, allow_removal: bool) -> None:
        existing = {option.pk: option for option in question.options.all()}
        for position, data in enumerate(options_data):
            data.setdefault("order", position)
            option_id = data.pop("id", None)
            option = existing.pop(option_id, None) if option_id is not None else None
            if option_id is not None and option is None:
                raise serializers.ValidationError({"options": "Option inconnue."})
            if option is None:
                question.options.create(**data)
            else:
                for attr, value in data.items():
                    setattr(option, attr, value)
                option.save()
        if not existing:
            return
        if not allow_removal:
            raise serializers.ValidationError(
                {"options": "Impossible de retirer des options déjà utilisées dans des réponses."}
            )
        question.options.filter(pk__in=existing.keys()).delete()


# --- Guest responses (product brief Section 13) -------------------------


class GuestResponseAnswerSerializer(serializers.ModelSerializer):
    question = serializers.IntegerField(source="question_id", read_only=True)
    question_label = serializers.CharField(source="question.label", read_only=True)
    input_type = serializers.CharField(source="question.input_type", read_only=True)
    options = serializers.SerializerMethodField()

    class Meta:
        model = GuestResponseAnswer
        fields = ("question", "question_label", "input_type", "options")

    def get_options(self, obj: GuestResponseAnswer) -> list:
        return [{"id": option.pk, "label": option.label} for option in obj.options.all()]


class GuestResponseSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source="invitation.guest_name", read_only=True)
    display_name = serializers.CharField(source="invitation.display_name", read_only=True)
    invitation_status = serializers.SerializerMethodField()
    answers = GuestResponseAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = GuestResponse
        fields = (
            "id",
            "invitation",
            "guest_name",
            "display_name",
            "invitation_status",
            "submitted_at",
            "updated_at",
            "answers",
        )

    def get_invitation_status(self, obj: GuestResponse) -> str:
        return obj.invitation.status


class GuestResponseSubmissionSerializer(serializers.Serializer):
    """Validate and persist a guest's preference answers for one invitation.

    Row-indexed errors (``answers.2.options``) follow the same contract as the
    bulk invitation generator: each row is validated independently so the index
    is preserved. Answers are upserted — one response per invitation, editable
    until it expires (documented default). Required questions must be answered;
    single-choice questions accept exactly one option. Questions and options
    must belong to the invitation's event model — arbitrary values rejected.
    """

    answers = serializers.ListField(
        allow_empty=True,
        error_messages={
            "required": "La liste des réponses est obligatoire.",
            "not_a_list": "La liste des réponses est invalide.",
        },
    )

    def __init__(self, *args, **kwargs):
        self.event_model = kwargs.pop("event_model")
        self.invitation = kwargs.pop("invitation")
        super().__init__(*args, **kwargs)

    def validate_answers(self, value: list) -> list:
        questions = {q.pk: q for q in self.event_model.preference_questions.filter(is_active=True)}
        option_ids = {q.pk: {o.pk for o in q.options.all()} for q in questions.values()}
        errors: dict = {}
        seen: set[int] = set()
        normalized: list = []

        for index, row in enumerate(value):
            if not isinstance(row, dict):
                errors[str(index)] = {"non_field_errors": ["Réponse invalide."]}
                continue
            row_errors: dict = {}

            raw_question = row.get("question")
            question = None
            if not isinstance(raw_question, int):
                row_errors["question"] = ["Question invalide."]
            elif raw_question not in questions:
                row_errors["question"] = ["Question inconnue."]
            elif raw_question in seen:
                question = questions[raw_question]
                row_errors["question"] = ["Cette question apparaît plusieurs fois."]
            else:
                question = questions[raw_question]
                seen.add(raw_question)

            raw_options = row.get("options")
            if not isinstance(raw_options, list) or not raw_options or any(not isinstance(o, int) for o in raw_options):
                row_errors["options"] = ["Sélectionnez au moins une option."]
            elif question is not None:
                if len(set(raw_options)) != len(raw_options):
                    row_errors["options"] = ["Cette option apparaît plusieurs fois."]
                elif any(option not in option_ids[question.pk] for option in raw_options):
                    row_errors["options"] = ["Option invalide."]
                elif question.input_type == PreferenceQuestion.InputType.SINGLE and len(set(raw_options)) != 1:
                    row_errors["options"] = ["Choisissez une seule option."]

            if row_errors:
                errors[str(index)] = row_errors
            else:
                normalized.append({"question": question, "options": list(dict.fromkeys(raw_options))})

        if errors:
            raise serializers.ValidationError(errors)
        return normalized

    def validate(self, attrs: dict) -> dict:
        # Object-level so the error surfaces under a clean ``answers`` key
        # rather than being nested under the field (``answers.answers``).
        answers = attrs.get("answers", [])
        questions = {q.pk: q for q in self.event_model.preference_questions.filter(is_active=True)}
        answered = {item["question"].pk for item in answers}
        missing = [q for q in questions.values() if q.required and q.pk not in answered]
        if missing:
            raise serializers.ValidationError(
                {"answers": [f"La question « {missing[0].label} » est obligatoire."]}
            )
        return attrs

    def create(self, validated_data: dict) -> GuestResponse:
        answers = validated_data.get("answers", [])
        with transaction.atomic():
            response, _ = GuestResponse.objects.get_or_create(invitation=self.invitation)
            response.answers.all().delete()
            for item in answers:
                answer = GuestResponseAnswer.objects.create(response=response, question=item["question"])
                answer.options.set(item["options"])
            response.save(update_fields=["updated_at"])
        return response
