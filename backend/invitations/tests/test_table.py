"""Per-guest table section (seating assignment) — API and payload contract.

The table is guest-specific data like the guest name: a number that enables
the section on that guest's invitation and an optional free text shown with
it. A blank number keeps the section hidden (content-gated), mirroring the
dress-code and programme sections.
"""
import datetime

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


def invitations_url(event):
    return f"{EVENTS_ENDPOINT}{event.pk}/invitations/"


def public_payload(api_client, invitation):
    response = api_client.get(f"/api/public/invitations/{invitation.token}/")
    assert response.status_code == 200
    return response.json()


# --- Organizer API round trip -------------------------------------------


def test_update_table_fields_round_trip(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    response = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/",
        {"table_number": "5", "table_text": "Près du jardin"},
        format="json",
    )

    assert response.status_code == 200
    data = response.json()
    assert data["table_number"] == "5"
    assert data["table_text"] == "Près du jardin"

    invitation.refresh_from_db()
    assert invitation.table_number == "5"
    assert invitation.table_text == "Près du jardin"


def test_update_can_clear_table_fields(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event, table_number="12", table_text="Table d'honneur")

    response = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/",
        {"table_number": "", "table_text": ""},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["table_number"] == ""
    assert response.json()["table_text"] == ""
    invitation.refresh_from_db()
    assert invitation.table_number == ""
    assert invitation.table_text == ""


def test_create_invitation_accepts_table_fields(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.post(
        invitations_url(event),
        {"guest_name": "Sarah Kabamba", "table_number": "T3", "table_text": ""},
        format="json",
    )

    assert response.status_code == 201
    data = response.json()
    assert data["table_number"] == "T3"
    assert data["table_text"] == ""


def test_table_values_are_trimmed(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    response = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/",
        {"table_number": "  12  ", "table_text": "  Face à la scène  "},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["table_number"] == "12"
    assert response.json()["table_text"] == "Face à la scène"


def test_table_field_length_limits(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    too_long_number = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/",
        {"table_number": "x" * 33},
        format="json",
    )
    assert too_long_number.status_code == 400
    assert "table_number" in too_long_number.json()["error"]["fields"]

    too_long_text = auth_client.patch(
        f"{INVITATIONS_ENDPOINT}{invitation.pk}/",
        {"table_text": "x" * 256},
        format="json",
    )
    assert too_long_text.status_code == 400
    assert "table_text" in too_long_text.json()["error"]["fields"]


def test_bulk_generate_carries_per_row_table_fields(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.post(
        f"{invitations_url(event)}bulk/",
        {
            "invitations": [
                {"guest_name": "Éric Mukendi", "table_number": "1", "table_text": "Témoin"},
                {"guest_name": "Sarah Kabamba", "table_number": "7"},
                {"guest_name": "Famille Ilunga"},
            ]
        },
        format="json",
    )

    assert response.status_code == 201
    rows = {item["guest_name"]: item for item in response.json()["invitations"]}
    assert rows["Éric Mukendi"]["table_number"] == "1"
    assert rows["Éric Mukendi"]["table_text"] == "Témoin"
    assert rows["Sarah Kabamba"]["table_number"] == "7"
    assert rows["Sarah Kabamba"]["table_text"] == ""
    assert rows["Famille Ilunga"]["table_number"] == ""


def test_bulk_rejects_overlong_table_fields_with_row_numbers(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.post(
        f"{invitations_url(event)}bulk/",
        {"invitations": [{"guest_name": "Éric Mukendi", "table_number": "x" * 33}]},
        format="json",
    )

    assert response.status_code == 400
    assert "invitations.0.table_number" in response.json()["error"]["fields"]


# --- Public payload gating ----------------------------------------------


def test_public_payload_table_is_disabled_by_default(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    data = public_payload(api_client, invitation)

    assert data["table"] == {"enabled": False, "number": "", "text": ""}


def test_public_payload_table_enabled_by_the_number(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event, table_number="5", table_text="Près du jardin")

    data = public_payload(api_client, invitation)

    assert data["table"] == {"enabled": True, "number": "5", "text": "Près du jardin"}


def test_public_payload_table_text_alone_stays_disabled(api_client, organizer):
    """The number enables the section; the text only decorates it."""
    event = make_event(organizer)
    invitation = make_invitation(event, table_text="Sans numéro")

    data = public_payload(api_client, invitation)

    assert data["table"] == {"enabled": False, "number": "", "text": "Sans numéro"}


def test_public_payload_table_without_text(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event, table_number="T2")

    data = public_payload(api_client, invitation)

    assert data["table"] == {"enabled": True, "number": "T2", "text": ""}
