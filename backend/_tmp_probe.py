"""Validation-only probe (NO database writes): reproduce the invitation PATCH 400.

Mirrors the exact payload GuestsPage builds:
  expiryPayload = new Date(`YYYY-MM-DD` + 'T23:59:59').toISOString()  (browser-local -> UTC)
and feeds it to InvitationSerializer(partial=True).is_valid().
"""
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django  # noqa: E402

django.setup()

from invitations.serializers import InvitationSerializer  # noqa: E402

FUTURE = "2026-12-20T21:59:59.000Z"  # picked 2026-12-20, machine UTC+2
TODAY_EOD = "2026-10-09T21:59:59.000Z"  # picked today (server log date 2026-10-09 10:58)
TODAY_EOD_SERVERISH = "2026-10-09T23:59:59.000Z"  # picked today, machine UTC
PAST = "2026-10-01T21:59:59.000Z"
PAST_DATE_ONLY = "2026-10-01"  # bare date, if ever sent

payloads = [
    {"guest_name": "Test", "civility": "mme", "expires_at": FUTURE},
    {"guest_name": "Test", "civility": "mme", "expires_at": TODAY_EOD},
    {"guest_name": "Test", "civility": "mme", "expires_at": TODAY_EOD_SERVERISH},
    {"guest_name": "Test", "civility": "mme", "expires_at": PAST},
    {"guest_name": "Test", "civility": "mme", "expires_at": PAST_DATE_ONLY},
    {"guest_name": "Test", "civility": "mme", "expires_at": None},
    {"guest_name": "Test", "civility": "none", "expires_at": FUTURE},
    {"guest_name": "Test", "civility": "couple", "expires_at": FUTURE},
    {"civility": "mme", "expires_at": FUTURE},  # missing guest_name
    {"guest_name": "   ", "civility": "mme", "expires_at": FUTURE},  # blank name
]

for p in payloads:
    s = InvitationSerializer(data=p, partial=True)
    ok = s.is_valid()
    print("PAYLOAD", p)
    print("   valid:", ok, "| errors:", {} if ok else dict(s.errors))
