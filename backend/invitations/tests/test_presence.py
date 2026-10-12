"""Guest presence confirmation ("Confirmer la présence") — API contract.

The guest confirms from their own invitation page (token = credential); the
confirmation is one-way and idempotent, and the timestamp is surfaced to the
organizer on the dashboard and in the guest list.
"""
import datetime

from django.utils.timezone import now as timezone_now

from events.models import EventModel
from invitations.models import Invitation
from templates_app.models import InvitationTemplate

EVENTS_ENDPOINT = "/api/events/"
DASHBOARD_ENDPOINT = "/api/dashboard/overview/"


def make_event(organizer, **overrides):
    template = InvitationTemplate.objects.get(key="heritage-luxe")
    fields = {
        "title": "Mariage de Grâce et Éric",
        "event_date": datetime.date(2026, 12, 12),
        "event_time": datetime.time(15, 0),
        "timezone": "Africa/Kinshasa",
    }
    fields.update(overrides)
    return EventModel.objects.create(organizer=organizer, template=template, **fields)


def make_invitation(event, **overrides):
    fields = {"guest_name": "Éric Mukendi", "civility": Invitation.Civility.M}
    fields.update(overrides)
    return Invitation.objects.create(event_model=event, **fields)


def confirm_url(invitation):
    return f"/api/public/invitations/{invitation.token}/confirm-presence/"


# --- Confirmation round trip --------------------------------------------


def test_confirm_presence_sets_timestamp(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    response = api_client.post(confirm_url(invitation), {}, format="json")

    assert response.status_code == 200
    presence = response.json()["presence"]
    assert presence["confirmed"] is True
    assert presence["confirmed_at"]

    invitation.refresh_from_db()
    assert invitation.presence_confirmed_at is not None


def test_confirm_presence_is_idempotent(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    first = api_client.post(confirm_url(invitation), {}, format="json")
    invitation.refresh_from_db()
    stamped_at = invitation.presence_confirmed_at

    second = api_client.post(confirm_url(invitation), {}, format="json")

    assert second.status_code == 200
    invitation.refresh_from_db()
    assert invitation.presence_confirmed_at == stamped_at
    assert first.json()["presence"]["confirmed_at"] == second.json()["presence"]["confirmed_at"]


def test_public_payload_carries_presence_state(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    before = api_client.get(f"/api/public/invitations/{invitation.token}/").json()
    assert before["presence"] == {"confirmed": False, "confirmed_at": None}

    api_client.post(confirm_url(invitation), {}, format="json")

    after = api_client.get(f"/api/public/invitations/{invitation.token}/").json()
    assert after["presence"]["confirmed"] is True
    assert after["presence"]["confirmed_at"]


# --- Rejections ---------------------------------------------------------


def test_confirm_presence_rejects_expired_invitation(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(
        event,
        issued_at=datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc),
        expires_at=datetime.datetime(2020, 2, 1, tzinfo=datetime.timezone.utc),
    )

    response = api_client.post(confirm_url(invitation), {}, format="json")

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Cette invitation a expiré."
    invitation.refresh_from_db()
    assert invitation.presence_confirmed_at is None


def test_confirm_presence_rejects_revoked_invitation(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(
        event,
        state=Invitation.State.REVOKED,
        revoked_at=timezone_now(),
    )

    response = api_client.post(confirm_url(invitation), {}, format="json")

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Cette invitation a été révoquée."


def test_confirm_presence_unknown_token_is_404(api_client, organizer):
    make_event(organizer)

    response = api_client.post("/api/public/invitations/jeton-inconnu/confirm-presence/", {}, format="json")

    assert response.status_code == 404
    assert response.json()["error"]["message"] == "Ce lien d'invitation n'est pas valide."


# --- Organizer visibility ----------------------------------------------


def test_presence_confirmed_at_is_read_only_for_organizer(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    response = auth_client.patch(
        f"/api/invitations/{invitation.pk}/",
        {"presence_confirmed_at": timezone_now().isoformat()},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["presence_confirmed_at"] is None
    invitation.refresh_from_db()
    assert invitation.presence_confirmed_at is None


def test_invitation_payload_exposes_presence_timestamp(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    invitation.presence_confirmed_at = timezone_now()
    invitation.save(update_fields=["presence_confirmed_at", "updated_at"])

    response = auth_client.get(f"/api/invitations/{invitation.pk}/")

    assert response.status_code == 200
    assert response.json()["presence_confirmed_at"]


def test_dashboard_counts_confirmed_presences(auth_client, organizer):
    event = make_event(organizer)
    make_invitation(event, guest_name="Éric Mukendi", presence_confirmed_at=timezone_now())
    make_invitation(event, guest_name="Sarah Kabamba")

    response = auth_client.get(DASHBOARD_ENDPOINT)

    assert response.status_code == 200
    assert response.json()["presences"] == {"confirmed": 1}
