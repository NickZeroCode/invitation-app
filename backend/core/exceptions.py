"""Consistent, safe API error envelope.

All API errors are returned as::

    {"error": {"code": "...", "message": "...", "fields": {"field": ["..."]}}}

Messages are user-facing; internal exception details are never leaked.
"""
from __future__ import annotations

from rest_framework.views import exception_handler

STATUS_CODE_MAP = {
    400: "validation_error",
    401: "not_authenticated",
    403: "permission_denied",
    404: "not_found",
    405: "method_not_allowed",
    415: "unsupported_media_type",
    429: "throttled",
}

FRENCH_MESSAGES = {
    "not_authenticated": "Authentification requise.",
    "permission_denied": "Vous n'avez pas les droits nécessaires.",
    "method_not_allowed": "Méthode non autorisée.",
    "unsupported_media_type": "Format de requête non supporté.",
    "throttled": "Trop de requêtes. Veuillez réessayer plus tard.",
    "validation_error": "Les données envoyées sont invalides.",
    "error": "Une erreur est survenue.",
}

DEFAULT_MESSAGE = "Une erreur est survenue."


def _extract_message_and_fields(detail) -> tuple[str, dict]:
    if detail is None:
        return DEFAULT_MESSAGE, {}
    if isinstance(detail, dict):
        fields: dict = {}
        for key, value in detail.items():
            if isinstance(value, (list, tuple)):
                fields[str(key)] = [str(item) for item in value]
            else:
                fields[str(key)] = [str(value)]
        return FRENCH_MESSAGES["validation_error"], fields
    if isinstance(detail, (list, tuple)):
        return FRENCH_MESSAGES["validation_error"], {"non_field_errors": [str(item) for item in detail]}
    return str(detail), {}


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return None

    code = getattr(exc, "default_code", None)
    if code in (None, "error"):
        code = STATUS_CODE_MAP.get(response.status_code, "error")

    message, fields = _extract_message_and_fields(getattr(exc, "detail", None))
    # Standard DRF codes get French, internals-free messages. Custom detail
    # strings (e.g. domain-specific errors) are preserved as-is.
    if code in FRENCH_MESSAGES and code not in ("validation_error", "error"):
        message = FRENCH_MESSAGES[code]

    response.data = {"error": {"code": code, "message": message, "fields": fields}}
    return response
