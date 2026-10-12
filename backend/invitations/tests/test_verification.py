"""QR-authenticity verification — delegated links and door-side verdicts.

Covers the full security contract: hashed authorization codes, attempt
lockouts, tamper-proof signed sessions, revocation killing in-flight
sessions, and event-scoped verdicts that never leak another event's data.
"""
import datetime

from django.utils.timezone import now as timezone_now

from events.models import EventModel
from invitations.models import Invitation, VerificationLink
from invitations.verification import extract_invitation_token
from templates_app.models import InvitationTemplate

EVENTS_ENDPOINT = "/api/events/"
LINKS_ENDPOINT = "/api/verification-links/"
PUBLIC_ENDPOINT = "/api/public/verify-links/"
SESSION_HEADER = "HTTP_X_VERIFICATION_SESSION"


def make_event(organizer, **overrides):
    template = InvitationTemplate.objects.get(key="heritage-luxe")
    fields = {
        "title": "Mariage de Grâce et Éric",
        "event_date": datetime.date(2026, 12, 12),
        "event_time": datetime.time(15, 0),
        "timezone": "Africa/Kinshasa",
    }
    fields.update(overrides)
    return EventModel.objects.create(organizer=organizer, template=template, **fields)


def make_invitation(event, **overrides):
    fields = {"guest_name": "Éric Mukendi", "civility": Invitation.Civility.M}
    fields.update(overrides)
    return Invitation.objects.create(event_model=event, **fields)


def make_link(event, **overrides):
    fields = {"label": "Équipe d'accueil", "expires_at": timezone_now() + datetime.timedelta(days=30)}
    fields.update(overrides)
    code = fields.pop("code", "secret-1234")
    link = VerificationLink(event_model=event, **fields)
    link.set_code(code)
    link.save()
    return link


def create_link(auth_client, event, **overrides):
    payload = {"label": "Équipe d'accueil", "code": "secret-1234", "expires_at": overrides.pop(
        "expires_at", (timezone_now() + datetime.timedelta(days=30)).isoformat()
    )}
    payload.update(overrides)
    return auth_client.post(f"{EVENTS_ENDPOINT}{event.pk}/verification-links/", payload, format="json")


def authorize(api_client, link, code="secret-1234"):
    return api_client.post(f"{PUBLIC_ENDPOINT}{link.token}/authorize/", {"code": code}, format="json")


def scan(api_client, link, content, session):
    return api_client.post(
        f"{PUBLIC_ENDPOINT}{link.token}/scan/",
        {"content": content},
        format="json",
        **{SESSION_HEADER: session},
    )


# --- Organizer link management -----------------------------------------


def test_create_link_returns_metadata_and_stores_hash_only(auth_client, organizer):
    event = make_event(organizer)

    response = create_link(auth_client, event, label="Sécurité")

    assert response.status_code == 201
    data = response.json()
    assert data["label"] == "Sécurité"
    assert data["status"] == "active"
    assert data["token"]
    assert data["expires_at"]
    assert "code" not in data
    assert "code_hash" not in data

    link = VerificationLink.objects.get(pk=data["id"])
    assert link.code_hash != "secret-1234"
    assert link.check_code("secret-1234") is True
    assert link.check_code("mauvais-code") is False


def test_list_links_is_event_scoped(auth_client, organizer):
    event = make_event(organizer)
    other = make_event(organizer, title="Autre événement")
    make_link(event)
    make_link(other)

    response = auth_client.get(f"{EVENTS_ENDPOINT}{event.pk}/verification-links/")

    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 1
    assert results[0]["status"] == "active"


def test_revoke_link(auth_client, organizer):
    event = make_event(organizer)
    link = make_link(event)

    response = auth_client.post(f"{LINKS_ENDPOINT}{link.pk}/revoke/", {}, format="json")

    assert response.status_code == 200
    assert response.json()["status"] == "revoked"
    link.refresh_from_db()
    assert link.revoked_at is not None
    assert link.status == "revoked"


def test_link_validation_rejects_bad_payloads(auth_client, organizer):
    event = make_event(organizer)

    short_code = create_link(auth_client, event, code="123")
    assert short_code.status_code == 400
    assert "code" in short_code.json()["error"]["fields"]

    past_expiry = create_link(
        auth_client, event, expires_at="2020-01-01T00:00:00+00:00"
    )
    assert past_expiry.status_code == 400
    assert "expires_at" in past_expiry.json()["error"]["fields"]

    missing_code = auth_client.post(
        f"{EVENTS_ENDPOINT}{event.pk}/verification-links/",
        {"expires_at": (timezone_now() + datetime.timedelta(days=1)).isoformat()},
        format="json",
    )
    assert missing_code.status_code == 400
    assert "code" in missing_code.json()["error"]["fields"]


