"""Individual guest invitations.

Public access uses a cryptographically secure token as the only credential —
sequential database IDs are never exposed as access credentials (product brief
Sections 9–10). Validity is enforced by the backend on every request.
"""
from __future__ import annotations

import secrets

from django.db import models
from django.db.models import CheckConstraint, F, Q
from django.utils.timezone import now as timezone_now

from events.models import EventModel


def generate_invitation_token() -> str:
    """256-bit, URL-safe, unguessable public identifier."""
    return secrets.token_urlsafe(32)


class Invitation(models.Model):
    class State(models.TextChoices):
        ACTIVE = "active", "Active"
        REVOKED = "revoked", "Révoquée"
        EXPIRED = "expired", "Expirée"
        DELETED = "deleted", "Supprimée"

    class Civility(models.TextChoices):
        NONE = "none", "—"
        M = "m", "M."
        MME = "mme", "Mme"
        MLLE = "mlle", "Mlle"
        COUPLE = "couple", "M. & Mme"

    event_model = models.ForeignKey(EventModel, on_delete=models.CASCADE, related_name="invitations")
    guest_name = models.CharField("nom de l'invité", max_length=200)
    civility = models.CharField("civilité", max_length=16, choices=Civility.choices, default=Civility.NONE)

    token = models.CharField(
        "jeton public", max_length=64, unique=True, default=generate_invitation_token, editable=False
    )
    state = models.CharField("état", max_length=16, choices=State.choices, default=State.ACTIVE)

    issued_at = models.DateTimeField("émise le", default=timezone_now, editable=False)
    expires_at = models.DateTimeField("expire le", null=True, blank=True)
    revoked_at = models.DateTimeField("révoquée le", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "invitation"
        verbose_name_plural = "invitations"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["event_model", "state"]),
        ]
        constraints = [
            CheckConstraint(
                condition=Q(expires_at__isnull=True) | Q(expires_at__gt=F("issued_at")),
                name="invitation_expiry_after_issue",
            ),
        ]

    def __str__(self) -> str:
        return f"Invitation {self.guest_name} ({self.state})"

    @property
    def display_name(self) -> str:
        if self.civility == self.Civility.NONE:
            return self.guest_name
        return f"{self.get_civility_display()} {self.guest_name}".strip()

    def is_currently_valid(self) -> bool:
        """Valid = active state AND not past expiry. Backend authority."""
        if self.state != self.State.ACTIVE:
            return False
        if self.expires_at is not None and self.expires_at <= timezone_now():
            return False
        return True

    @property
    def status(self) -> str:
        """Derived, user-facing status (stored state combined with expiry).

        An ACTIVE invitation past its expiry reads as ``expired`` so dashboards,
        public pages and QR verification agree with the effective state. A
        deleted tombstone keeps its own state so callers can filter it out.
        """
        if self.state in (self.State.DELETED, self.State.REVOKED):
            return self.state
        if not self.is_currently_valid():
            return self.State.EXPIRED
        return self.State.ACTIVE
