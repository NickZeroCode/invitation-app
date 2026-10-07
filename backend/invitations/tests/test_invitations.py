"""End-to-end tests for individual guest invitations (product brief Section 9).

Covers creation, batch generation, editing, revocation, soft deletion,
duplication, derived expiry status and cross-organizer isolation.
"""
import datetime
from datetime import timedelta

from django.utils.timezone import now as timezone_now

from events.models import EventModel
from invitations.models import Invitation
from templates_app.models import InvitationTemplate

EVENTS_ENDPOINT = "/api/events/"
INVITATIONS_ENDPOINT = "/api/invitations/"


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


def future_iso():
    return (timezone_now() + timedelta(days=20)).isoformat()


def invitations_url(event):
    return f"{EVENTS_ENDPOINT}{event.pk}/invitations/"


# --- Creation ------------------------------------------------------------


def test_listing_requires_authentication(api_client, organizer):
    event = make_event(organizer)
    response = api_client.get(invitations_url(event))

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


def test_create_invitation_happy_path(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.post(
        invitations_url(event),
        {"guest_name": "Éric Mukendi", "civility": "mme", "expires_at": future_iso()},
        format="json",
    )

    assert response.status_code == 201
    data = response.json()
    assert data["guest_name"] == "Éric Mukendi"
    assert data["civility"] == "mme"
    assert data["display_name"] == "Mme Éric Mukendi"
    assert data["event"] == event.pk
    assert data["event_title"] == "Mariage de Grâce et Éric"
    assert data["state"] == "active"
    assert data["status"] == "active"
    assert data["is_valid"] is True
    assert data["has_response"] is False
    assert data["expires_at"] is not None
    assert data["issued_at"] is not None
    assert len(data["token"]) >= 40

    invitation = Invitation.objects.get(pk=data["id"])
    assert invitation.event_model == event
    assert invitation.token == data["token"]


def test_create_validates_fields(auth_client, organizer):
    event = make_event(organizer)

    empty = auth_client.post(invitations_url(event), {"guest_name": "  "}, format="json")
    assert empty.status_code == 400
    assert "guest_name" in empty.json()["error"]["fields"]

    bad_civility = auth_client.post(
        invitations_url(event), {"guest_name": "X", "civility": "roi"}, format="json"
    )
    assert bad_civility.status_code == 400
    assert "civility" in bad_civility.json()["error"]["fields"]

    past = auth_client.post(
        invitations_url(event),
        {"guest_name": "X", "expires_at": "2020-01-01T00:00:00Z"},
        format="json",
    )
    assert past.status_code == 400
    assert "expires_at" in past.json()["error"]["fields"]


def test_create_blocked_on_inactive_event(auth_client, organizer):
    event = make_event(organizer, is_active=False)

    response = auth_client.post(invitations_url(event), {"guest_name": "X"}, format="json")

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Cet événement est désactivé."


def test_create_rejects_second_live_invitation_for_same_guest(auth_client, organizer):
    event = make_event(organizer)
    auth_client.post(invitations_url(event), {"guest_name": "Éric Mukendi"}, format="json")

    duplicate = auth_client.post(
        invitations_url(event), {"guest_name": "  éric MUKENDI "}, format="json"
    )
    assert duplicate.status_code == 400
    assert "guest_name" in duplicate.json()["error"]["fields"]

    # Once the first invitation is revoked the guest can be re-added.
    first = event.invitations.get()
    auth_client.post(f"{INVITATIONS_ENDPOINT}{first.pk}/revoke/")
    again = auth_client.post(invitations_url(event), {"guest_name": "Éric Mukendi"}, format="json")
    assert again.status_code == 201


def test_tokens_are_unique_across_invitations(auth_client, organizer):
    event = make_event(organizer)
    tokens = set()
    for name in ["A", "B", "C", "D", "E"]:
        response = auth_client.post(invitations_url(event), {"guest_name": name}, format="json")
        tokens.add(response.json()["token"])

    assert len(tokens) == 5


# --- Listing and filtering ----------------------------------------------


def test_list_shows_guests_and_filters(auth_client, organizer):
    event = make_event(organizer)
    # ASCII names keep the alphabetical assertion collation-independent.
    make_invitation(event, guest_name="Ana Diomi")
    revoked = make_invitation(event, guest_name="Sarah Kabamba")
    Invitation.objects.filter(pk=revoked.pk).update(state=Invitation.State.REVOKED)

    listing = auth_client.get(invitations_url(event))
    assert listing.status_code == 200
    body = listing.json()
    assert body["count"] == 2
    assert [row["guest_name"] for row in body["results"]] == ["Ana Diomi", "Sarah Kabamba"]

    search = auth_client.get(f"{invitations_url(event)}?q=sarah")
    assert [row["guest_name"] for row in search.json()["results"]] == ["Sarah Kabamba"]

    revoked_only = auth_client.get(f"{invitations_url(event)}?state=revoked")
    assert [row["guest_name"] for row in revoked_only.json()["results"]] == ["Sarah Kabamba"]

    bad_filter = auth_client.get(f"{invitations_url(event)}?state=zzz")
    assert bad_filter.status_code == 400


def test_expired_invitation_is_reported_and_filtered_as_expired(auth_client, organizer):
    event = make_event(organizer)
    lapsed = make_invitation(
        event,
        guest_name="Laps",
        issued_at=timezone_now() - timedelta(hours=3),
        expires_at=timezone_now() - timedelta(hours=1),
    )

    detail = auth_client.get(f"{INVITATIONS_ENDPOINT}{lapsed.pk}/")
    assert detail.json()["state"] == "active"
    assert detail.json()["status"] == "expired"
    assert detail.json()["is_valid"] is False

    expired_rows = auth_client.get(f"{invitations_url(event)}?state=expired").json()
    assert [row["guest_name"] for row in expired_rows["results"]] == ["Laps"]

    active_rows = auth_client.get(f"{invitations_url(event)}?state=active").json()
    assert active_rows["count"] == 0


# --- Editing -------------------------------------------------------------


def test_update_invitation_fields(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    response = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/",
        {"guest_name": "Éric Mukendi-Kalala", "civility": "couple", "expires_at": future_iso()},
        format="json",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["guest_name"] == "Éric Mukendi-Kalala"
    assert data["civility"] == "couple"
    assert data["display_name"] == "M. & Mme Éric Mukendi-Kalala"
    assert data["expires_at"] is not None

    past = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/",
        {"expires_at": "2020-01-01T00:00:00Z"},
        format="json",
    )
    assert past.status_code == 400
    assert "expires_at" in past.json()["error"]["fields"]


def test_update_rejects_rename_to_existing_guest(auth_client, organizer):
    event = make_event(organizer)
    make_invitation(event, guest_name="Éric Mukendi")
    second = make_invitation(event, guest_name="Sarah Kabamba")

    response = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{second.pk}/", {"guest_name": "Éric Mukendi"}, format="json"
    )

    assert response.status_code == 400
    assert "guest_name" in response.json()["error"]["fields"]


