"""Serializers for the invitation template catalog.

Templates are DATA (registry key + capabilities configuration). The React
template registry owns rendering; nothing from `config` is ever executed.
"""
from __future__ import annotations

from rest_framework import serializers

from .models import InvitationTemplate

# Sections a template configuration may declare (product brief Section 7).
KNOWN_SECTIONS = (
    "cover",
    "guest",
    "title",
    "message",
    "date",
    "venue",
    "preferences",
    "qr",
    "footer",
)

# Event fields an organizer may emphasize when the template allows it.
KNOWN_EMPHASIS_FIELDS = ("title", "message", "date", "time", "venue")


def clean_template_config(config: dict) -> dict:
    """Validate a template configuration payload (defensive: admin-supplied).

    Returns the normalized config or raises ``ValueError`` with a
    user-facing French message.
    """
    if not isinstance(config, dict):
        raise ValueError("La configuration du modèle doit être un objet.")
    supports_cover = config.get("supports_cover", False)
    if not isinstance(supports_cover, bool):
        raise ValueError("« supports_cover » doit être un booléen.")

    sections = config.get("sections", [])
    if not isinstance(sections, list) or any(s not in KNOWN_SECTIONS for s in sections):
        raise ValueError("Sections de modèle invalides.")

    emphasis = config.get("emphasis_fields", [])
    if not isinstance(emphasis, list) or any(e not in KNOWN_EMPHASIS_FIELDS for e in emphasis):
        raise ValueError("Champs de mise en avant invalides.")

    return {"supports_cover": supports_cover, "sections": sections, "emphasis_fields": emphasis}


class InvitationTemplateSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    supports_cover = serializers.SerializerMethodField()

    class Meta:
        model = InvitationTemplate
        fields = (
            "key",
            "name",
            "category",
            "category_label",
            "description",
            "version",
            "supports_cover",
            "config",
        )

    def get_supports_cover(self, obj) -> bool:
        return bool(obj.config.get("supports_cover", False))
