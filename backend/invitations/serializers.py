"""Serializers for individual guest invitations (product brief Section 9).

An invitation is guest-specific data (name, civility, expiry, state) hanging
off a shared event model. The public `token` is the only credential guests
ever need; it is surfaced to the authenticated organizer so links can be
copied and shared, and is never guessable (256-bit, `secrets.token_urlsafe`).

Lifecycle semantics mirror the dashboard (core/views.py): the stored `state`
is authoritative, while `status` reports the *effective* state — an `active`
invitation past its expiry is presented (and filtered) as `expired`.
Revocation and deletion are organizer actions (`/revoke/`, `DELETE`), never
plain field writes: `state` is read-only everywhere else.
"""
from __future__ import annotations

from django.db.models import Exists, OuterRef
from django.utils.timezone import now as timezone_now
from rest_framework import serializers

from core.exceptions import DomainValidationError
from events.models import EventTable
from invitations.models import Invitation, VerificationLink
from preferences.models import GuestResponse


def guest_identity(guest_name: str, civility: str) -> str:
    """Identity key for the *visible* guest label.

    The organizer's guest list shows `display_name`, so « M. Éric » and
    « Éric » are two different guests and the civility prefix is part of the
    identity. Case and whitespace runs are folded in Python so « Éric » and
    « éric  » collide the same way on SQLite and Postgres.
    """
    label = Invitation.display_name_for(guest_name, civility)
    return " ".join(label.split()).casefold()


class InvitationSerializer(serializers.ModelSerializer):
    event = serializers.IntegerField(source="event_model_id", read_only=True)
    event_title = serializers.CharField(source="event_model.title", read_only=True)
    display_name = serializers.CharField(read_only=True)
    status = serializers.SerializerMethodField()
    is_valid = serializers.SerializerMethodField()
    has_response = serializers.SerializerMethodField()
    # French, user-safe messages for every rejection path (project contract).
    guest_name = serializers.CharField(
        max_length=200,
        error_messages={
            "required": "Le nom de l'invité est obligatoire.",
            "blank": "Le nom de l'invité est obligatoire.",
            "max_length": "Le nom de l'invité ne doit pas dépasser 200 caractères.",
        },
    )
    civility = serializers.ChoiceField(
        choices=Invitation.Civility.choices,
        required=False,
        default=Invitation.Civility.NONE,
        error_messages={"invalid_choice": "Civilité invalide."},
    )
    # Per-guest seating (content-gated section): both fields are optional and
    # trimmed; the number alone enables the section, the text decorates it.
    table_number = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=32,
        error_messages={"max_length": "Le numéro de table ne doit pas dépasser 32 caractères."},
    )
    table_text = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
        error_messages={"max_length": "Le texte de table ne doit pas dépasser 255 caractères."},
    )
    # Seating-registry pick: passing a registry id copies the table's number
    # and text onto the invitation and links the FK. The plain string fields
    # stay accepted directly (backward compatible — textual tables keep
    # working); an explicit id takes precedence over the strings.
    table = serializers.PrimaryKeyRelatedField(
        queryset=EventTable.objects.all(),
        required=False,
        allow_null=True,
        error_messages={
            "does_not_exist": "Cette table n'existe pas.",
            "incorrect_type": "Table invalide.",
        },
    )
    expires_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        error_messages={"invalid": "Format de date invalide."},
    )

    class Meta:
        model = Invitation
        fields = (
            "id",
            "event",
            "event_title",
            "guest_name",
            "civility",
            "table_number",
            "table_text",
            "table",
            "display_name",
            "token",
            "issued_at",
            "expires_at",
            "state",
            "status",
            "is_valid",
            "has_response",
            "presence_confirmed_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "event",
            "event_title",
            "display_name",
            "token",
            "issued_at",
            "state",
            "status",
            "is_valid",
            "has_response",
            "presence_confirmed_at",
            "created_at",
            "updated_at",
        )

    # --- Derived display fields ----------------------------------------

    def get_status(self, obj: Invitation) -> str:
        return obj.status

    def get_is_valid(self, obj: Invitation) -> bool:
        return obj.is_currently_valid()

    def get_has_response(self, obj: Invitation) -> bool:
        annotated = getattr(obj, "has_response", None)
        if annotated is not None:
            return bool(annotated)
        return GuestResponse.objects.filter(invitation=obj).exists()

    # --- Validation ----------------------------------------------------

    def validate_guest_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Le nom de l'invité est obligatoire.")
        return value

    def validate_expires_at(self, value):
        if value is not None and value <= timezone_now():
            raise serializers.ValidationError("La date d'expiration doit être dans le futur.")
        return value

    def validate(self, attrs: dict) -> dict:
        # Creation is refused on deactivated events; managing existing
        # invitations (revoke, rename, delete) stays possible.
        if self.instance is None:
            event = self.context.get("event")
            if event is not None and not event.is_active:
                raise DomainValidationError("Cet événement est désactivé.")
            guest_name = attrs.get("guest_name", "")
            civility = attrs.get("civility", Invitation.Civility.NONE)
            previous_identity = None
        else:
            event = self.instance.event_model
            guest_name = attrs.get("guest_name", self.instance.guest_name)
            civility = attrs.get("civility", self.instance.civility)
            previous_identity = guest_identity(self.instance.guest_name, self.instance.civility)

        # Seating-registry pick: a provided `table` id must belong to this
        # event (IDOR-safe), then its number/text are copied onto the
        # invitation so the plain strings stay the rendering source of truth.
        # An explicit `null` clears the link without touching the strings;
        # omitting `table` leaves both link and strings as provided/default.
        if "table" in attrs:
            picked = attrs["table"]
            if picked is not None:
                if event is not None and picked.event_id != event.pk:
                    raise serializers.ValidationError(
                        {"table": "Cette table n'appartient pas à cet événement."}
                    )
                attrs["table_number"] = picked.number
                attrs["table_text"] = picked.text

        # A guest keeps at most one live (active or expired) invitation per
        # event; re-issuing a link for the same guest goes through the
        # explicit "duplicate" action, which is exempt from this rule.
        # Identity is the *visible* label (civility-aware): « M. Éric » and
        # « Éric » are two different guests in the organizer's list. An edit
        # that does not change the guest identity is never refused — the row
        # cannot collide with itself.
        target = guest_identity(guest_name, civility)
        if target != previous_identity and self.context.get("check_duplicate_name", True):
            event = self.context.get("event") or (self.instance.event_model if self.instance else None)
            if event is not None:
                clashes = Invitation.objects.filter(event_model=event).exclude(
                    state__in=[Invitation.State.REVOKED, Invitation.State.DELETED]
                )
                if self.instance is not None:
                    clashes = clashes.exclude(pk=self.instance.pk)
                if any(
                    guest_identity(name, civ) == target
                    for name, civ in clashes.values_list("guest_name", "civility")
                ):
                    # Name the guest so the organizer knows exactly which
                    # invitation collided — crucial when the error surfaces
                    # from a bulk row rather than the single-add form.
                    label = Invitation.display_name_for(guest_name, civility)
                    raise serializers.ValidationError(
                        {
                            "guest_name": f"« {label} » a déjà une invitation pour cet événement."
                        }
                    )
        return attrs