def test_state_is_read_only_on_update(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    response = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/", {"state": "revoked"}, format="json"
    )

    assert response.status_code == 200
    invitation.refresh_from_db()
    assert invitation.state == Invitation.State.ACTIVE


# --- Lifecycle actions ---------------------------------------------------


def test_revoke_flow(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    response = auth_client.post(f"{INVITATIONS_ENDPOINT}{invitation.pk}/revoke/")

    assert response.status_code == 200
    data = response.json()
    assert data["state"] == "revoked"
    assert data["status"] == "revoked"
    assert data["is_valid"] is False

    invitation.refresh_from_db()
    assert invitation.revoked_at is not None

    again = auth_client.post(f"{INVITATIONS_ENDPOINT}{invitation.pk}/revoke/")
    assert again.status_code == 400
    assert again.json()["error"]["message"] == "Cette invitation est déjà révoquée."


def test_delete_is_soft_and_idempotent(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    first = auth_client.delete(f"{INVITATIONS_ENDPOINT}{invitation.pk}/")
    assert first.status_code == 204

    invitation.refresh_from_db()
    assert invitation.state == Invitation.State.DELETED

    # Tombstones vanish from the guest list but keep their identity.
    listing = auth_client.get(invitations_url(event)).json()
    assert listing["count"] == 0
    detail = auth_client.get(f"{INVITATIONS_ENDPOINT}{invitation.pk}/").json()
    assert detail["state"] == "deleted"

    second = auth_client.delete(f"{INVITATIONS_ENDPOINT}{invitation.pk}/")
    assert second.status_code == 204

    # A deleted invitation no longer blocks re-adding the guest.
    again = auth_client.post(invitations_url(event), {"guest_name": "Éric Mukendi"}, format="json")
    assert again.status_code == 201


def test_cannot_edit_or_revoke_deleted_invitation(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    invitation.state = Invitation.State.DELETED
    invitation.save(update_fields=["state"])

    edit = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/", {"guest_name": "X"}, format="json"
    )
    assert edit.status_code == 400
    assert edit.json()["error"]["message"] == "Cette invitation a été supprimée."

    revoke = auth_client.post(f"{INVITATIONS_ENDPOINT}{invitation.pk}/revoke/")
    assert revoke.status_code == 400
    assert revoke.json()["error"]["message"] == "Cette invitation a été supprimée."


def test_event_delete_unblocked_after_removing_invitations(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    blocked = auth_client.delete(f"{EVENTS_ENDPOINT}{event.pk}/")
    assert blocked.status_code == 400
    assert blocked.json()["error"]["code"] == "event_has_invitations"

    auth_client.delete(f"{INVITATIONS_ENDPOINT}{invitation.pk}/")
    allowed = auth_client.delete(f"{EVENTS_ENDPOINT}{event.pk}/")
    assert allowed.status_code == 204
    assert not EventModel.objects.filter(pk=event.pk).exists()


def test_duplicate_creates_fresh_token(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event, civility=Invitation.Civility.MME)

    response = auth_client.post(f"{INVITATIONS_ENDPOINT}{invitation.pk}/duplicate/")

    assert response.status_code == 201
    data = response.json()
    assert data["id"] != invitation.pk
    assert data["guest_name"] == invitation.guest_name
    assert data["civility"] == Invitation.Civility.MME
    assert data["token"] != invitation.token
    assert data["state"] == "active"
    assert data["expires_at"] is None
    assert event.invitations.count() == 2


def test_duplicate_does_not_copy_a_lapsed_expiry(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(
        event,
        issued_at=timezone_now() - timedelta(hours=3),
        expires_at=timezone_now() - timedelta(hours=1),
    )

    response = auth_client.post(f"{INVITATIONS_ENDPOINT}{invitation.pk}/duplicate/")

    assert response.status_code == 201
    assert response.json()["expires_at"] is None


# --- Batch generation ----------------------------------------------------


def test_bulk_generate_happy_path(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.post(
        f"{invitations_url(event)}bulk/",
        {
            "invitations": [
                {"guest_name": "Éric Mukendi", "civility": "m"},
                {"guest_name": "Sarah Kabamba", "civility": "mme", "expires_at": future_iso()},
                {"guest_name": "Famille Ilunga", "civility": "couple"},
            ]
        },
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["count"] == 3
    assert [row["guest_name"] for row in body["invitations"]] == [
        "Éric Mukendi",
        "Sarah Kabamba",
        "Famille Ilunga",
    ]
    assert len({row["token"] for row in body["invitations"]}) == 3
    assert Invitation.objects.filter(event_model=event).count() == 3


def test_bulk_rejects_duplicate_names_inside_the_batch(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.post(
        f"{invitations_url(event)}bulk/",
        {"invitations": [{"guest_name": "Éric"}, {"guest_name": "Éric"}]},
        format="json",
    )

    assert response.status_code == 400
    assert "invitations.1.guest_name" in response.json()["error"]["fields"]
    assert Invitation.objects.filter(event_model=event).count() == 0


def test_bulk_is_all_or_nothing_on_invalid_rows(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.post(
        f"{invitations_url(event)}bulk/",
        {"invitations": [{"guest_name": "Valide"}, {"guest_name": "  "}]},
        format="json",
    )

    assert response.status_code == 400
    assert "invitations.1.guest_name" in response.json()["error"]["fields"]
    assert Invitation.objects.filter(event_model=event).count() == 0


def test_bulk_validates_the_payload_shape(auth_client, organizer):
    event = make_event(organizer)
    base = f"{invitations_url(event)}bulk/"

    assert auth_client.post(base, {}, format="json").status_code == 400
    assert auth_client.post(base, {"invitations": []}, format="json").status_code == 400
    too_many = auth_client.post(
        base, {"invitations": [{"guest_name": f"Invité {i}"} for i in range(201)]}, format="json"
    )
    assert too_many.status_code == 400


def test_bulk_blocked_on_inactive_event(auth_client, organizer):
    event = make_event(organizer, is_active=False)

    response = auth_client.post(
        f"{invitations_url(event)}bulk/", {"invitations": [{"guest_name": "X"}]}, format="json"
    )

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Cet événement est désactivé."


# --- Cross-organizer isolation ------------------------------------------


def test_other_organizer_cannot_reach_these_invitations(api_client, organizer, second_organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    api_client.force_authenticate(user=second_organizer)

    assert api_client.get(f"{INVITATIONS_ENDPOINT}{invitation.pk}/").status_code == 404
    assert api_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/", {"guest_name": "X"}, format="json"
    ).status_code == 404
    assert api_client.delete(f"{INVITATIONS_ENDPOINT}{invitation.pk}/").status_code == 404
    assert api_client.post(f"{INVITATIONS_ENDPOINT}{invitation.pk}/revoke/").status_code == 404
    assert api_client.post(f"{INVITATIONS_ENDPOINT}{invitation.pk}/duplicate/").status_code == 404
    assert api_client.get(invitations_url(event)).status_code == 404
    assert api_client.post(invitations_url(event), {"guest_name": "X"}, format="json").status_code == 404

    assert Invitation.objects.filter(event_model=event).count() == 1
