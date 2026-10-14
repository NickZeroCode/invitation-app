"""Same-origin picture endpoints used by the PDF export (no presigned URLs, no CORS)."""
import io

from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from events.models import DressCodeImage

from .test_events import ENDPOINT, make_event


def jpeg_bytes(size=(24, 24)):
    buffer = io.BytesIO()
    Image.new("RGB", size, "darkgreen").save(buffer, format="JPEG")
    return buffer.getvalue()


def attach_cover(event):
    event.cover_image.save("cover.jpg", SimpleUploadedFile("cover.jpg", jpeg_bytes()), save=True)


def attach_dress(event):
    item = DressCodeImage(event=event, caption="Tenue", order=0)
    item.image.save("dress.jpg", SimpleUploadedFile("dress.jpg", jpeg_bytes()), save=True)
    return item


def test_cover_file_returns_the_stored_bytes(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)
    attach_cover(event)

    response = auth_client.get(f"{ENDPOINT}{event.pk}/cover/file/")

    assert response.status_code == 200
    assert response["Content-Type"] == "image/jpeg"
    assert response["Cache-Control"] == "private, no-store"
    assert response.content == jpeg_bytes()
    assert Image.open(io.BytesIO(response.content)).size == (24, 24)


def test_dress_code_file_returns_the_stored_bytes(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)
    item = attach_dress(event)

    response = auth_client.get(f"{ENDPOINT}{event.pk}/dress-code/{item.pk}/file/")

    assert response.status_code == 200
    assert response["Content-Type"] == "image/jpeg"
    assert response.content == jpeg_bytes()


def test_files_require_authentication(api_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)
    attach_cover(event)
    item = attach_dress(event)

    assert api_client.get(f"{ENDPOINT}{event.pk}/cover/file/").status_code == 401
    assert api_client.get(f"{ENDPOINT}{event.pk}/dress-code/{item.pk}/file/").status_code == 401


def test_files_are_scoped_to_the_owner(api_client, second_organizer, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)
    attach_cover(event)
    item = attach_dress(event)

    api_client.force_authenticate(user=second_organizer)
    assert api_client.get(f"{ENDPOINT}{event.pk}/cover/file/").status_code == 404
    assert api_client.get(f"{ENDPOINT}{event.pk}/dress-code/{item.pk}/file/").status_code == 404


def test_missing_pictures_are_a_clean_404(auth_client, organizer, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    event = make_event(organizer)

    # No cover uploaded, unknown gallery item.
    assert auth_client.get(f"{ENDPOINT}{event.pk}/cover/file/").status_code == 404
    assert auth_client.get(f"{ENDPOINT}{event.pk}/dress-code/999/file/").status_code == 404

    # A row whose file vanished from storage is a 404, never a 500.
    item = attach_dress(event)
    item.image.storage.delete(item.image.name)
    assert auth_client.get(f"{ENDPOINT}{event.pk}/dress-code/{item.pk}/file/").status_code == 404