def test_link_endpoints_are_organizer_scoped(auth_client, second_organizer, api_client, organizer):
    event = make_event(organizer)
    link = make_link(event)

    api_client.force_authenticate(user=second_organizer)
    listing = api_client.get(f"{EVENTS_ENDPOINT}{event.pk}/verification-links/")
    creation = api_client.post(
        f"{EVENTS_ENDPOINT}{event.pk}/verification-links/",
        {"code": "hijack-1234", "expires_at": (timezone_now() + datetime.timedelta(days=1)).isoformat()},
        format="json",
    )
    revocation = api_client.post(f"{LINKS_ENDPOINT}{link.pk}/revoke/", {}, format="json")

    assert listing.status_code == 404
    assert creation.status_code == 404
    assert revocation.status_code == 404


# --- Public link status -------------------------------------------------


def test_public_link_status_lifecycle(api_client, organizer):
    event = make_event(organizer)
    active = make_link(event)
    expired = make_link(
        event,
        expires_at=timezone_now() - datetime.timedelta(days=1),
    )
    revoked = make_link(event)
    revoked.revoked_at = timezone_now()
    revoked.save(update_fields=["revoked_at", "updated_at"])

    assert api_client.get(f"{PUBLIC_ENDPOINT}{active.token}/").json()["status"] == "active"
    assert api_client.get(f"{PUBLIC_ENDPOINT}{expired.token}/").json()["status"] == "expired"
    assert api_client.get(f"{PUBLIC_ENDPOINT}{revoked.token}/").json()["status"] == "revoked"

    unknown = api_client.get(f"{PUBLIC_ENDPOINT}jeton-inconnu/")
    assert unknown.status_code == 404
    assert unknown.json()["error"]["message"] == "Ce lien de vérification n'est pas valide."


# --- Authorization (code exchange) --------------------------------------


def test_authorize_success_returns_session(api_client, organizer):
    event = make_event(organizer)
    link = make_link(event)

    response = authorize(api_client, link)

    assert response.status_code == 200
    data = response.json()
    assert data["session"]
    assert data["event_title"] == "Mariage de Grâce et Éric"


def test_authorize_wrong_code_counts_attempts(api_client, organizer):
    event = make_event(organizer)
    link = make_link(event)

    response = authorize(api_client, link, code="mauvais-code")

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Code d'autorisation invalide."
    link.refresh_from_db()
    assert link.failed_attempts == 1


def test_authorize_locks_after_repeated_failures(api_client, organizer):
    event = make_event(organizer)
    link = make_link(event)

    for _ in range(link.LOCK_AFTER_ATTEMPTS):
        authorize(api_client, link, code="mauvais-code")

    link.refresh_from_db()
    assert link.is_locked() is True

    locked = authorize(api_client, link)
    assert locked.status_code == 400
    assert locked.json()["error"]["message"] == "Trop de tentatives. Réessayez dans quelques minutes."


def test_authorize_success_resets_attempts(api_client, organizer):
    event = make_event(organizer)
    link = make_link(event)
    authorize(api_client, link, code="mauvais-code")

    assert authorize(api_client, link).status_code == 200
    link.refresh_from_db()
    assert link.failed_attempts == 0


def test_authorize_rejects_dead_links(api_client, organizer):
    event = make_event(organizer)
    expired = make_link(event, expires_at=timezone_now() - datetime.timedelta(days=1))
    revoked = make_link(event)

    expired_response = authorize(api_client, expired)
    revoked.revoked_at = timezone_now()
    revoked.save(update_fields=["revoked_at", "updated_at"])
    revoked_response = authorize(api_client, revoked)

    assert expired_response.status_code == 400
    assert expired_response.json()["error"]["message"] == "Ce lien de vérification a expiré."
    assert revoked_response.status_code == 400
    assert revoked_response.json()["error"]["message"] == "Ce lien de vérification a été révoqué."


# --- Scanning (door-side verdicts) -------------------------------------


def test_scan_valid_invitation_returns_green_summary(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event, table_number="5", table_text="Près du jardin")
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    response = scan(api_client, link, f"https://malaikaevents.cd/i/{invitation.token}", session)

    assert response.status_code == 200
    data = response.json()
    assert data["result"] == "valid"
    assert data["is_authentic"] is True
    summary = data["summary"]
    assert summary["display_name"] == "M. Éric Mukendi"
    assert summary["event_title"] == "Mariage de Grâce et Éric"
    assert summary["table_number"] == "5"
    assert summary["table_text"] == "Près du jardin"
    assert summary["presence_confirmed"] is False
    assert data["verified_at"]


