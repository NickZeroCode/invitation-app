"""Invitation template definitions.

A template is DATA: registry key + capabilities configuration. Rendering lives
in the React template registry (one component per design). Template code is
never executed from database content (product brief Section 7).
"""
from django.db import models


class InvitationTemplate(models.Model):
    class Category(models.TextChoices):
        WEDDING = "wedding", "Mariage"
        BIRTHDAY = "birthday", "Anniversaire"
        GRADUATION = "graduation", "Remise de diplômes"
        RECEPTION = "reception", "Réception / cérémonie"
        ANNIVERSARY = "anniversary", "Anniversaire de mariage"
        MEMORIAL = "memorial", "Hommage"
        CORPORATE = "corporate", "Entreprise"
        OTHER = "other", "Autre"

    key = models.SlugField("identifiant", max_length=64, unique=True)
    name = models.CharField("nom", max_length=120)
    category = models.CharField("catégorie", max_length=32, choices=Category.choices, default=Category.OTHER)
    description = models.TextField("description", blank=True)
    version = models.PositiveIntegerField("version", default=1)
    # Capabilities: {"supports_cover": true, "sections": [...], ...}
    config = models.JSONField("capacités", default=dict, blank=True)
    is_active = models.BooleanField("actif", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "modèle d'invitation"
        verbose_name_plural = "modèles d'invitation"
        ordering = ("category", "name")

    def __str__(self) -> str:
        return f"{self.name} ({self.key})"
