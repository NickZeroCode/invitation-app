"""Phase 4 tests: public invitation pages, QR verification, guest responses.

Product brief Sections 10–11 and 13. Covers the anonymous token-scoped
endpoints (public detail, verification verdict, preference submission) and the
organizer response report — including every lifecycle rejection path and
cross-organizer isolation.
"""
import datetime
from datetime import timedelta

from django.utils.timezone import now as timezone_now

from events.models import DressCodeImage, EventModel, ProgramItem
from invitations.models import Invitation
from preferences.models import GuestResponse, PreferenceOption, PreferenceQuestion
from templates_app.models import InvitationTemplate


def make_event(organizer, **overrides):
    template = InvitationTemplate.objects.get(key="heritage-luxe")
    fields = {
        "title": "Mariage de Grâce et Éric",
        "message": "Nous serions honorés de votre présence.",
        "event_date": datetime.date(2026, 12, 12),
        "event_time": datetime.time(15, 0),
        "timezone": "Africa/Kinshasa",
        "venue_name": "Salle des Fêtes",
    }
    fields.update(overrides)
    return EventModel.objects.create(organizer=organizer, template=template, **fields)


def make_invitation(event, **overrides):
    fields = {"guest_name": "Éric Mukendi", "civility": Invitation.Civility.M}
    fields.update(overrides)
    return Invitation.objects.create(event_model=event, **fields)


def make_question(event, label="Choix du repas", input_type="single", required=False, options=("Végétarien", "Standard")):
    question = PreferenceQuestion.objects.create(
        event_model=event, label=label, input_type=input_type, required=required
    )
    for index, option_label in enumerate(options):
        PreferenceOption.objects.create(question=question, label=option_label, order=index)
    return question


def public_url(invitation):
    return f"/api/public/invitations/{invitation.token}/"


def verify_url(invitation):
    return f"/api/public/invitations/{invitation.token}/verify/"


def response_url(invitation):
    return f"/api/public/invitations/{invitation.token}/response/"


def backdate_expiry(invitation):
    invitation.issued_at = timezone_now() - timedelta(hours=3)
    invitation.expires_at = timezone_now() - timedelta(hours=1)
    invitation.save(update_fields=["issued_at", "expires_at"])


# --- Public invitation page (Section 10) --------------------------------


def test_public_detail_renders_event_and_guest(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event, civility=Invitation.Civility.MME)

    response = api_client.get(public_url(invitation))

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "active"
    assert data["is_valid"] is True
    assert data["invitation"]["display_name"] == "Mme Éric Mukendi"
    assert data["event"]["title"] == "Mariage de Grâce et Éric"
    assert data["event"]["message"] == "Nous serions honorés de votre présence."
    assert data["event"]["venue_name"] == "Salle des Fêtes"
    assert data["event"]["template"]["key"] == "heritage-luxe"
    assert data["response"] is None