def test_scan_accepts_bare_token_and_url_variants(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    bare = scan(api_client, link, invitation.token, session)
    with_query = scan(api_client, link, f"https://malaikaevents.cd/i/{invitation.token}?utm=x#top", session)

    assert bare.json()["result"] == "valid"
    assert with_query.json()["result"] == "valid"


def test_scan_expired_invitation(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(
        event,
        issued_at=datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc),
        expires_at=datetime.datetime(2020, 2, 1, tzinfo=datetime.timezone.utc),
    )
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    response = scan(api_client, link, invitation.token, session)

    assert response.json()["result"] == "expired"
    assert response.json()["is_authentic"] is True
    assert response.json()["message"] == "Cette invitation a expiré."


def test_scan_revoked_invitation(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event, state=Invitation.State.REVOKED, revoked_at=timezone_now())
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    response = scan(api_client, link, invitation.token, session)

    assert response.json()["result"] == "revoked"
    assert response.json()["is_authentic"] is True


def test_scan_unknown_token_is_not_authentic(api_client, organizer):
    event = make_event(organizer)
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    response = scan(api_client, link, "jeton-qui-nexiste-pas", session)

    data = response.json()
    assert data["result"] == "invalid"
    assert data["is_authentic"] is False
    assert data["summary"] is None
    assert "pas été émis par le serveur" in data["message"]


def test_scan_foreign_event_qr_leaks_nothing(api_client, organizer):
    event = make_event(organizer)
    foreign_event = make_event(organizer, title="Autre événement privé")
    foreign_invitation = make_invitation(foreign_event, guest_name="Confidentiel")
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    response = scan(api_client, link, foreign_invitation.token, session)

    data = response.json()
    assert data["result"] == "wrong_event"
    assert data["is_authentic"] is False
    assert data["summary"] is None
    assert "Confidentiel" not in response.content.decode()
    assert "Autre événement privé" not in response.content.decode()


def test_scan_reports_confirmed_presence_in_summary(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event, presence_confirmed_at=timezone_now())
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    response = scan(api_client, link, invitation.token, session)

    assert response.json()["summary"]["presence_confirmed"] is True


# --- Session hardening --------------------------------------------------


def test_scan_without_session_is_refused(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    link = make_link(event)

    response = api_client.post(
        f"{PUBLIC_ENDPOINT}{link.token}/scan/", {"content": invitation.token}, format="json"
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "verification_session_expired"


def test_scan_with_tampered_session_is_refused(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    response = scan(api_client, link, invitation.token, session + "tampered")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "verification_session_expired"


def test_session_is_bound_to_its_link(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    link_a = make_link(event)
    link_b = make_link(event)
    session_a = authorize(api_client, link_a).json()["session"]

    response = scan(api_client, link_b, invitation.token, session_a)

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "verification_session_expired"


def test_revoking_the_link_kills_in_flight_sessions(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    link.revoked_at = timezone_now()
    link.save(update_fields=["revoked_at", "updated_at"])

    response = scan(api_client, link, invitation.token, session)

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Ce lien de vérification a été révoqué."


def test_expired_sessions_are_refused(api_client, organizer, monkeypatch):
    from invitations import verification

    event = make_event(organizer)
    invitation = make_invitation(event)
    link = make_link(event)
    session = authorize(api_client, link).json()["session"]

    monkeypatch.setattr(verification, "SESSION_MAX_AGE", -1)
    response = scan(api_client, link, invitation.token, session)

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "verification_session_expired"


# --- QR payload normalization ------------------------------------------


def test_extract_invitation_token_variants():
    assert extract_invitation_token("abc-123_XYZ") == "abc-123_XYZ"
    assert extract_invitation_token("https://malaikaevents.cd/i/abc-123") == "abc-123"
    assert extract_invitation_token("https://malaikaevents.cd/i/abc-123?x=1#y") == "abc-123"
    assert extract_invitation_token("http://localhost:5173/i/abc-123") == "abc-123"
    assert extract_invitation_token("  /i/abc-123  ") == "abc-123"


# --- Owner-side scan (authenticated, no delegated link) ------------------


def test_owner_scan_needs_no_link_and_returns_summary(auth_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event, table_number="5", table_text="Près du jardin")

    response = auth_client.post(
        f"{EVENTS_ENDPOINT}{event.pk}/verification-scan/",
        {"content": invitation.token},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["result"] == "valid"
    assert response.data["is_authentic"] is True
    assert response.data["summary"]["display_name"] == "M. Éric Mukendi"
    assert response.data["summary"]["table_number"] == "5"


def test_owner_scan_is_organizer_scoped(second_organizer, api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    api_client.force_authenticate(user=second_organizer)
    response = api_client.post(
        f"{EVENTS_ENDPOINT}{event.pk}/verification-scan/",
        {"content": invitation.token},
        format="json",
    )

    assert response.status_code == 404


def test_owner_scan_of_foreign_event_leaks_nothing(auth_client, organizer):
    event = make_event(organizer)
    other_event = make_event(organizer, title="Autre événement")
    foreign = make_invitation(other_event, guest_name="Grâce Ilunga")

    response = auth_client.post(
        f"{EVENTS_ENDPOINT}{event.pk}/verification-scan/",
        {"content": foreign.token},
        format="json",
    )

    assert response.status_code == 200
    assert response.data["result"] == "wrong_event"
    assert response.data["is_authentic"] is False
    assert response.data["summary"] is None
