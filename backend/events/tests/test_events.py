"""End-to-end tests for event invitation model CRUD (product brief Section 8)."""
import datetime

from events.models import EventModel
from invitations.models import Invitation
from preferences.models import GuestResponse, GuestResponseAnswer, PreferenceOption, PreferenceQuestion
from templates_app.models import InvitationTemplate

ENDPOINT = "/api/events/"


def make_payload(**overrides):
    payload = {
        "template": "heritage-luxe",
        "title": "Mariage de Grâce et Éric",
        "message": "Nous serions honorés de votre présence.",
        "event_date": "2026-12-12",
        "event_time": "15:00:00",
        "timezone": "Africa/Kinshasa",
        "venue_name": "Salle des fêtes",
        "venue_address": "Avenue de la Paix 12, Kinshasa",
        "venue_details": "Tenue de cérémonie souhaitée.",
        "display_config": {"emphasis": ["title", "date"]},
        "preference_questions": [],
    }
    payload.update(overrides)
    return payload


def make_event(organizer, template_key="heritage-luxe", **overrides):
    template = InvitationTemplate.objects.get(key=template_key)
    fields = {
        "title": "Événement de test",
        "event_date": datetime.date(2026, 12, 12),
        "event_time": datetime.time(15, 0),
        "timezone": "Africa/Kinshasa",
    }
    fields.update(overrides)
    return EventModel.objects.create(organizer=organizer, template=template, **fields)


def test_event_creation_requires_authentication(api_client):
    response = api_client.post(ENDPOINT, make_payload(), format="json")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "not_authenticated"


def test_create_event_with_questions_happy_path(auth_client, organizer):
    payload = make_payload(
        preference_questions=[
            {
                "label": "Serez-vous présent ?",
                "help_text": "Merci de répondre avant le 1er décembre.",
                "input_type": "single",
                "required": True,
                "options": [{"label": "Oui"}, {"label": "Non"}],
            }
        ]
    )

    response = auth_client.post(ENDPOINT, payload, format="json")

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Mariage de Grâce et Éric"
    assert data["template"] == "heritage-luxe"
    assert data["template_detail"]["name"] == "Héritage"
    assert data["cover_url"] is None
    assert data["invitations_count"] == 0
    assert data["display_config"] == {"emphasis": ["title", "date"]}

    event = EventModel.objects.get(pk=data["id"])
    assert event.organizer == organizer
    assert event.event_date == datetime.date(2026, 12, 12)

    questions = data["preference_questions"]
    assert len(questions) == 1
    question = questions[0]
    assert question["label"] == "Serez-vous présent ?"
    assert question["required"] is True
    assert question["order"] == 0
    assert [option["label"] for option in question["options"]] == ["Oui", "Non"]

    persisted = event.preference_questions.get()
    assert persisted.options.count() == 2


def test_create_validates_timezone(auth_client):
    response = auth_client.post(ENDPOINT, make_payload(timezone="Mars/Phobos"), format="json")

    assert response.status_code == 400
    assert response.json()["error"]["fields"]["timezone"] == ["Fuseau horaire invalide."]


def test_create_persists_message_font(auth_client):
    response = auth_client.post(ENDPOINT, make_payload(message_font="scripte"), format="json")

    assert response.status_code == 201
    assert response.json()["message_font"] == "scripte"
    event = EventModel.objects.get(pk=response.json()["id"])
    assert event.message_font == "scripte"


def test_create_rejects_invalid_message_font(auth_client):
    response = auth_client.post(ENDPOINT, make_payload(message_font="comic-sans"), format="json")

    assert response.status_code == 400
    assert response.json()["error"]["fields"]["message_font"] == ["Police du message invalide."]


def test_create_rejects_unknown_template(auth_client):
    response = auth_client.post(ENDPOINT, make_payload(template="modele-inconnu"), format="json")

    assert response.status_code == 400
    assert response.json()["error"]["fields"]["template"] == [
        "Ce modèle n'existe pas ou n'est plus disponible."
    ]


def test_create_rejects_inactive_template(auth_client):
    InvitationTemplate.objects.filter(key="heritage-luxe").update(is_active=False)

    response = auth_client.post(ENDPOINT, make_payload(), format="json")

    assert response.status_code == 400
    assert "template" in response.json()["error"]["fields"]


def test_display_config_rejects_unknown_keys(auth_client):
    response = auth_client.post(
        ENDPOINT, make_payload(display_config={"blink": True}), format="json"
    )

    assert response.status_code == 400
    assert "display_config" in response.json()["error"]["fields"]


