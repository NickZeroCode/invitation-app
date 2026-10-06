"""Event invitation models: the shared information for one event.

Structured event data (date, time, venue, cover) is kept separate from the
main invitation message (product brief Section 8).
"""
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.core.exceptions import ValidationError
from django.db import models

from accounts.models import Organizer
from templates_app.models import InvitationTemplate


class EventModel(models.Model):
    organizer = models.ForeignKey(Organizer, on_delete=models.CASCADE, related_name="event_models")
    template = models.ForeignKey(InvitationTemplate, on_delete=models.PROTECT, related_name="event_models")

    title = models.CharField("titre de l'événement", max_length=200)
    message = models.TextField("message d'invitation", blank=True)

    event_date = models.DateField("date de l'événement")
    event_time = models.TimeField("heure de l'événement")
    timezone = models.CharField("fuseau horaire", max_length=64, default="Africa/Kinshasa")

    venue_name = models.CharField("lieu", max_length=200, blank=True)
    venue_address = models.CharField("adresse", max_length=255, blank=True)
    venue_details = models.TextField("précisions sur le lieu", blank=True)

    cover_image = models.ImageField("image de couverture", upload_to="covers/%Y/%m/", blank=True)
    # Per-template display/emphasis configuration (validated by the API layer).
    display_config = models.JSONField("mise en forme", default=dict, blank=True)

    is_active = models.BooleanField("actif", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "modèle d'événement"
        verbose_name_plural = "modèles d'événements"
        ordering = ("-event_date", "-created_at")
        indexes = [models.Index(fields=["organizer", "event_date"])]

    def __str__(self) -> str:
        return f"{self.title} — {self.event_date.isoformat()}"

    def clean(self):
        super().clean()
        try:
            ZoneInfo(self.timezone)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValidationError({"timezone": "Fuseau horaire invalide."})
