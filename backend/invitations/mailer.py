"""Outgoing invitation e-mail transport.

Production sends through Resend (https://resend.com) when ``RESEND_API_KEY``
is set in the server environment — the key never reaches the browser.
Without it, Django's configured mailer is used (an SMTP relay, or the
console in development), so the feature degrades instead of breaking.

Either way ``send_invitation_email`` returns only once the provider accepted
the message and raises ``DeliveryError`` otherwise: callers never report a
send that did not happen.
"""
from __future__ import annotations

import base64
import logging
from dataclasses import dataclass

from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


class DeliveryError(Exception):
    """The provider refused or could not be reached; nothing was sent."""


@dataclass(frozen=True)
class Attachment:
    filename: str
    content: bytes
    content_type: str = "application/pdf"


def send_invitation_email(
    *,
    to: str,
    subject: str,
    html: str,
    text: str,
    reply_to: str | None,
    attachments: list[Attachment],
) -> str | None:
    """Send one invitation e-mail; returns the provider message id if known."""
    api_key = getattr(settings, "RESEND_API_KEY", "")
    if api_key:
        return _send_with_resend(api_key, to, subject, html, text, reply_to, attachments)
    return _send_with_django(to, subject, html, text, reply_to, attachments)


def _send_with_resend(api_key, to, subject, html, text, reply_to, attachments) -> str | None:
    import resend  # imported lazily: only production needs the SDK loaded

    resend.api_key = api_key
    params: dict = {
        "from": settings.DEFAULT_FROM_EMAIL,
        "to": [to],
        "subject": subject,
        "html": html,
        "text": text,
    }
    if reply_to:
        params["reply_to"] = reply_to
    if attachments:
        params["attachments"] = [
            {
                "filename": item.filename,
                "content": base64.b64encode(item.content).decode("ascii"),
                "content_type": item.content_type,
            }
            for item in attachments
        ]
    try:
        response = resend.Emails.send(params)
    except Exception as exc:  # SDK raises ResendError subclasses and requests errors
        logger.warning("Resend rejected the invitation e-mail: %s", type(exc).__name__)
        raise DeliveryError(str(exc)) from exc
    message_id = response.get("id") if isinstance(response, dict) else getattr(response, "id", None)
    if not message_id:
        raise DeliveryError("Resend returned no message id")
    return message_id


def _send_with_django(to, subject, html, text, reply_to, attachments) -> str | None:
    email = EmailMultiAlternatives(
        subject=subject,
        body=text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to],
        reply_to=[reply_to] if reply_to else None,
    )
    email.attach_alternative(html, "text/html")
    for item in attachments:
        email.attach(item.filename, item.content, item.content_type)
    try:
        sent = email.send(fail_silently=False)
    except Exception as exc:
        raise DeliveryError(str(exc)) from exc
    if sent != 1:
        raise DeliveryError("mailer did not accept the message")
    return None
