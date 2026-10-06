"""Dashboard overview + health tests (real backend counts, ownership isolation)."""
from datetime import timedelta

import pytest
from django.utils import timezone

from events.models import EventModel
from invitations.models import Invitation
from preferences.models import GuestResponse
from templates_app.models import InvitationTemplate


@pytest.mark.django_db
def test_health_endpoint_is_public(api_client):
    response = api_client.get("/api/health/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "connected"


@pytest.mark.django_db
def test_overview_requires_authentication(api_client):
    response = api_client.get("/api/dashboard/overview/")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


@pytest.mark.django_db
def test_overview_counts_are_real_and_organizer_scoped(auth_client, organizer, second_organizer):
    template = InvitationTemplate.objects.create(key="elegant", name="Élégant")
    event = EventModel.objects.create(
        organizer=organizer,
        template=template,
        title="Mariage de Nadine",
        event_date=timezone.localdate() + timedelta(days=30),
        event_time=timezone.now().time(),
    )

    now = timezone.now()
    Invitation.objects.create(event_model=event, guest_name="Alice")
    Invitation.objects.create(
        event_model=event,
        guest_name="Bob",
        issued_at=now - timedelta(days=3),
        expires_at=now - timedelta(hours=2),
    )
    Invitation.objects.create(event_model=event, guest_name="Chantal", state=Invitation.State.REVOKED)
    Invitation.objects.create(event_model=event, guest_name="David", state=Invitation.State.EXPIRED)
    Invitation.objects.create(event_model=event, guest_name="Éric", state=Invitation.State.DELETED)
    GuestResponse.objects.create(invitation=Invitation.objects.get(guest_name="Alice"))

    # Another organizer's data must never leak into the counts.
    other_event = EventModel.objects.create(
        organizer=second_organizer,
        template=template,
        title="Autre événement",
        event_date=timezone.localdate() + timedelta(days=10),
        event_time=timezone.now().time(),
    )
    Invitation.objects.create(event_model=other_event, guest_name="Flore")

    body = auth_client.get("/api/dashboard/overview/").json()
    assert body["events"] == {"total": 1, "upcoming": 1}
    # Active / past-expiry / revoked count here; deleted is excluded entirely.
    assert body["invitations"] == {"total": 4, "active": 1, "expired": 2, "revoked": 1}
    assert body["responses"] == {"total": 1}
