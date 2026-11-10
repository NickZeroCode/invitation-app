"""The guest's WhatsApp number: stored in international form, never public,
and handed to the send dialog so its WhatsApp field starts filled."""

import pytest

from invitations.models import Invitation
from invitations.tests.test_invitations import invitations_url
from invitations.tests.test_public import make_event, make_invitation


@pytest.mark.django_db
class TestWhatsappNumber:
    def test_create_keeps_the_number_without_formatting(self, auth_client, organizer):
        event = make_event(organizer)
        response = auth_client.post(
            invitations_url(event),
            {"guest_name": "Éric Mukendi", "whatsapp_number": "+243 812-345 (678)"},
            format="json",
        )
        assert response.status_code == 201, response.json()
        assert response.json()["whatsapp_number"] == "+243812345678"
        assert Invitation.objects.get().whatsapp_number == "+243812345678"

    def test_double_zero_prefix_becomes_plus(self, auth_client, organizer):
        event = make_event(organizer)
        response = auth_client.post(
            invitations_url(event), {"guest_name": "Éric", "whatsapp_number": "00243812345678"}, format="json"
        )
        assert response.json()["whatsapp_number"] == "+243812345678"

    def test_the_number_is_optional(self, auth_client, organizer):
        event = make_event(organizer)
        response = auth_client.post(invitations_url(event), {"guest_name": "Éric"}, format="json")
        assert response.status_code == 201
        assert response.json()["whatsapp_number"] == ""

    @pytest.mark.parametrize("raw", ["0812345678", "+24381234abc", "+1234"])
    def test_a_national_or_malformed_number_is_refused_in_french(self, auth_client, organizer, raw):
        event = make_event(organizer)
        response = auth_client.post(invitations_url(event), {"guest_name": "Éric", "whatsapp_number": raw}, format="json")
        assert response.status_code == 400
        assert "format international" in str(response.json())

    def test_bulk_rows_carry_their_numbers(self, auth_client, organizer):
        event = make_event(organizer)
        response = auth_client.post(
            f"{invitations_url(event)}bulk/",
            {"invitations": [{"guest_name": "Awa", "whatsapp_number": "+243 81 000 0001"}, {"guest_name": "Ben"}]},
            format="json",
        )
        assert response.status_code == 201, response.json()
        numbers = dict(Invitation.objects.values_list("guest_name", "whatsapp_number"))
        assert numbers == {"Awa": "+243810000001", "Ben": ""}

    def test_share_context_hands_the_number_to_the_owner(self, auth_client, organizer):
        invitation = make_invitation(make_event(organizer), whatsapp_number="+243812345678")
        body = auth_client.get(f"/api/share/invitations/{invitation.token}/").json()
        assert body["whatsapp_number"] == "+243812345678"

    def test_the_public_invitation_never_shows_the_number(self, api_client, organizer):
        invitation = make_invitation(make_event(organizer), whatsapp_number="+243812345678")
        response = api_client.get(f"/api/public/invitations/{invitation.token}/")
        assert response.status_code == 200
        assert "243812345678" not in response.content.decode()