def test_display_config_rejects_unsupported_emphasis(auth_client):
    # confetti only supports emphasizing title and date.
    response = auth_client.post(
        ENDPOINT,
        make_payload(template="confetti", display_config={"emphasis": ["venue"]}),
        format="json",
    )

    assert response.status_code == 400
    fields = response.json()["error"]["fields"]
    assert "Champs non supportés par ce modèle : venue." in fields["display_config.emphasis"]


def test_list_is_scoped_and_filterable(auth_client, organizer, second_organizer):
    make_event(organizer, title="Mariage de Grâce et Éric", template_key="heritage-luxe")
    make_event(organizer, title="Anniversaire de Sarah", template_key="confetti")
    make_event(second_organizer, title="Événement privé d'un autre")

    response = auth_client.get(ENDPOINT)

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 2
    titles = {item["title"] for item in body["results"]}
    assert titles == {"Mariage de Grâce et Éric", "Anniversaire de Sarah"}

    searched = auth_client.get(ENDPOINT, {"q": "Anniv"})
    assert [item["title"] for item in searched.json()["results"]] == ["Anniversaire de Sarah"]

    by_category = auth_client.get(ENDPOINT, {"category": "wedding"})
    assert [item["title"] for item in by_category.json()["results"]] == ["Mariage de Grâce et Éric"]

    inactive_only = auth_client.get(ENDPOINT, {"is_active": "false"})
    assert inactive_only.json()["count"] == 0


def test_cross_organizer_access_returns_404(auth_client, second_organizer):
    foreign = make_event(second_organizer, title="Événement d'un autre")

    for method in ("get", "patch", "delete"):
        response = getattr(auth_client, method)(
            f"{ENDPOINT}{foreign.pk}/",
            {"title": "Piraté"} if method == "patch" else None,
            format="json",
        )
        assert response.status_code == 404, method
        assert response.json()["error"]["code"] == "not_found"


def test_update_propagates_shared_fields_and_changes_template(auth_client, organizer):
    event = make_event(organizer, title="Ancien titre", message="Message conservé")
    payload = {"title": "Titre mis à jour", "template": "jardin-floral"}

    response = auth_client.patch(f"{ENDPOINT}{event.pk}/", payload, format="json")

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Titre mis à jour"
    assert data["template"] == "jardin-floral"
    # Unprovided shared fields are preserved (partial update).
    assert data["message"] == "Message conservé"
    event.refresh_from_db()
    assert event.template.key == "jardin-floral"


def test_delete_blocked_when_invitations_exist(auth_client, organizer):
    event = make_event(organizer)
    invitation = Invitation.objects.create(event_model=event, guest_name="Josué")

    response = auth_client.delete(f"{ENDPOINT}{event.pk}/")

    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "event_has_invitations"
    assert "invitations" in error["message"]

    # Once the guest list is cleared (soft deletion counts as removal), the
    # event model can go — tombstones keep the response audit trail.
    invitation.state = Invitation.State.DELETED
    invitation.save(update_fields=["state"])
    allowed = auth_client.delete(f"{ENDPOINT}{event.pk}/")
    assert allowed.status_code == 204
    assert not EventModel.objects.filter(pk=event.pk).exists()


def test_delete_blocked_when_responses_exist(auth_client, organizer):
    event = make_event(organizer)
    question = PreferenceQuestion.objects.create(event_model=event, label="Serez-vous présent ?")
    option = PreferenceOption.objects.create(question=question, label="Oui")
    invitation = Invitation.objects.create(event_model=event, guest_name="Josué")
    response = GuestResponse.objects.create(invitation=invitation)
    answer = GuestResponseAnswer.objects.create(response=response, question=question)
    answer.options.add(option)

    # Clear the guest list first (tombstone), so the delete reaches the
    # answered questions — which are PROTECT and must yield a clean 400,
    # never a 500, and must not destroy anything.
    invitation.state = Invitation.State.DELETED
    invitation.save(update_fields=["state"])

    res = auth_client.delete(f"{ENDPOINT}{event.pk}/")

    assert res.status_code == 400
    error = res.json()["error"]
    assert error["code"] == "event_has_responses"
    assert "réponses" in error["message"]
    assert EventModel.objects.filter(pk=event.pk).exists()
    assert question.pk and GuestResponseAnswer.objects.filter(pk=answer.pk).exists()


def test_delete_event_without_invitations(auth_client, organizer):
    event = make_event(organizer)

    response = auth_client.delete(f"{ENDPOINT}{event.pk}/")

    assert response.status_code == 204
    assert not EventModel.objects.filter(pk=event.pk).exists()
