"""Shared infrastructure models (activity / audit records)."""
from django.db import models

from accounts.models import Organizer


class ActivityLog(models.Model):
    """Append-only record of important organizer actions.

    Kept immutable from the normal application: entries are created by the
    backend when meaningful actions happen (refunds do not apply here, but
    invitation revocation, settings changes etc. will be recorded).
    """

    actor = models.ForeignKey(
        Organizer, null=True, blank=True, on_delete=models.SET_NULL, related_name="activity_logs"
    )
    action = models.CharField("action", max_length=64, db_index=True)
    target_type = models.CharField("ressource", max_length=64, blank=True)
    target_id = models.CharField("identifiant", max_length=64, blank=True)
    data = models.JSONField("détails", default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "journal d'activité"
        verbose_name_plural = "journal d'activité"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["target_type", "target_id"])]

    def __str__(self) -> str:
        return f"{self.action} ({self.target_type}:{self.target_id})"
