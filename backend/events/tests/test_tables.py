"""Seating registry ("ajouter une table") + Invitation.table FK wiring.

The registry lets an organizer define named tables once and quick-assign them
when issuing an invitation. Selecting a registry table copies its number/text
onto the invitation's plain strings (the rendering source of truth) and links
the FK; deleting a registry row SET_NULLs the FK and never rewrites existing
invitations, so textual-table invitations keep working untouched.
"""
import datetime

from events.models import EventModel, EventTable
from invitations.models import Invitation
from templates_app.models import InvitationTemplate

ENDPOINT = "/api/events/"


def make_event(organizer, **overrides):
    template = InvitationTemplate.objects.get(key="heritage-luxe")
    fields = {
        "title": "Événement de test",
        "event_date": datetime.date(2026, 12, 12),
        "event_time": datetime.time(15, 0),
        "timezone": "Africa/Kinshasa",
    }
    fields.update(overrides)
    return EventModel.objects.create(organizer=organizer, template=template, **fields)


def make_table(event, number="5", text="Près du jardin", order=0):
    return EventTable.objects.create(event=event, number=number, text=text, order=order)


# --- Registry CRUD ----------------------------------------------------------


def test_tables_list_and_create(auth_client, organizer):
    event = make_event(organizer)
    make_table(event, "1", "Témoins", order=1)
    make_table(event, "2", "", order=0)

    listed = auth_client.get(f"{ENDPOINT}{event.pk}/tables/")
    assert listed.status_code == 200
    rows = listed.json()
    # Ordered by (order, id): order=0 row first.
    assert [r["number"] for r in rows] == ["2", "1"]

    created = auth_client.post(
        f"{ENDPOINT}{event.pk}/tables/",
        {"number": "T3", "text": "Famille"},
        format="json",
    )
    assert created.status_code == 201
    assert created.json()["number"] == "T3"
    # Auto-order appends after the highest existing order.
    assert created.json()["order"] == 2


def test_table_number_is_required_and_trimmed(auth_client, organizer):
    event = make_event(organizer)
    blank = auth_client.post(
        f"{ENDPOINT}{event.pk}/tables/", {"number": "   "}, format="json"
    )
    assert blank.status_code == 400
    assert "number" in blank.json()["error"]["fields"]

    padded = auth_client.post(
        f"{ENDPOINT}{event.pk}/tables/",
        {"number": "  7  ", "text": "  Devant  "},
        format="json",
    )
    assert padded.status_code == 201
    assert padded.json()["number"] == "7"
    assert padded.json()["text"] == "Devant"


def test_table_patch_and_delete(auth_client, organizer):
    event = make_event(organizer)
    table = make_table(event, "5", "Ancien")

    patched = auth_client.patch(
        f"{ENDPOINT}{event.pk}/tables/{table.pk}/",
        {"number": "6", "text": "Nouveau"},
        format="json",
    )
    assert patched.status_code == 200
    assert patched.json()["number"] == "6"
    assert patched.json()["text"] == "Nouveau"

    deleted = auth_client.delete(f"{ENDPOINT}{event.pk}/tables/{table.pk}/")
    assert deleted.status_code == 204
    assert not EventTable.objects.filter(pk=table.pk).exists()


def test_tables_are_organizer_scoped(auth_client, organizer, second_organizer):
    event = make_event(second_organizer)
    table = make_table(event, "9")

    # Another organizer's event reads as a 404 (IDOR-safe), never a 403.
    assert auth_client.get(f"{ENDPOINT}{event.pk}/tables/").status_code == 404
    assert (
        auth_client.post(
            f"{ENDPOINT}{event.pk}/tables/", {"number": "x"}, format="json"
        ).status_code
        == 404
    )
    assert (
        auth_client.delete(f"{ENDPOINT}{event.pk}/tables/{table.pk}/").status_code == 404
    )


# --- Invitation.table FK wiring --------------------------------------------


