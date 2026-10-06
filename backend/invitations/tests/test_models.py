"""Invitation model tests (tokens, lifecycle, constraints, ownership)."""
import re
from datetime import timedelta

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from events.models import EventModel
from invitations.models import Invitation, generate_invitation_token
from templates_app.models import InvitationTemplate

TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{43}$")


@pytest.fixture
def event(db, organizer):
    template = InvitationTemplate.objects.create(key="minimal", name="Minimal")
    return EventModel.objects.create(
        organizer=organizer,
        template=template,
        title="Remise de diplômes",
        event_date=timezone.localdate() + timedelta(days=20),
        event_time=timezone.now().time(),
    )


@pytest.mark.django_db
class TestTokens:
    def test_token_is_generated_and_unguessable(self, event):
        first = Invitation.objects.create(event_model=event, guest_name="Alice", pk=987654321)
        second = Invitation.objects.create(event_model=event, guest_name="Bob")
        assert TOKEN_RE.match(first.token)
        assert first.token != second.token
        # The token must not embed the primary key (enumeration leak).
        assert "987654321" not in first.token

    def test_generate_invitation_token_is_random(self):
        assert generate_invitation_token() != generate_invitation_token()


@pytest.mark.django_db
class TestLifecycle:
    def test_validity_matrix(self, event):
        now = timezone.now()
        plain = Invitation.objects.create(event_model=event, guest_name="Alice")
        future = Invitation.objects.create(event_model=event, guest_name="Bob", expires_at=now + timedelta(days=1))
        past = Invitation.objects.create(
            event_model=event,
            guest_name="Chantal",
            issued_at=now - timedelta(days=2),
            expires_at=now - timedelta(hours=1),
        )
        revoked = Invitation.objects.create(event_model=event, guest_name="David", state=Invitation.State.REVOKED)
        deleted = Invitation.objects.create(event_model=event, guest_name="Éric", state=Invitation.State.DELETED)

        assert plain.is_currently_valid() is True
        assert future.is_currently_valid() is True
        assert past.is_currently_valid() is False
        assert revoked.is_currently_valid() is False
        assert deleted.is_currently_valid() is False

    def test_expiry_before_issue_is_rejected_by_db(self, event):
        now = timezone.now()
        with pytest.raises(IntegrityError), transaction.atomic():
            Invitation.objects.create(
                event_model=event,
                guest_name="Alice",
                issued_at=now,
                expires_at=now - timedelta(minutes=1),
            )

    def test_display_name_respects_civility(self, event):
        plain = Invitation.objects.create(event_model=event, guest_name="Alice")
        couple = Invitation.objects.create(
            event_model=event, guest_name="Dupont", civility=Invitation.Civility.COUPLE
        )
        assert plain.display_name == "Alice"
        assert couple.display_name == "M. & Mme Dupont"


@pytest.mark.django_db
def test_deleting_organizer_cascades_to_invitations(organizer, event):
    Invitation.objects.create(event_model=event, guest_name="Alice")
    organizer.delete()
    assert Invitation.objects.count() == 0
    assert EventModel.objects.count() == 0