class InvitationBulkSerializer(serializers.Serializer):
    """Batch generation from a guest list (product brief Section 9).

    All-or-nothing: every row is validated first (including same-name
    duplicates inside the batch), then all invitations are created in one
    transaction. Rows are validated individually so every error keeps its
    original row number (`invitations.2.guest_name`) and the UI can point at
    the offending line.
    """

    MAX_ITEMS = 500

    invitations = serializers.ListField(
        allow_empty=False,
        error_messages={
            "required": "La liste des invités est obligatoire.",
            "not_a_list": "La liste des invités est invalide.",
            "empty": "La liste des invités est vide.",
        },
    )

    def validate_invitations(self, value: list) -> list:
        if len(value) > self.MAX_ITEMS:
            raise serializers.ValidationError(
                f"La liste ne peut pas dépasser {self.MAX_ITEMS} invités par génération."
            )
        event = self.context["event"]
        cleaned: list = []
        errors: dict = {}
        seen: dict[str, int] = {}
        for index, row in enumerate(value):
            if not isinstance(row, dict):
                errors[index] = {"non_field_errors": ["Invité invalide."]}
                continue
            row_serializer = InvitationSerializer(data=row, context={"event": event})
            if not row_serializer.is_valid():
                errors[index] = dict(row_serializer.errors)
                continue
            row_data = row_serializer.validated_data
            name = guest_identity(row_data["guest_name"], row_data.get("civility", Invitation.Civility.NONE))
            if name in seen:
                label = Invitation.display_name_for(
                    row_data["guest_name"], row_data.get("civility", Invitation.Civility.NONE)
                )
                errors[index] = {"guest_name": [f"« {label} » apparaît plusieurs fois dans la liste."]}
                continue
            seen[name] = index
            cleaned.append(row_data)
        if errors:
            raise serializers.ValidationError(errors)
        return cleaned

    def create(self, validated_data: dict) -> dict:
        rows = validated_data["invitations"]
        event = self.context["event"]
        invitations = [Invitation.objects.create(event_model=event, **row) for row in rows]
        return {"count": len(invitations), "invitations": invitations}


class VerificationLinkSerializer(serializers.ModelSerializer):
    """Organizer-facing verification link (delegated door verification).

    `code` is WRITE-ONLY and stored hashed (PBKDF2) — it never comes back in
    any response. The link URL is composed client-side from `token`, exactly
    like guest invitation links (`/verification/<token>`).
    """

    status = serializers.SerializerMethodField()
    code = serializers.CharField(
        write_only=True,
        min_length=6,
        max_length=VerificationLink.MAX_CODE_LENGTH,
        error_messages={
            "required": "Le code d'autorisation est obligatoire.",
            "blank": "Le code d'autorisation est obligatoire.",
            "min_length": "Le code d'autorisation doit contenir au moins 6 caractères.",
            "max_length": "Le code d'autorisation ne doit pas dépasser 64 caractères.",
        },
    )
    expires_at = serializers.DateTimeField(
        error_messages={
            "required": "La date d'expiration est obligatoire.",
            "invalid": "Format de date invalide.",
        },
    )
    label = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=120,
        error_messages={"max_length": "Le libellé ne doit pas dépasser 120 caractères."},
    )

    class Meta:
        model = VerificationLink
        fields = (
            "id",
            "label",
            "token",
            "status",
            "expires_at",
            "revoked_at",
            "created_at",
            "code",
        )
        read_only_fields = ("id", "token", "status", "revoked_at", "created_at")

    def get_status(self, obj: VerificationLink) -> str:
        return obj.status

    def validate_expires_at(self, value):
        if value <= timezone_now():
            raise serializers.ValidationError("La date d'expiration doit être dans le futur.")
        return value

    def create(self, validated_data: dict) -> VerificationLink:
        code = validated_data.pop("code")
        link = VerificationLink(event_model=self.context["event"], **validated_data)
        link.set_code(code)
        link.save()
        return link
