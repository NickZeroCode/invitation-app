"""Individual guest invitations.

Public access uses a cryptographically secure token as the only credential —
sequential database IDs are never exposed as access credentials (product brief
Sections 9–10). Validity is enforced by the backend on every request.
"""
from __future__ import annotations

import secrets
from datetime import timedelta

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

    # Per-guest seating (the "table" section): the table number assigned to
    # this guest and an optional free-text line shown with it. A blank number
    # keeps the section hidden on this guest's invitation (content-gated, like
    # the dress-code and programme sections).
    table_number = models.CharField("numéro de table", max_length=32, blank=True, default="")
    table_text = models.CharField("texte de table", max_length=255, blank=True, default="")
    # Optional link to the event's seating registry. The plain strings above
    # stay the source of truth for rendering (so a deleted registry row never
    # breaks an existing invitation); the FK only records which registry row
    # was picked. SET_NULL keeps the invitation intact when the table is
    # removed from the registry.
    table = models.ForeignKey(
        "events.EventTable",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invitations",
        verbose_name="table",
    )

    token = models.CharField(
        "jeton public", max_length=64, unique=True, default=generate_invitation_token, editable=False
    )
    state = models.CharField("état", max_length=16, choices=State.choices, default=State.ACTIVE)

    issued_at = models.DateTimeField("émise le", default=timezone_now, editable=False)
    expires_at = models.DateTimeField("expire le", null=True, blank=True)
    revoked_at = models.DateTimeField("révoquée le", null=True, blank=True)

    # Guest self-confirmation ("Confirmer la présence" on the public page):
    # null = not confirmed yet, otherwise the confirmation timestamp. Written
    # only through the public token-scoped endpoint and shown to the organizer
    # on the dashboard and the guest list.
    presence_confirmed_at = models.DateTimeField("présence confirmée le", null=True, blank=True)

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

    @classmethod
    def display_name_for(cls, guest_name: str, civility: str) -> str:
        """Visible guest label — the single format behind `display_name`."""
        if civility == cls.Civility.NONE:
            return guest_name
        label = dict(cls.Civility.choices).get(civility, civility)
        return f"{label} {guest_name}".strip()

    @property
    def display_name(self) -> str:
        return self.display_name_for(self.guest_name, self.civility)

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


def generate_verification_token() -> str:
    """256-bit, URL-safe, unguessable public identifier for a verification link."""
    return secrets.token_urlsafe(32)


class VerificationLink(models.Model):
    """Delegated, time-boxed QR-authenticity verification link (door staff).

    The organizer creates a link for ONE event with a mandatory expiry date and
    an authorization code the verifier must type in before scanning. Security
    invariants:

    * the link URL carries a 256-bit unguessable token (credential 1 of 2);
    * the authorization code is stored ONLY as a PBKDF2 hash (Django auth
      hashers, constant-time comparison) — never in clear text;
    * the code can be entered a limited number of times before the link locks
      (brute-force resistance on top of per-scope throttling);
    * every scan re-checks expiry/revocation, so revoking a link immediately
      kills in-flight verifier sessions;
    * scans are strictly scoped to this link's event — QR codes from other
      events verify as foreign and never leak that event's details.
    """

    MAX_CODE_LENGTH = 64
    LOCK_AFTER_ATTEMPTS = 5
    LOCK_DURATION_MINUTES = 15

    event_model = models.ForeignKey(EventModel, on_delete=models.CASCADE, related_name="verification_links")
    label = models.CharField("libellé", max_length=120, blank=True, default="")

    token = models.CharField(
        "jeton public", max_length=64, unique=True, default=generate_verification_token, editable=False
    )
    code_hash = models.CharField("empreinte du code d'autorisation", max_length=255)

    expires_at = models.DateTimeField("expire le")
    revoked_at = models.DateTimeField("révoquée le", null=True, blank=True)

    failed_attempts = models.PositiveIntegerField("tentatives échouées", default=0)
    locked_until = models.DateTimeField("verrouillé jusqu'à", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "lien de vérification"
        verbose_name_plural = "liens de vérification"
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["event_model", "expires_at"]),
        ]

    def __str__(self) -> str:
        return f"VerificationLink {self.label or self.pk} ({self.status})"

    def set_code(self, code: str) -> None:
        """Hash the authorization code (PBKDF2 + per-row salt)."""
        from django.contrib.auth.hashers import make_password

        self.code_hash = make_password(code)

    def check_code(self, code: str) -> bool:
        """Constant-time verification of a candidate authorization code."""
        from django.contrib.auth.hashers import check_password

        return check_password(code, self.code_hash)

    def register_failed_attempt(self) -> None:
        """Count a wrong code and lock the link once the threshold is reached."""
        self.failed_attempts += 1
        if self.failed_attempts >= self.LOCK_AFTER_ATTEMPTS:
            self.locked_until = timezone_now() + timedelta(minutes=self.LOCK_DURATION_MINUTES)
            self.failed_attempts = 0
        self.save(update_fields=["failed_attempts", "locked_until", "updated_at"])

    def reset_failed_attempts(self) -> None:
        if self.failed_attempts or self.locked_until is not None:
            self.failed_attempts = 0
            self.locked_until = None
            self.save(update_fields=["failed_attempts", "locked_until", "updated_at"])

    def is_locked(self) -> bool:
        return self.locked_until is not None and self.locked_until > timezone_now()

    def is_currently_active(self) -> bool:
        """Active = not revoked, not expired and not temporarily locked."""
        if self.revoked_at is not None:
            return False
        if self.expires_at <= timezone_now():
            return False
        return not self.is_locked()

    @property
    def status(self) -> str:
        """Derived, user-facing status for the organizer's link list."""
        if self.revoked_at is not None:
            return "revoked"
        if self.expires_at <= timezone_now():
            return "expired"
        return "active"
