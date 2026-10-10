"""Image optimisation engine: visually lossless, never worse, never blocking."""
import io
import random

import pytest
from PIL import Image, ImageChops, ImageStat

from core import imaging
from core.imaging import ImageRejected, optimize_image


def _noise_photo(size=(640, 480), seed=7):
    """A photo-like picture: smooth gradients plus mild sensor noise."""
    rng = random.Random(seed)
    image = Image.new("RGB", size)
    pixels = image.load()
    for x in range(size[0]):
        for y in range(size[1]):
            base = (x * 255 // size[0], y * 255 // size[1], (x + y) * 255 // sum(size))
            pixels[x, y] = tuple(min(255, max(0, c + rng.randint(-6, 6))) for c in base)
    return image


def _encode(image, fmt, **options):
    buffer = io.BytesIO()
    image.save(buffer, fmt, **options)
    return buffer.getvalue()


def _decode(data):
    return Image.open(io.BytesIO(data))


def _max_channel_diff(a, b):
    diff = ImageChops.difference(a.convert("RGB"), b.convert("RGB"))
    return max(high for _, high in diff.getextrema())


def test_png_stays_pixel_identical():
    flat = Image.new("RGB", (400, 300), "white")
    flat.paste(Image.new("RGB", (120, 80), (200, 30, 30)), (40, 40))
    original = _encode(flat, "PNG", compress_level=0)

    result = optimize_image(original)

    assert result.size < len(original)
    assert result.extension in {".png", ".webp"}
    assert _max_channel_diff(_decode(result.content), flat) == 0


def test_png_with_transparency_keeps_alpha_exactly():
    image = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
    image.paste(Image.new("RGBA", (100, 100), (10, 120, 200, 128)), (50, 50))
    original = _encode(image, "PNG", compress_level=0)

    result = optimize_image(original)

    restored = _decode(result.content).convert("RGBA")
    assert restored.tobytes() == image.tobytes()


def test_jpeg_pixels_unchanged_is_not_requantised():
    original = _encode(_noise_photo(), "JPEG", quality=95, optimize=False)

    result = optimize_image(original)

    assert result.extension == ".jpg"
    assert result.size <= len(original)
    # Same quantisation tables => decoded pixels are bit-identical.
    assert _max_channel_diff(_decode(result.content), _decode(original)) == 0


def test_never_larger_than_original():
    already_small = _encode(_noise_photo((300, 200)), "JPEG", quality=40, optimize=True)

    result = optimize_image(already_small)

    assert result.size <= len(already_small)


def test_large_photo_is_downscaled_but_never_upscaled():
    big = _noise_photo((3200, 1800), seed=3)
    original = _encode(big, "JPEG", quality=95)

    result = optimize_image(original, max_edge=2560)

    assert max(result.width, result.height) == 2560
    assert result.width / result.height == pytest.approx(3200 / 1800, rel=0.01)
    assert result.size < len(original)

    small = _encode(_noise_photo((500, 400)), "JPEG", quality=90)
    untouched = optimize_image(small, max_edge=2560)
    assert (untouched.width, untouched.height) == (500, 400)


def test_downscaled_photo_stays_visually_close():
    big = _noise_photo((1600, 1000), seed=11)
    original = _encode(big, "JPEG", quality=95)

    result = optimize_image(original, max_edge=1200)

    reference = big.resize((result.width, result.height), Image.Resampling.LANCZOS)
    mean_error = sum(ImageStat.Stat(ImageChops.difference(_decode(result.content).convert("RGB"), reference)).mean) / 3
    assert mean_error < 3


def test_exif_orientation_is_applied_and_metadata_stripped():
    photo = _noise_photo((400, 200))
    exif = Image.Exif()
    exif[0x0112] = 6  # rotate 90 degrees clockwise to display
    exif[0x010F] = "SecretCam"  # Make
    original = _encode(photo, "JPEG", quality=92, exif=exif)

    result = optimize_image(original)

    restored = _decode(result.content)
    assert (restored.width, restored.height) == (200, 400)
    assert 0x0112 not in restored.getexif()
    assert 0x010F not in restored.getexif()


def test_icc_profile_is_preserved():
    from PIL import ImageCms

    profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    original = _encode(_noise_photo((300, 200)), "JPEG", quality=95, icc_profile=profile)

    result = optimize_image(original)

    assert _decode(result.content).info.get("icc_profile")


def test_lossy_webp_is_never_reencoded_when_pixels_unchanged():
    original = _encode(_noise_photo((300, 200)), "WEBP", quality=80)

    result = optimize_image(original)

    assert result.content == original
    assert result.extension == ".webp"


def test_animated_images_are_left_untouched():
    frames = [Image.new("RGB", (64, 64), color) for color in ("red", "blue", "green")]
    original = _encode(frames[0], "WEBP", save_all=True, append_images=frames[1:], duration=100, lossless=True)

    result = optimize_image(original)

    assert result.content == original


def test_unreadable_payload_is_rejected():
    with pytest.raises(ImageRejected):
        optimize_image(b"definitely not an image")


def test_unsupported_format_is_rejected():
    gif = _encode(Image.new("RGB", (8, 8), "red"), "GIF")

    with pytest.raises(ImageRejected, match="Format d'image non supporté"):
        optimize_image(gif)


def test_absurd_dimensions_are_rejected(monkeypatch):
    monkeypatch.setattr(imaging, "MAX_PIXELS", 100)
    original = _encode(Image.new("RGB", (50, 50), "red"), "PNG")

    with pytest.raises(ImageRejected, match="dimensions"):
        optimize_image(original)


def test_encoder_failure_falls_back_to_original(monkeypatch):
    original = _encode(Image.new("RGB", (400, 300), "white"), "PNG", compress_level=0)

    def boom(*args, **kwargs):
        raise RuntimeError("encoder exploded")

    monkeypatch.setattr(imaging, "_encode_png", boom)
    result = optimize_image(original)

    assert result.content == original
    assert result.extension == ".png"