def test_public_detail_unknown_token_is_404(api_client, organizer):
    make_event(organizer)
    response = api_client.get("/api/public/invitations/jeton-inconnu-abc/")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_public_detail_deleted_is_indistinguishable_from_unknown(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    invitation.state = Invitation.State.DELETED
    invitation.save(update_fields=["state"])

    response = api_client.get(public_url(invitation))

    assert response.status_code == 404


def test_public_detail_expired_is_marked_invalid(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    backdate_expiry(invitation)

    data = api_client.get(public_url(invitation)).json()
    assert data["status"] == "expired"
    assert data["is_valid"] is False


def test_public_detail_revoked(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    invitation.state = Invitation.State.REVOKED
    invitation.save(update_fields=["state"])

    data = api_client.get(public_url(invitation)).json()
    assert data["status"] == "revoked"
    assert data["is_valid"] is False


def test_public_detail_lists_preference_questions(api_client, organizer):
    event = make_event(organizer)
    question = make_question(event, required=True)
    invitation = make_invitation(event)

    data = api_client.get(public_url(invitation)).json()
    assert data["preferences"]["enabled"] is True
    listed = data["preferences"]["questions"]
    assert listed[0]["id"] == question.pk
    assert listed[0]["required"] is True
    assert [option["label"] for option in listed[0]["options"]] == ["Végétarien", "Standard"]


def test_public_detail_preferences_disabled_without_questions(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    data = api_client.get(public_url(invitation)).json()
    assert data["preferences"]["enabled"] is False
    assert data["preferences"]["questions"] == []


# --- QR verification (Section 11) ---------------------------------------


def test_verify_valid(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    data = api_client.get(verify_url(invitation)).json()
    assert data["result"] == "valid"
    assert data["is_valid"] is True
    assert data["guest_name"] == "M. Éric Mukendi"
    assert data["event_title"] == "Mariage de Grâce et Éric"


def test_verify_expired(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    backdate_expiry(invitation)

    data = api_client.get(verify_url(invitation)).json()
    assert data["result"] == "expired"
    assert data["is_valid"] is False


def test_verify_revoked(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    invitation.state = Invitation.State.REVOKED
    invitation.save(update_fields=["state"])

    data = api_client.get(verify_url(invitation)).json()
    assert data["result"] == "revoked"
    assert data["is_valid"] is False


def test_verify_unknown_token_is_invalid_without_leaking_identity(api_client, organizer):
    make_event(organizer)
    data = api_client.get("/api/public/invitations/jeton-inconnu-abc/verify/").json()

    assert data["result"] == "invalid"
    assert data["is_valid"] is False
    assert "guest_name" not in data
    assert "event_title" not in data


def test_verify_deleted_token_is_invalid(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)
    invitation.state = Invitation.State.DELETED
    invitation.save(update_fields=["state"])

    data = api_client.get(verify_url(invitation)).json()
    assert data["result"] == "invalid"


# --- Guest preference submission (Section 13) ----------------------------


def test_submit_response_happy_path(api_client, organizer):
    event = make_event(organizer)
    meal = make_question(event, label="Repas", input_type="single", required=True, options=("Viande", "Poisson"))
    extras = make_question(event, label="Extras", input_type="multiple", options=("Vin", "Dessert", "Café"))
    invitation = make_invitation(event)

    payload = {
        "answers": [
            {"question": meal.pk, "options": [meal.options.get(label="Poisson").pk]},
            {"question": extras.pk, "options": [extras.options.get(label="Vin").pk, extras.options.get(label="Café").pk]},
        ]
    }
    response = api_client.post(response_url(invitation), payload, format="json")

    assert response.status_code == 201
    data = response.json()
    assert data["guest_name"] == "Éric Mukendi"
    by_question = {answer["question"]: answer for answer in data["answers"]}
    assert by_question[meal.pk]["question_label"] == "Repas"
    assert [o["label"] for o in by_question[meal.pk]["options"]] == ["Poisson"]
    assert [o["label"] for o in by_question[extras.pk]["options"]] == ["Vin", "Café"]
    assert GuestResponse.objects.filter(invitation=invitation).count() == 1


def test_submit_response_upserts_single_response(api_client, organizer):
    event = make_event(organizer)
    meal = make_question(event, label="Repas", input_type="single", options=("Viande", "Poisson"))
    invitation = make_invitation(event)

    first = api_client.post(
        response_url(invitation),
        {"answers": [{"question": meal.pk, "options": [meal.options.get(label="Viande").pk]}]},
        format="json",
    )
    second = api_client.post(
        response_url(invitation),
        {"answers": [{"question": meal.pk, "options": [meal.options.get(label="Poisson").pk]}]},
        format="json",
    )

    assert first.status_code == 201
    assert second.status_code == 200
    assert GuestResponse.objects.filter(invitation=invitation).count() == 1
    answer = GuestResponse.objects.get(invitation=invitation).answers.get()
    assert [o["label"] for o in [{"label": o.label} for o in answer.options.all()]] == ["Poisson"]


def test_submit_rejects_unknown_question(api_client, organizer):
    event = make_event(organizer)
    make_question(event)
    invitation = make_invitation(event)

    response = api_client.post(
        response_url(invitation),
        {"answers": [{"question": 99999, "options": [1]}]},
        format="json",
    )

    assert response.status_code == 400
    assert "answers.0.question" in response.json()["error"]["fields"]


def test_submit_rejects_option_from_another_question(api_client, organizer):
    event = make_event(organizer)
    meal = make_question(event, label="Repas", options=("Viande", "Poisson"))
    drinks = make_question(event, label="Boissons", options=("Eau", "Jus"))
    invitation = make_invitation(event)

    response = api_client.post(
        response_url(invitation),
        {"answers": [{"question": meal.pk, "options": [drinks.options.get(label="Eau").pk]}]},
        format="json",
    )

    assert response.status_code == 400
    assert "answers.0.options" in response.json()["error"]["fields"]


def test_submit_rejects_multiple_options_for_single_choice(api_client, organizer):
    event = make_event(organizer)
    meal = make_question(event, label="Repas", input_type="single", options=("Viande", "Poisson"))
    invitation = make_invitation(event)

    response = api_client.post(
        response_url(invitation),
        {"answers": [{"question": meal.pk, "options": [o.pk for o in meal.options.all()]}]},
        format="json",
    )

    assert response.status_code == 400
    assert "answers.0.options" in response.json()["error"]["fields"]


def test_submit_requires_required_question(api_client, organizer):
    event = make_event(organizer)
    make_question(event, label="Repas", required=True, options=("Viande", "Poisson"))
    invitation = make_invitation(event)

    response = api_client.post(response_url(invitation), {"answers": []}, format="json")

    assert response.status_code == 400
    assert "answers" in response.json()["error"]["fields"]


def test_submit_rejects_duplicate_question(api_client, organizer):
    event = make_event(organizer)
    meal = make_question(event, label="Repas", options=("Viande", "Poisson"))
    option = meal.options.first()
    invitation = make_invitation(event)

    response = api_client.post(
        response_url(invitation),
        {"answers": [{"question": meal.pk, "options": [option.pk]}, {"question": meal.pk, "options": [option.pk]}]},
        format="json",
    )

    assert response.status_code == 400
    assert "answers.1.question" in response.json()["error"]["fields"]


def test_submit_rejected_on_expired_invitation(api_client, organizer):
    event = make_event(organizer)
    meal = make_question(event, label="Repas", options=("Viande", "Poisson"))
    invitation = make_invitation(event)
    backdate_expiry(invitation)

    response = api_client.post(
        response_url(invitation),
        {"answers": [{"question": meal.pk, "options": [meal.options.first().pk]}]},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Cette invitation a expiré."


def test_submit_rejected_on_revoked_invitation(api_client, organizer):
    event = make_event(organizer)
    meal = make_question(event, label="Repas", options=("Viande", "Poisson"))
    invitation = make_invitation(event)
    invitation.state = Invitation.State.REVOKED
    invitation.save(update_fields=["state"])

    response = api_client.post(
        response_url(invitation),
        {"answers": [{"question": meal.pk, "options": [meal.options.first().pk]}]},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Cette invitation a été révoquée."


def test_submit_rejected_on_deleted_invitation(api_client, organizer):
    event = make_event(organizer)
    meal = make_question(event, label="Repas", options=("Viande", "Poisson"))
    invitation = make_invitation(event)
    invitation.state = Invitation.State.DELETED
    invitation.save(update_fields=["state"])

    response = api_client.post(
        response_url(invitation),
        {"answers": [{"question": meal.pk, "options": [meal.options.first().pk]}]},
        format="json",
    )

    assert response.status_code == 404


# --- Organizer response report (Sections 13 and 15) ----------------------


def test_organizer_lists_responses_with_summary(auth_client, organizer):
    event = make_event(organizer)
    meal = make_question(event, label="Repas", input_type="single", options=("Viande", "Poisson"))
    invitation_a = make_invitation(event, guest_name="Ana Diomi")
    invitation_b = make_invitation(event, guest_name="Sarah Kabamba")

    api_client = auth_client
    api_client.post(
        response_url(invitation_a),
        {"answers": [{"question": meal.pk, "options": [meal.options.get(label="Viande").pk]}]},
        format="json",
    )
    api_client.post(
        response_url(invitation_b),
        {"answers": [{"question": meal.pk, "options": [meal.options.get(label="Viande").pk]}]},
        format="json",
    )

    response = api_client.get(f"/api/events/{event.pk}/responses/")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 2
    assert data["summary"]["responses"] == 2
    assert data["summary"]["invitations"] == 2
    counts = {opt["label"]: opt["count"] for opt in data["summary"]["questions"][0]["options"]}
    assert counts == {"Viande": 2, "Poisson": 0}
    assert {row["guest_name"] for row in data["results"]} == {"Ana Diomi", "Sarah Kabamba"}
    assert data["results"][0]["answers"][0]["question_label"] == "Repas"


def test_responses_require_authentication(api_client, organizer):
    event = make_event(organizer)
    response = api_client.get(f"/api/events/{event.pk}/responses/")

    assert response.status_code == 401


def test_other_organizer_cannot_see_responses(auth_client, second_organizer):
    event = make_event(second_organizer)
    response = auth_client.get(f"/api/events/{event.pk}/responses/")

    assert response.status_code == 404


def test_empty_responses_report(auth_client, organizer):
    event = make_event(organizer)
    make_invitation(event)

    data = auth_client.get(f"/api/events/{event.pk}/responses/").json()
    assert data["count"] == 0
    assert data["summary"]["responses"] == 0
    assert data["summary"]["invitations"] == 1


# --- Dress code + programme sections (content-gated) ----------------------

def test_public_detail_includes_dress_code_and_program(api_client, organizer):
    event = make_event(organizer)
    DressCodeImage.objects.create(
        event=event, image="dress_code/x.jpg", caption="Tenue de cérémonie", order=0
    )
    ProgramItem.objects.create(
        event=event, start_time=datetime.time(19, 30), description="Accueil des invités", order=0
    )
    ProgramItem.objects.create(
        event=event,
        start_time=datetime.time(20, 0),
        end_time=datetime.time(21, 0),
        description="Dîner et discours",
        order=1,
    )
    invitation = make_invitation(event)

    data = api_client.get(public_url(invitation)).json()

    assert data["dress_code"]["enabled"] is True
    assert data["dress_code"]["images"][0]["caption"] == "Tenue de cérémonie"
    assert data["dress_code"]["images"][0]["url"].startswith("http://testserver/")
    assert data["program"]["enabled"] is True
    assert [item["description"] for item in data["program"]["items"]] == [
        "Accueil des invités",
        "Dîner et discours",
    ]
    assert data["program"]["items"][0]["start_time"] == "19:30:00"
    assert data["program"]["items"][0]["end_time"] is None
    assert data["program"]["items"][1]["end_time"] == "21:00:00"


def test_public_detail_hides_empty_dress_code_and_program(api_client, organizer):
    event = make_event(organizer)
    invitation = make_invitation(event)

    data = api_client.get(public_url(invitation)).json()

    assert data["dress_code"] == {"enabled": False, "images": []}
    assert data["program"] == {"enabled": False, "items": []}
