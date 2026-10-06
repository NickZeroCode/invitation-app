"""Cover image upload rules: real image, whitelisted type, size cap."""
import io

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from .test_events import ENDPOINT, make_event


def image_file(name="cover.jpg", image_format="JPEG", content_type="image/jpeg", size=(16, 16)):
    buffer = io.BytesIO()
    Image.new("RGB", size, "darkgreen").save(buffer, format=image_format)
    return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)


def test_cover_upload_then_delete(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)

    response = auth_client.put(
        f"{ENDPOINT}{event.pk}/cover/", {"image": image_file()}, format="multipart"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["cover_url"].startswith("http://testserver/")
    assert f"covers/event-{event.pk}/" in body["cover_url"]

    event.refresh_from_db()
    assert event.cover_image.name.startswith(f"covers/event-{event.pk}/")
    assert event.cover_image.storage.exists(event.cover_image.name)

    detail = auth_client.get(f"{ENDPOINT}{event.pk}/")
    assert detail.json()["cover_url"] == body["cover_url"]

    removed = auth_client.delete(f"{ENDPOINT}{event.pk}/cover/")
    assert removed.status_code == 204
    event.refresh_from_db()
    assert not event.cover_image


def test_cover_rejects_unsupported_type(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)

    response = auth_client.put(
        f"{ENDPOINT}{event.pk}/cover/",
        {"image": image_file(name="anim.gif", image_format="GIF", content_type="image/gif")},
        format="multipart",
    )

    assert response.status_code == 400
    assert response.json()["error"]["fields"]["image"] == [
        "Format d'image non supporté (JPEG, PNG ou WebP uniquement)."
    ]


def test_cover_rejects_oversized_image(auth_client, organizer, settings, tmp_path, monkeypatch):
    settings.MEDIA_ROOT = tmp_path
    monkeypatch.setattr("events.views.MAX_COVER_BYTES", 10)
    event = make_event(organizer)

    response = auth_client.put(
        f"{ENDPOINT}{event.pk}/cover/", {"image": image_file()}, format="multipart"
    )

    assert response.status_code == 400
    assert response.json()["error"]["fields"]["image"] == ["L'image ne doit pas dépasser 5 Mo."]


def test_cover_rejects_non_image_payload(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)

    response = auth_client.put(
        f"{ENDPOINT}{event.pk}/cover/",
        {"image": SimpleUploadedFile("notes.txt", b"pas une image", content_type="image/jpeg")},
        format="multipart",
    )

    assert response.status_code == 400
    assert "image" in response.json()["error"]["fields"]


def test_cover_cross_organizer_returns_404(auth_client, second_organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    foreign = make_event(second_organizer)

    response = auth_client.put(
        f"{ENDPOINT}{foreign.pk}/cover/", {"image": image_file()}, format="multipart"
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
