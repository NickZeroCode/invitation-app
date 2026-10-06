"""Serializers for guest preference questions and options.

Nested writes follow strict rules so guest responses can never be silently
invalidated (product brief Sections 8 and 13):

- questions with recorded answers cannot be removed and cannot change type;
- options already used in answers cannot be removed (labels may change, new
  options may be added);
- unanswered questions can be freely edited or removed.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import PreferenceOption, PreferenceQuestion

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
