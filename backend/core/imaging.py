"""Visually lossless image optimisation for user uploads.

Every picture an organizer uploads (event cover, dress-code gallery) goes
through :func:`optimize_image` before it reaches storage. The goals, in
priority order:

1. **Never visibly degrade the picture.** PNG sources are only ever encoded
   losslessly (pixel-identical output); photographic sources are re-encoded
   at quality 90, which is beyond the visibility threshold; a JPEG whose
   pixels do not need to change is NOT decoded at all: only its metadata
   segments are cut out at the byte level, so its pixels stay bit-identical
   (no second generation of compression artefacts).
2. **Never make things worse.** Several encodings compete and the smallest
   wins; if nothing beats the original (and no pixel change is required) the
   original bytes are stored untouched.
3. **Never block an upload.** Optimisation is best effort: an unexpected
   failure while encoding falls back to the original bytes. Only genuinely
   unusable input (unreadable, unsupported, absurd dimensions) is rejected.

What changes besides size:

* Images are physically rotated according to their EXIF orientation, then all
  metadata is dropped. This removes embedded GPS coordinates and camera data
  (a privacy win for guests-facing pages) without altering what is shown.
* The ICC colour profile is kept so colours stay faithful on wide-gamut
  phones and displays.
* Pictures larger than ``max_edge`` pixels on their longest side are
  down-scaled with Lanczos resampling (never upscaled). 2560 px is more than
  a full-width hero needs even on 2x displays; phone photos of 4000+ px are
  where the big savings come from.
* Animated files are stored unchanged.
"""
from __future__ import annotations

import io
import logging
from dataclasses import dataclass

from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger(__name__)

# Decoding cost grows with pixel count, not file size: refuse anything beyond
# 80 MP (10000 x 8000) — below Pillow's own decompression-bomb warning.
MAX_PIXELS = 80_000_000
DEFAULT_MAX_EDGE = 2560
JPEG_QUALITY = 90
WEBP_QUALITY = 90

# Pillow format name -> (extension, content type)
FORMATS = {
    "JPEG": (".jpg", "image/jpeg"),
    "PNG": (".png", "image/png"),
    "WEBP": (".webp", "image/webp"),
}

_EXIF_ORIENTATION = 0x0112
_ROTATED_ORIENTATIONS = range(2, 9)


class ImageRejected(ValueError):
    """The upload cannot be used; the message is safe to show to the user."""


@dataclass(frozen=True)
class OptimizedImage:
    content: bytes
    extension: str
    content_type: str
    width: int
    height: int
    original_size: int

    @property
    def size(self) -> int:
        return len(self.content)


@dataclass(frozen=True)
class _Encoded:
    content: bytes
    format: str
    width: int
    height: int
    pixels_changed: bool


def optimize_image(data: bytes, *, max_edge: int = DEFAULT_MAX_EDGE) -> OptimizedImage:
    """Return the smallest visually lossless encoding of ``data``.

    Raises :class:`ImageRejected` for unreadable, unsupported or oversized
    pictures. Any other failure degrades to the untouched original.
    """
    source = _open(data)
    source_format = source.format or ""

    encoded: _Encoded | None
    try:
        encoded = _optimize(source, data, max_edge)
    except Exception:  # noqa: BLE001 - optimisation must never block an upload
        logger.exception("Image optimisation failed; storing the original bytes.")
        encoded = None

    if encoded is None or (len(encoded.content) >= len(data) and not encoded.pixels_changed):
        extension, content_type = FORMATS[source_format]
        return OptimizedImage(data, extension, content_type, source.width, source.height, len(data))

    extension, content_type = FORMATS[encoded.format]
    result = OptimizedImage(
        encoded.content, extension, content_type, encoded.width, encoded.height, len(data)
    )
    logger.info(
        "Image optimised: %s %d B -> %s %d B (%dx%d)",
        source_format, len(data), encoded.format, result.size, result.width, result.height,
    )
    return result


def _open(data: bytes) -> Image.Image:
    try:
        image = Image.open(io.BytesIO(data))
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise ImageRejected("Le fichier n'est pas une image lisible.") from exc
    if image.format not in FORMATS:
        raise ImageRejected("Format d'image non supporté (JPEG, PNG ou WebP uniquement).")
    if image.width * image.height > MAX_PIXELS:
        raise ImageRejected("Les dimensions de l'image sont trop grandes.")
    return image