def test_create_invitation_with_registry_table_copies_values(auth_client, organizer):
    event = make_event(organizer)
    table = make_table(event, "12", "Table d'honneur")

    response = auth_client.post(
        f"{ENDPOINT}{event.pk}/invitations/",
        {"guest_name": "Sarah Kabamba", "table": table.pk},
        format="json",
    )
    assert response.status_code == 201
    data = response.json()
    assert data["table"] == table.pk
    assert data["table_number"] == "12"
    assert data["table_text"] == "Table d'honneur"

    invitation = Invitation.objects.get(pk=data["id"])
    assert invitation.table_id == table.pk
    assert invitation.table_number == "12"
    assert invitation.table_text == "Table d'honneur"


def test_registry_table_rejects_cross_event_pick(auth_client, organizer, second_organizer):
    event = make_event(organizer)
    foreign_table = make_table(make_event(second_organizer), "1")

    response = auth_client.post(
        f"{ENDPOINT}{event.pk}/invitations/",
        {"guest_name": "Éric Mukendi", "table": foreign_table.pk},
        format="json",
    )
    assert response.status_code == 400
    assert "table" in response.json()["error"]["fields"]


def test_deleting_registry_table_keeps_invitation(auth_client, organizer):
    event = make_event(organizer)
    table = make_table(event, "12", "Table d'honneur")
    created = auth_client.post(
        f"{ENDPOINT}{event.pk}/invitations/",
        {"guest_name": "Sarah Kabamba", "table": table.pk},
        format="json",
    ).json()

    auth_client.delete(f"{ENDPOINT}{event.pk}/tables/{table.pk}/")

    invitation = Invitation.objects.get(pk=created["id"])
    # FK is SET_NULL; the copied strings survive — the guest's table stays.
    assert invitation.table_id is None
    assert invitation.table_number == "12"
    assert invitation.table_text == "Table d'honneur"


def test_bulk_generation_accepts_registry_table(auth_client, organizer):
    event = make_event(organizer)
    table = make_table(event, "7", "Témoin")

    response = auth_client.post(
        f"{ENDPOINT}{event.pk}/invitations/bulk/",
        {
            "invitations": [
                {"guest_name": "Éric Mukendi", "table": table.pk},
                {"guest_name": "Sarah Kabamba", "table_number": "9", "table_text": "Fond"},
            ]
        },
        format="json",
    )
    assert response.status_code == 201
    rows = {r["guest_name"]: r for r in response.json()["invitations"]}
    # Registry pick copied the table's values.
    assert rows["Éric Mukendi"]["table_number"] == "7"
    assert rows["Éric Mukendi"]["table_text"] == "Témoin"
    # Plain strings still accepted directly (backward compatible).
    assert rows["Sarah Kabamba"]["table_number"] == "9"
    assert rows["Sarah Kabamba"]["table_text"] == "Fond"


def test_update_invitation_can_switch_and_clear_table(auth_client, organizer):
    event = make_event(organizer)
    table_a = make_table(event, "1", "A")
    table_b = make_table(event, "2", "B")
    created = auth_client.post(
        f"{ENDPOINT}{event.pk}/invitations/",
        {"guest_name": "Sarah Kabamba", "table": table_a.pk},
        format="json",
    ).json()

    # Switch to another registry table: values follow.
    switched = auth_client.patch(
        f"/api/invitations/{created['id']}/", {"table": table_b.pk}, format="json"
    )
    assert switched.status_code == 200
    assert switched.json()["table_number"] == "2"
    assert switched.json()["table_text"] == "B"

    # Clear the link explicitly: strings stay (organizer may keep free text),
    # only the FK is dropped.
    cleared = auth_client.patch(
        f"/api/invitations/{created['id']}/", {"table": None}, format="json"
    )
    assert cleared.status_code == 200
    assert cleared.json()["table"] is None
    assert cleared.json()["table_number"] == "2"
