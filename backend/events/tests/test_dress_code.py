"""Dress-code gallery + programme rows: upload rules, sync semantics, payload.

Mirrors the cover upload policy (whitelisted types, 4 MB cap, ownership
scoping) and the preference-question coherent-set semantics for programme
rows. Both sections are content-gated on the public page: empty means hidden.
"""
import datetime
import io

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from events.models import DressCodeImage, EventModel, ProgramItem
from templates_app.models import InvitationTemplate

ENDPOINT = "/api/events/"


def image_file(name="dress.jpg", image_format="JPEG", content_type="image/jpeg", size=(16, 16)):
    buffer = io.BytesIO()
    Image.new("RGB", size, "darkgreen").save(buffer, format=image_format)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)


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


# --- Dress-code images -----------------------------------------------------

def test_dress_code_upload_patch_delete(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)

    created = auth_client.post(
        f"{ENDPOINT}{event.pk}/dress-code/",
        {"image": image_file(), "caption": "Tenue de cérémonie", "order": 2},
        format="multipart",
    )
    assert created.status_code == 201
    body = created.json()
    assert body["caption"] == "Tenue de cérémonie"
    assert body["order"] == 2
    assert f"dress-code/event-{event.pk}/" in body["url"]

    detail = auth_client.get(f"{ENDPOINT}{event.pk}/")
    images = detail.json()["dress_code"]
    assert len(images) == 1
    assert images[0]["id"] == body["id"]
    assert images[0]["url"] == body["url"]

    patched = auth_client.patch(
        f"{ENDPOINT}{event.pk}/dress-code/{body['id']}/",
        {"caption": "Tenue de cocktail", "order": 0},
        format="json",
    )
    assert patched.status_code == 200
    assert patched.json()["caption"] == "Tenue de cocktail"
    assert patched.json()["order"] == 0

    removed = auth_client.delete(f"{ENDPOINT}{event.pk}/dress-code/{body['id']}/")
    assert removed.status_code == 204
    assert not DressCodeImage.objects.filter(pk=body["id"]).exists()


def test_dress_code_order_defaults_to_append(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)

    first = auth_client.post(
        f"{ENDPOINT}{event.pk}/dress-code/", {"image": image_file()}, format="multipart"
    )
    second = auth_client.post(
        f"{ENDPOINT}{event.pk}/dress-code/", {"image": image_file()}, format="multipart"
    )

    assert first.json()["order"] == 0
    assert second.json()["order"] == 1


def test_dress_code_rejects_unsupported_type(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)

    response = auth_client.post(
        f"{ENDPOINT}{event.pk}/dress-code/",
        {"image": image_file(name="anim.gif", image_format="GIF", content_type="image/gif")},
        format="multipart",
    )

    assert response.status_code == 400
    assert response.json()["error"]["fields"]["image"] == [
        "Format d'image non supporté (JPEG, PNG ou WebP uniquement)."
    ]


def test_dress_code_rejects_oversized_image(auth_client, organizer, settings, tmp_path, monkeypatch):
    settings.MEDIA_ROOT = tmp_path
    monkeypatch.setattr("events.views.MAX_COVER_BYTES", 10)
    event = make_event(organizer)

    response = auth_client.post(
        f"{ENDPOINT}{event.pk}/dress-code/", {"image": image_file()}, format="multipart"
    )

    assert response.status_code == 400
    assert response.json()["error"]["fields"]["image"] == ["L'image ne doit pas dépasser 4 Mo."]


def test_dress_code_cross_organizer_returns_404(auth_client, second_organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    foreign = make_event(second_organizer)
    item = DressCodeImage.objects.create(event=foreign, image="dress_code/x.jpg", caption="x")

    assert (
        auth_client.post(f"{ENDPOINT}{foreign.pk}/dress-code/", {"image": image_file()}, format="multipart").status_code
        == 404
    )
    assert (
        auth_client.patch(
            f"{ENDPOINT}{foreign.pk}/dress-code/{item.pk}/", {"caption": "pirate"}, format="json"
        ).status_code
        == 404
    )
    assert (
        auth_client.delete(f"{ENDPOINT}{foreign.pk}/dress-code/{item.pk}/").status_code == 404
    )
    item.refresh_from_db()
    assert item.caption == "x"


# --- Programme rows --------------------------------------------------------

def test_program_items_round_trip(auth_client, organizer):
    event = make_event(organizer)
    payload = {
        "program_items": [
            {"start_time": "19:30:00", "end_time": None, "description": "Accueil des invités"},
            {"start_time": "20:00:00", "end_time": "21:00:00", "description": "Dîner et discours"},
        ]
    }

    response = auth_client.patch(f"{ENDPOINT}{event.pk}/", payload, format="json")

    assert response.status_code == 200
    body = response.json()
    assert [item["description"] for item in body["program_items"]] == [
        "Accueil des invités",
        "Dîner et discours",
    ]
    assert body["program_items"][0]["end_time"] is None
    assert body["program_items"][1]["end_time"] == "21:00:00"
    first_id = body["program_items"][0]["id"]

    # Coherent set: update the first, drop the second, add a third.
    updated = auth_client.patch(
        f"{ENDPOINT}{event.pk}/",
        {
            "program_items": [
                {"id": first_id, "start_time": "19:00:00", "description": "Accueil"},
                {"start_time": "22:00:00", "description": "Ouverture du bal"},
            ]
        },
        format="json",
    )
    assert updated.status_code == 200
    items = updated.json()["program_items"]
    assert [item["description"] for item in items] == ["Accueil", "Ouverture du bal"]
    assert items[0]["id"] == first_id
    assert items[0]["start_time"] == "19:00:00"
    assert ProgramItem.objects.filter(event=event).count() == 2


def test_program_item_rejects_inverted_range(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.patch(
        f"{ENDPOINT}{event.pk}/",
        {"program_items": [{"start_time": "21:00:00", "end_time": "20:00:00", "description": "Dîner"}]},
        format="json",
    )

    assert response.status_code == 400
    fields = response.json()["error"]["fields"]
    assert any(key.startswith("program_items") for key in fields)


def test_program_item_requires_description(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.patch(
        f"{ENDPOINT}{event.pk}/",
        {"program_items": [{"start_time": "21:00:00", "description": "   "}]},
        format="json",
    )

    assert response.status_code == 400
    assert any(key.startswith("program_items") for key in response.json()["error"]["fields"])


def test_program_items_cap(auth_client, organizer):
    event = make_event(organizer)
    items = [
        {"start_time": f"{8 + (index // 60):02d}:{index % 60:02d}:00", "description": f"Étape {index}"}
        for index in range(21)
    ]

    response = auth_client.patch(f"{ENDPOINT}{event.pk}/", {"program_items": items}, format="json")

    assert response.status_code == 400
    assert "program_items" in response.json()["error"]["fields"]


def test_event_delete_cleans_dress_code_rows(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)
    auth_client.post(
        f"{ENDPOINT}{event.pk}/dress-code/", {"image": image_file()}, format="multipart"
    )
    auth_client.patch(
        f"{ENDPOINT}{event.pk}/", {"program_items": [{"start_time": "19:30:00", "description": "Accueil"}]},
        format="json",
    )

    response = auth_client.delete(f"{ENDPOINT}{event.pk}/")

    assert response.status_code == 204
    assert not DressCodeImage.objects.filter(event_id=event.pk).exists()
    assert not ProgramItem.objects.filter(event_id=event.pk).exists()
