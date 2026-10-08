"""Authentication API tests (Section 19: auth, sessions, errors, throttling)."""
import pytest
from rest_framework.test import APIClient

from conftest import PASSWORD

CSRF_URL = "/api/auth/csrf/"
LOGIN_URL = "/api/auth/login/"
REGISTER_URL = "/api/auth/register/"
LOGOUT_URL = "/api/auth/logout/"
ME_URL = "/api/auth/me/"
PASSWORD_URL = "/api/auth/password/"

CREDS = {"email": "organisateur@example.com", "password": PASSWORD}


@pytest.mark.django_db
class TestLogin:
    def test_login_success_returns_profile(self, api_client, organizer):
        response = api_client.post(LOGIN_URL, CREDS, format="json")
        assert response.status_code == 200
        body = response.json()
        assert body["email"] == "organisateur@example.com"
        assert body["first_name"] == "Nadine"
        assert "password" not in body

    def test_login_wrong_password_returns_generic_error(self, api_client, organizer):
        response = api_client.post(LOGIN_URL, {**CREDS, "password": "mauvais"}, format="json")
        assert response.status_code == 401
        error = response.json()["error"]
        assert error["code"] == "authentication_failed"
        assert error["message"] == "Identifiants invalides."

    def test_login_unknown_email_returns_same_error(self, api_client, organizer):
        response = api_client.post(LOGIN_URL, {"email": "inconnu@example.com", "password": "x"}, format="json")
        assert response.status_code == 401
        assert response.json()["error"]["message"] == "Identifiants invalides."

    def test_inactive_account_cannot_login(self, api_client, organizer):
        organizer.is_active = False
        organizer.save(update_fields=["is_active"])
        response = api_client.post(LOGIN_URL, CREDS, format="json")
        assert response.status_code == 401

    def test_login_is_rate_limited(self, api_client, organizer):
        for _ in range(20):
            assert api_client.post(LOGIN_URL, {**CREDS, "password": "mauvais"}, format="json").status_code == 401
        response = api_client.post(LOGIN_URL, {**CREDS, "password": "mauvais"}, format="json")
        assert response.status_code == 429
        assert response.json()["error"]["code"] == "throttled"


@pytest.mark.django_db
class TestCSRF:
    def test_csrf_cookie_is_set(self, api_client):
        response = api_client.get(CSRF_URL)
        assert response.status_code == 204
        assert "csrftoken" in response.cookies

    def test_login_requires_csrf_when_enforced(self, organizer):
        client = APIClient(enforce_csrf_checks=True)
        blocked = client.post(LOGIN_URL, CREDS, format="json")
        assert blocked.status_code == 403

        assert client.get(CSRF_URL).status_code == 204
        token = client.cookies["csrftoken"].value
        allowed = client.post(LOGIN_URL, CREDS, format="json", headers={"X-CSRFToken": token})
        assert allowed.status_code == 200


@pytest.mark.django_db
class TestSession:
    def test_me_requires_authentication(self, api_client):
        response = api_client.get(ME_URL)
        assert response.status_code == 401
        assert response.json()["error"]["code"] == "not_authenticated"

    def test_me_returns_profile_after_login(self, api_client, organizer):
        assert api_client.post(LOGIN_URL, CREDS, format="json").status_code == 200
        response = api_client.get(ME_URL)
        assert response.status_code == 200
        assert response.json()["email"] == "organisateur@example.com"

    def test_logout_invalidates_session(self, api_client, organizer):
        assert api_client.post(LOGIN_URL, CREDS, format="json").status_code == 200
        assert api_client.post(LOGOUT_URL).status_code == 204
        assert api_client.get(ME_URL).status_code == 401

    def test_profile_update(self, api_client, organizer):
        assert api_client.post(LOGIN_URL, CREDS, format="json").status_code == 200
        response = api_client.patch(ME_URL, {"first_name": "Nadine", "timezone": "Europe/Paris"}, format="json")
        assert response.status_code == 200
        assert response.json()["timezone"] == "Europe/Paris"

    def test_profile_update_rejects_invalid_timezone(self, api_client, organizer):
        assert api_client.post(LOGIN_URL, CREDS, format="json").status_code == 200
        response = api_client.patch(ME_URL, {"timezone": "Mars/Olympus"}, format="json")
        assert response.status_code == 400
        assert "timezone" in response.json()["error"]["fields"]


