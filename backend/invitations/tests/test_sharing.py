"""Organizer delivery of an invitation: share context + e-mail sending.

Covers ownership isolation (guests and other organizers learn nothing),
the server-built public URL, validation, lifecycle refusal, the
not-configured and provider-failure paths (never a false success) and the
per-account throttle.
"""
from datetime import timedelta
from unittest import mock

import pytest
from django.core import mail
from django.utils.timezone import now as timezone_now
from rest_framework.test import APIClient

from invitations.models import Invitation
from invitations.tests.test_public import make_event, make_invitation


def context_url(invitation):
    return f"/api/share/invitations/{invitation.token}/"


def email_url(invitation):
    return f"/api/share/invitations/{invitation.token}/email/"


@pytest.fixture
def invitation(organizer):
    return make_invitation(make_event(organizer))


@pytest.fixture(autouse=True)
def _email_enabled(settings):
    settings.INVITATION_EMAIL_ENABLED = True
    settings.PUBLIC_APP_URL = "https://www.nickevents.com"


@pytest.mark.django_db
class TestShareContext:
    def test_anonymous_visitor_only_learns_it_cannot_share(self, api_client, invitation):
        response = api_client.get(context_url(invitation))
        assert response.status_code == 200
        assert response.json() == {"can_share": False}

    def test_other_organizer_only_learns_it_cannot_share(self, api_client, second_organizer, invitation):
        api_client.force_authenticate(user=second_organizer)
        response = api_client.get(context_url(invitation))
        assert response.json() == {"can_share": False}

    def test_owner_receives_public_url_and_composed_message(self, auth_client, invitation):
        body = auth_client.get(context_url(invitation)).json()
        assert body["can_share"] is True
        assert body["shareable"] is True
        assert body["email_enabled"] is True
        assert body["public_url"] == f"https://www.nickevents.com/i/{invitation.token}"
        assert body["display_name"] == "M. Éric Mukendi"
        assert "Mariage de Grâce et Éric" in body["default_message"]
        assert "samedi 12 décembre 2026 à 15h" in body["default_message"]
        assert body["public_url"] in body["default_message"]
        assert body["default_subject"] == "Invitation — Mariage de Grâce et Éric"

    def test_public_url_falls_back_to_request_host(self, auth_client, invitation, settings):
        settings.PUBLIC_APP_URL = ""
        body = auth_client.get(context_url(invitation)).json()
        assert body["public_url"] == f"http://testserver/i/{invitation.token}"

    def test_revoked_invitation_is_not_shareable(self, auth_client, invitation):
        invitation.state = Invitation.State.REVOKED
        invitation.save()
        body = auth_client.get(context_url(invitation)).json()
        assert body["can_share"] is True
        assert body["shareable"] is False

    def test_reports_email_disabled_when_not_configured(self, auth_client, invitation, settings):
        settings.INVITATION_EMAIL_ENABLED = False
        assert auth_client.get(context_url(invitation)).json()["email_enabled"] is False


@pytest.mark.django_db
class TestShareEmail:
    def test_sends_html_and_text_with_the_public_link(self, auth_client, invitation, organizer):
        response = auth_client.post(email_url(invitation), {"recipient": "invite@example.com"})
        assert response.status_code == 200
        assert response.json() == {"status": "accepted"}
        assert len(mail.outbox) == 1
        message = mail.outbox[0]
        link = f"https://www.nickevents.com/i/{invitation.token}"
        assert message.to == ["invite@example.com"]
        assert message.reply_to == [organizer.email]
        assert message.subject == "Invitation — Mariage de Grâce et Éric"
        assert link in message.body
        html, mimetype = message.alternatives[0]
        assert mimetype == "text/html"
        assert f'href="{link}"' in html

    def test_custom_message_is_escaped_and_link_still_present(self, auth_client, invitation):
        auth_client.post(
            email_url(invitation),
            {"recipient": "invite@example.com", "subject": "Une\nsurprise", "message": "<b>Venez</b> !"},
        )
        message = mail.outbox[0]
        assert message.subject == "Une surprise"
        html = message.alternatives[0][0]
        assert "&lt;b&gt;Venez&lt;/b&gt;" in html
        assert f"/i/{invitation.token}" in message.body

    def test_rejects_invalid_address(self, auth_client, invitation):
        response = auth_client.post(email_url(invitation), {"recipient": "pas-une-adresse"})
        assert response.status_code == 400
        assert "recipient" in response.json()["error"]["fields"]
        assert mail.outbox == []

    def test_anonymous_cannot_send(self, api_client, invitation):
        response = api_client.post(email_url(invitation), {"recipient": "invite@example.com"})
        assert response.status_code in (401, 403)
        assert mail.outbox == []

    def test_other_organizer_gets_404(self, api_client, second_organizer, invitation):
        api_client.force_authenticate(user=second_organizer)
        response = api_client.post(email_url(invitation), {"recipient": "invite@example.com"})
        assert response.status_code == 404
        assert mail.outbox == []

    def test_expired_invitation_is_refused(self, auth_client, invitation):
        Invitation.objects.filter(pk=invitation.pk).update(
            issued_at=timezone_now() - timedelta(days=3), expires_at=timezone_now() - timedelta(days=1)
        )
        response = auth_client.post(email_url(invitation), {"recipient": "invite@example.com"})
        assert response.status_code == 400
        assert mail.outbox == []

    def test_not_configured_is_an_explicit_503(self, auth_client, invitation, settings):
        settings.INVITATION_EMAIL_ENABLED = False
        response = auth_client.post(email_url(invitation), {"recipient": "invite@example.com"})
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "email_unavailable"
        assert mail.outbox == []

    def test_provider_failure_is_never_reported_as_sent(self, auth_client, invitation):
        with mock.patch(
            "django.core.mail.EmailMultiAlternatives.send", side_effect=OSError("smtp down")
        ):
            response = auth_client.post(email_url(invitation), {"recipient": "invite@example.com"})
        assert response.status_code == 502
        assert response.json()["error"]["code"] == "email_failed"

    def test_csrf_is_enforced_for_session_clients(self, invitation, organizer):
        client = APIClient(enforce_csrf_checks=True)
        client.login(email=organizer.email, password="MotDePasse-Solide-2026")
        response = client.post(email_url(invitation), {"recipient": "invite@example.com"})
        assert response.status_code == 403
        assert mail.outbox == []

    def test_throttled_per_account(self, auth_client, invitation, settings):
        rates = dict(settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"], **{"share-email": "2/hour"})
        settings.REST_FRAMEWORK = {**settings.REST_FRAMEWORK, "DEFAULT_THROTTLE_RATES": rates}
        with mock.patch(
            "rest_framework.throttling.ScopedRateThrottle.THROTTLE_RATES", rates
        ):
            codes = [
                auth_client.post(email_url(invitation), {"recipient": "invite@example.com"}).status_code
                for _ in range(3)
            ]
        assert codes == [200, 200, 429]
