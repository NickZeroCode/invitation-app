"""Nested preference question management rules (product brief Sections 8 & 13)."""
from events.models import EventModel
from invitations.models import Invitation
from preferences.models import GuestResponse, GuestResponseAnswer
from templates_app.models import InvitationTemplate

from .test_events import ENDPOINT, make_payload


def collect_messages(value):
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        return [message for item in value.values() for message in collect_messages(item)]
    if isinstance(value, list):
        return [message for item in value for message in collect_messages(item)]
    return []


def question_payload(label, options, **overrides):
    payload = {
        "label": label,
        "help_text": "",
        "input_type": "single",
        "required": True,
        "options": [{"label": option} for option in options],
    }
    payload.update(overrides)
    return payload


def create_event_with_question(auth_client, **question_overrides):
    response = auth_client.post(
        ENDPOINT,
        make_payload(
            preference_questions=[
                question_payload("Serez-vous présent ?", ["Oui", "Non"], **question_overrides)
            ]
        ),
        format="json",
    )
    assert response.status_code == 201
    return response.json()


def attach_answer(event_id, question_id, option_ids):
    event = EventModel.objects.get(pk=event_id)
    invitation = Invitation.objects.create(event_model=event, guest_name="Josué")
    response = GuestResponse.objects.create(invitation=invitation)
    answer = GuestResponseAnswer.objects.create(response=response, question_id=question_id)
    answer.options.set(option_ids)
    return answer


def test_question_lifecycle_when_unanswered(auth_client):
    data = create_event_with_question(auth_client)
    question = data["preference_questions"][0]

    updated = auth_client.patch(
        f"{ENDPOINT}{data['id']}/",
        {
            "preference_questions": [
                # Relabel + replace options (removal allowed while unanswered).
                {
                    "id": question["id"],
                    "label": "Présence confirmée ?",
                    "input_type": "single",
                    "required": False,
                    "options": [{"id": question["options"][1]["id"], "label": "Absents"}],
                },
                # New question appended.
                question_payload("Quel menu préférez-vous ?", ["Poulet", "Poisson"], input_type="multiple"),
            ]
        },
        format="json",
    )

    assert updated.status_code == 200
    questions = updated.json()["preference_questions"]
    assert [item["label"] for item in questions] == ["Présence confirmée ?", "Quel menu préférez-vous ?"]
    first = questions[0]
    assert first["required"] is False
    assert [option["label"] for option in first["options"]] == ["Absents"]

    # Questions omitted from the payload are deleted while unanswered.
    trimmed = auth_client.patch(
        f"{ENDPOINT}{data['id']}/",
        {"preference_questions": [question_payload("Uniquement ?", ["Oui", "Non"])]},
        format="json",
    )
    assert trimmed.status_code == 200
    assert len(trimmed.json()["preference_questions"]) == 1
    assert not EventModel.objects.get(pk=data["id"]).preference_questions.filter(pk=question["id"]).exists()


def test_answered_question_forbids_option_removal(auth_client):
    data = create_event_with_question(auth_client)
    question = data["preference_questions"][0]
    attach_answer(data["id"], question["id"], [question["options"][0]["id"]])

    response = auth_client.patch(
        f"{ENDPOINT}{data['id']}/",
        {"preference_questions": [{"id": question["id"], "options": [{"id": question["options"][1]["id"]}]}]},
        format="json",
    )

    assert response.status_code == 400
    messages = collect_messages(response.json()["error"]["fields"])
    assert "Impossible de retirer des options déjà utilisées dans des réponses." in messages


def test_answered_question_forbids_type_change(auth_client):
    data = create_event_with_question(auth_client)
    question = data["preference_questions"][0]
    attach_answer(data["id"], question["id"], [question["options"][0]["id"]])

    response = auth_client.patch(
        f"{ENDPOINT}{data['id']}/",
        {"preference_questions": [{"id": question["id"], "input_type": "multiple"}]},
        format="json",
    )

    assert response.status_code == 400
    messages = collect_messages(response.json()["error"]["fields"])
    assert "Le type ne peut plus changer : des réponses utilisent cette question." in messages


def test_answered_question_forbids_question_removal(auth_client):
    data = create_event_with_question(auth_client)
    question = data["preference_questions"][0]
    attach_answer(data["id"], question["id"], [question["options"][0]["id"]])

    response = auth_client.patch(
        f"{ENDPOINT}{data['id']}/",
        {"preference_questions": []},
        format="json",
    )

    assert response.status_code == 400
    messages = collect_messages(response.json()["error"]["fields"])
    assert any("a déjà des réponses et ne peut pas être supprimée" in message for message in messages)


def test_answered_question_allows_label_and_new_options(auth_client):
    data = create_event_with_question(auth_client)
    question = data["preference_questions"][0]
    attach_answer(data["id"], question["id"], [question["options"][0]["id"]])

    response = auth_client.patch(
        f"{ENDPOINT}{data['id']}/",
        {
            "preference_questions": [
                {
                    "id": question["id"],
                    "label": "Confirmez votre présence",
                    "options": [
                        {"id": question["options"][0]["id"], "label": "Oui, avec plaisir"},
                        {"id": question["options"][1]["id"], "label": "Non"},
                        {"label": "Peut-être"},
                    ],
                }
            ]
        },
        format="json",
    )

    assert response.status_code == 200
    saved = response.json()["preference_questions"][0]
    assert saved["label"] == "Confirmez votre présence"
    assert [option["label"] for option in saved["options"]] == ["Oui, avec plaisir", "Non", "Peut-être"]


def test_question_rejects_empty_options(auth_client):
    response = auth_client.post(
        ENDPOINT,
        make_payload(preference_questions=[question_payload("Sans option ?", [])]),
        format="json",
    )

    assert response.status_code == 400
    messages = collect_messages(response.json()["error"]["fields"])
    assert "Ajoutez au moins une option de réponse." in messages