def _optimize(image: Image.Image, data: bytes, max_edge: int) -> _Encoded | None:
    if getattr(image, "n_frames", 1) > 1:
        return None  # animated: flattening would destroy it

    source_format = image.format or ""
    icc = image.info.get("icc_profile")
    rotated = image.getexif().get(_EXIF_ORIENTATION, 1) in _ROTATED_ORIENTATIONS
    oversized = max(image.size) > max_edge
    pixels_unchanged = not rotated and not oversized

    # A WebP whose pixels stay the same is already on the most efficient
    # codec: keep it byte for byte.
    if source_format == "WEBP" and pixels_unchanged:
        return None
    # High-bit-depth / float images (16-bit PNG, ...) cannot be represented in
    # 8-bit codecs without loss: keep them unless they must be rotated/resized.
    if image.mode in ("I", "I;16", "I;16L", "I;16B", "F") and pixels_unchanged:
        return None

    # Same pixels, same JPEG: cut the metadata out of the byte stream. Pillow
    # cannot transcode JPEG losslessly (decode + encode always re-quantises),
    # so the compressed scan data is copied verbatim.
    if source_format == "JPEG" and pixels_unchanged:
        stripped = _strip_jpeg_metadata(data)
        if stripped is None:
            return None
        return _Encoded(stripped, "JPEG", image.width, image.height, False)

    image.load()

    working = ImageOps.exif_transpose(image) if rotated else image.copy()
    if oversized:
        working.thumbnail((max_edge, max_edge), Image.Resampling.LANCZOS)

    has_alpha = (
        working.mode in ("RGBA", "LA", "PA")
        or "transparency" in working.info
        or "transparency" in image.info
    )
    if working.mode == "CMYK":
        working = working.convert("RGB")
        icc = None  # a CMYK profile does not describe RGB pixels
    elif has_alpha:
        working = working.convert("RGBA")
    elif working.mode not in ("RGB", "L"):
        working = working.convert("RGB")  # palette, 1-bit and high-depth modes

    lossless = source_format == "PNG" or (
        source_format == "WEBP" and _webp_is_lossless(data)
    )
    candidates: list[tuple[str, bytes]] = []
    if lossless:
        candidates.append(("PNG", _encode_png(working, icc)))
        candidates.append(("WEBP", _encode_webp(working, icc, lossless=True)))
    elif source_format == "WEBP":
        candidates.append(("WEBP", _encode_webp(working, icc, lossless=False)))
    else:  # JPEG (re-encoded: rotated and/or down-scaled)
        candidates.append(("JPEG", _encode_jpeg(working, icc)))
        candidates.append(("WEBP", _encode_webp(working, icc, lossless=False)))

    best_format, best = min(candidates, key=lambda candidate: len(candidate[1]))
    return _Encoded(best, best_format, working.width, working.height, not pixels_unchanged)


def _encode_png(image: Image.Image, icc: bytes | None) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, "PNG", optimize=True, icc_profile=icc)
    return buffer.getvalue()


def _encode_jpeg(image: Image.Image, icc: bytes | None) -> bytes:
    buffer = io.BytesIO()
    image.save(
        buffer, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True, icc_profile=icc
    )
    return buffer.getvalue()


def _encode_webp(image: Image.Image, icc: bytes | None, *, lossless: bool) -> bytes:
    if image.mode == "L":
        image = image.convert("RGB")
        icc = None  # a grey profile does not describe RGB pixels
    buffer = io.BytesIO()
    if lossless:
        image.save(buffer, "WEBP", lossless=True, quality=100, method=6, icc_profile=icc)
    else:
        image.save(
            buffer, "WEBP", quality=WEBP_QUALITY, method=5, alpha_quality=100, icc_profile=icc
        )
    return buffer.getvalue()


# Segments removed from a JPEG: EXIF/XMP (APP1), Photoshop/IPTC (APP13) and
# comments. APP0 (JFIF), APP2 (ICC profile) and APP14 (Adobe colour
# transform) are required to render colours correctly and are kept.
_JPEG_DROPPED_MARKERS = {0xE1, 0xED, 0xFE}
_JPEG_STANDALONE_MARKERS = {0x01, *range(0xD0, 0xD8)}


def _strip_jpeg_metadata(data: bytes) -> bytes | None:
    """Remove EXIF/XMP/IPTC/comment segments without touching the scan data.

    Returns ``None`` when the stream is not structured as expected, in which
    case the caller keeps the original bytes.
    """
    if data[:2] != b"\xff\xd8":
        return None
    output = bytearray(b"\xff\xd8")
    position = 2
    while position + 4 <= len(data):
        if data[position] != 0xFF:
            return None
        marker = data[position + 1]
        if marker == 0xFF:  # fill byte
            position += 1
            continue
        if marker == 0xDA:  # start of scan: the rest is entropy-coded data
            output += data[position:]
            return bytes(output)
        if marker in _JPEG_STANDALONE_MARKERS:
            output += data[position : position + 2]
            position += 2
            continue
        length = int.from_bytes(data[position + 2 : position + 4], "big")
        end = position + 2 + length
        if length < 2 or end > len(data):
            return None
        if marker not in _JPEG_DROPPED_MARKERS:
            output += data[position:end]
        position = end
    return None


def _webp_is_lossless(data: bytes) -> bool:
    """Inspect the RIFF chunks: ``VP8L`` is lossless, ``VP8 `` is lossy."""
    position = 12
    while position + 8 <= len(data):
        tag = data[position : position + 4]
        size = int.from_bytes(data[position + 4 : position + 8], "little")
        if tag == b"VP8L":
            return True
        if tag == b"VP8 ":
            return False
        position += 8 + size + (size & 1)
    return False