@pytest.mark.django_db
class TestPasswordChange:
    def test_wrong_current_password_is_rejected(self, api_client, organizer):
        assert api_client.post(LOGIN_URL, CREDS, format="json").status_code == 200
        response = api_client.post(
            PASSWORD_URL,
            {
                "current_password": "incorrect",
                "new_password": "UnNouveau-MotDePasse-2026",
                "confirm_password": "UnNouveau-MotDePasse-2026",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "current_password" in response.json()["error"]["fields"]

    def test_mismatched_confirmation_is_rejected(self, api_client, organizer):
        assert api_client.post(LOGIN_URL, CREDS, format="json").status_code == 200
        response = api_client.post(
            PASSWORD_URL,
            {
                "current_password": PASSWORD,
                "new_password": "UnNouveau-MotDePasse-2026",
                "confirm_password": "Autre-MotDePasse-2026",
            },
            format="json",
        )
        assert response.status_code == 400
        assert "confirm_password" in response.json()["error"]["fields"]

    def test_weak_password_is_rejected(self, api_client, organizer):
        assert api_client.post(LOGIN_URL, CREDS, format="json").status_code == 200
        response = api_client.post(
            PASSWORD_URL,
            {"current_password": PASSWORD, "new_password": "123", "confirm_password": "123"},
            format="json",
        )
        assert response.status_code == 400
        assert "new_password" in response.json()["error"]["fields"]


SIGNUP = {
    "email": "nouvelle.organisatrice@example.com",
    "first_name": "Nadine",
    "last_name": "Kalala",
    "password": "UnNouveau-MotDePasse-2026",
    "confirm_password": "UnNouveau-MotDePasse-2026",
}


@pytest.mark.django_db
class TestRegister:
    def test_register_creates_account_and_signs_in(self, api_client, django_user_model):
        response = api_client.post(REGISTER_URL, SIGNUP, format="json")
        assert response.status_code == 201
        body = response.json()
        assert body["email"] == SIGNUP["email"]
        assert body["full_name"] == "Nadine Kalala"
        assert "password" not in body

        # The password is hashed and the session is live straight away.
        user = django_user_model.objects.get(email=SIGNUP["email"])
        assert user.check_password(SIGNUP["password"])
        me = api_client.get(ME_URL)
        assert me.status_code == 200
        assert me.json()["email"] == SIGNUP["email"]

    def test_register_then_login_with_new_credentials(self, api_client):
        assert api_client.post(REGISTER_URL, SIGNUP, format="json").status_code == 201
        assert api_client.post(LOGOUT_URL).status_code == 204
        response = api_client.post(
            LOGIN_URL,
            {"email": SIGNUP["email"], "password": SIGNUP["password"]},
            format="json",
        )
        assert response.status_code == 200

    def test_register_duplicate_email_is_rejected(self, api_client, organizer):
        response = api_client.post(
            REGISTER_URL, {**SIGNUP, "email": "organisateur@example.com"}, format="json"
        )
        assert response.status_code == 400
        assert "email" in response.json()["error"]["fields"]

    def test_register_duplicate_email_is_case_insensitive(self, api_client, organizer):
        response = api_client.post(
            REGISTER_URL, {**SIGNUP, "email": "ORGANISATEUR@example.com"}, format="json"
        )
        assert response.status_code == 400
        assert "email" in response.json()["error"]["fields"]

    def test_register_weak_password_is_rejected(self, api_client):
        response = api_client.post(
            REGISTER_URL, {**SIGNUP, "password": "123", "confirm_password": "123"}, format="json"
        )
        assert response.status_code == 400
        assert "password" in response.json()["error"]["fields"]

    def test_register_mismatched_confirmation_is_rejected(self, api_client):
        response = api_client.post(
            REGISTER_URL, {**SIGNUP, "confirm_password": "Autre-MotDePasse-2026"}, format="json"
        )
        assert response.status_code == 400
        assert "confirm_password" in response.json()["error"]["fields"]

    def test_register_missing_fields_are_rejected(self, api_client):
        response = api_client.post(REGISTER_URL, {"email": "incomplet@example.com"}, format="json")
        assert response.status_code == 400
        fields = response.json()["error"]["fields"]
        assert "first_name" in fields
        assert "password" in fields

    def test_register_requires_csrf_when_enforced(self):
        client = APIClient(enforce_csrf_checks=True)
        blocked = client.post(REGISTER_URL, SIGNUP, format="json")
        assert blocked.status_code == 403

    def test_register_is_rate_limited(self, api_client):
        # Invalid payloads count toward the throttle but create no accounts.
        bad = {**SIGNUP, "confirm_password": "different"}
        for _ in range(20):
            assert api_client.post(REGISTER_URL, bad, format="json").status_code == 400
        response = api_client.post(REGISTER_URL, bad, format="json")
        assert response.status_code == 429
        assert response.json()["error"]["code"] == "throttled"

    def test_successful_change_keeps_session_and_rotates_credentials(self, api_client, organizer):
        assert api_client.post(LOGIN_URL, CREDS, format="json").status_code == 200
        new_password = "UnNouveau-MotDePasse-2026"
        response = api_client.post(
            PASSWORD_URL,
            {"current_password": PASSWORD, "new_password": new_password, "confirm_password": new_password},
            format="json",
        )
        assert response.status_code == 204
        # Session must survive the password change.
        assert api_client.get(ME_URL).status_code == 200

        # Old credentials no longer work; new ones do.
        other = APIClient()
        assert other.post(LOGIN_URL, CREDS, format="json").status_code == 401
        assert other.post(LOGIN_URL, {"email": CREDS["email"], "password": new_password}, format="json").status_code == 200
