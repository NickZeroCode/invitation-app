"""Consistent, safe API error envelope.

All API errors are returned as::

    {"error": {"code": "...", "message": "...", "fields": {"field": ["..."]}}}

Messages are user-facing; internal exception details are never leaked.
"""
from __future__ import annotations

from rest_framework.exceptions import APIException
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


class EventHasInvitationsError(APIException):
    """Domain error: an event model with issued invitations cannot be deleted.

    Deleting would cascade-destroy guest invitations; the organizer must
    first revoke/remove them explicitly. A plain ValidationError would be
    flattened into `non_field_errors`, so this APIException keeps the
    message as the envelope's top-level, user-facing `message`.
    """

    status_code = 400
    default_code = "event_has_invitations"
    default_detail = (
        "Cet événement a déjà des invitations. "
        "Supprimez ou révoquez d'abord ses invitations pour le supprimer."
    )


class DomainValidationError(APIException):
    """Domain rule rejection whose sentence survives as the envelope `message`.

    `rest_framework.exceptions.ValidationError` wraps plain strings into a
    list, which the envelope flattens to `non_field_errors` — the user would
    only see the generic "Les données envoyées sont invalides.". APIException
    keeps the detail string intact, so this is the vehicle for top-level,
    user-facing domain messages ("Cette invitation a été supprimée.", …).
    """

    status_code = 400
    default_code = "validation_error"

    def __init__(self, detail: str):
        super().__init__(detail)


def _flatten_fields(detail, prefix: str = "") -> dict:
    """Flatten nested validation details into dotted-path field keys.

    e.g. ``{"display_config": {"emphasis": ["..."]}}`` becomes
    ``{"display_config.emphasis": ["..."]}`` so messages survive nesting.
    """
    fields: dict = {}
    if isinstance(detail, dict):
        for key, value in detail.items():
            path = f"{prefix}.{key}" if prefix else str(key)
            fields.update(_flatten_fields(value, path))
        return fields
    if isinstance(detail, (list, tuple)):
        if all(not isinstance(item, (dict, list, tuple)) for item in detail):
            fields[prefix] = [str(item) for item in detail]
        else:
            for index, item in enumerate(detail):
                fields.update(_flatten_fields(item, f"{prefix}.{index}"))
        return fields
    fields[prefix] = [str(detail)]
    return fields


def _extract_message_and_fields(detail) -> tuple[str, dict]:
    if detail is None:
        return DEFAULT_MESSAGE, {}
    if isinstance(detail, dict):
        return FRENCH_MESSAGES["validation_error"], _flatten_fields(detail)
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
