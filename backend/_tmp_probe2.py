"""Read-only: reproduce the EXACT PATCH /api/invitations/<id>/ validation path.

Uses the real row (default db) + a real instance so the object-level duplicate
name check runs exactly like InvitationDetailView._update does. NO writes.
"""
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

import django  # noqa: E402

django.setup()

from invitations.models import Invitation  # noqa: E402
from invitations.serializers import InvitationSerializer  # noqa: E402

inv = Invitation.objects.select_related("event_model").get(pk=12)
print("INV12:", inv.pk, repr(inv.guest_name), inv.state, "| issued:", inv.issued_at, "| expires:", inv.expires_at)

sibs = Invitation.objects.filter(event_model=inv.event_model).exclude(pk=inv.pk)
for s in sibs:
    print("SIB:", s.pk, repr(s.guest_name), s.state, "| expires:", s.expires_at)

FUTURE = "2026-12-20T21:59:59.000Z"
PAST = "2026-10-01T21:59:59.000Z"

for label, payload in [
    ("same-name+future", {"guest_name": inv.guest_name, "civility": inv.civility, "expires_at": FUTURE}),
    ("same-name+past", {"guest_name": inv.guest_name, "civility": inv.civility, "expires_at": PAST}),
    ("expiry-only-future", {"expires_at": FUTURE}),
]:
    s = InvitationSerializer(instance=inv, data=payload, partial=True)
    ok = s.is_valid()
    print("PATCH", label, "-> valid:", ok, "| errors:", {} if ok else dict(s.errors))
