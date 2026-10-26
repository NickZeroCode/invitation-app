"""Guest-list export: the Excel workbook, its download and its e-mail.

Covers ownership isolation, the workbook's content (seating order, tables,
presence, answers, links, totals), formula-injection safety, and the e-mail
route's validation, not-configured and provider-failure paths.
"""
import io
from datetime import timedelta
from unittest import mock

import pytest
from django.core import mail
from django.utils.timezone import now as timezone_now
from openpyxl import load_workbook

from events.models import EventTable
from invitations.models import Invitation
from invitations.tests.test_public import make_event, make_invitation, make_question
from preferences.models import GuestResponse, GuestResponseAnswer

XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def export_url(event):
    return f"/api/events/{event.pk}/guests/export/"


def email_url(event):
    return f"/api/events/{event.pk}/guests/export/email/"


def rows(sheet, header_text):
    """Data rows under the header row that starts with ``header_text``."""
    values = list(sheet.iter_rows(values_only=True))
    start = next(index for index, row in enumerate(values) if row[0] == header_text)
    header = values[start]
    return header, [row for row in values[start + 1 :] if any(cell is not None for cell in row)]


@pytest.fixture
def event(organizer):
    return make_event(organizer)


@pytest.fixture(autouse=True)
def _site(settings):
    settings.PUBLIC_APP_URL = "https://www.malaikaevent.com"
    settings.INVITATION_EMAIL_ENABLED = True


@pytest.fixture
def seated(event):
    """Guests at tables 10, 2 and none, a deleted one and a revoked one."""
    EventTable.objects.create(event=event, number="7", text="Famille", order=0)  # empty registry table
    meal = make_question(event)
    standard = meal.options.get(label="Standard")
    late = make_invitation(event, guest_name="Zoé Mbuyi", civility=Invitation.Civility.MME, table_number="10")
    early = make_invitation(
        event, guest_name="Aline Kasongo", civility=Invitation.Civility.NONE, table_number="2", table_text="Près de la piste"
    )
    early.presence_confirmed_at = timezone_now() - timedelta(days=1)
    early.save()
    response = GuestResponse.objects.create(invitation=early)
    answer = GuestResponseAnswer.objects.create(response=response, question=meal)
    answer.options.add(standard)
    loose = make_invitation(event, guest_name="Bob Ilunga")
    make_invitation(event, guest_name="Effacé", state=Invitation.State.DELETED)
    make_invitation(event, guest_name="Révoqué", table_number="2", state=Invitation.State.REVOKED)
    return {"late": late, "early": early, "loose": loose}


@pytest.mark.django_db
class TestDownload:
    def test_returns_an_xlsx_attachment_named_after_the_event(self, auth_client, event):
        response = auth_client.get(export_url(event))
        assert response.status_code == 200
        assert response["Content-Type"] == XLSX
        assert (
            response["Content-Disposition"]
            == 'attachment; filename="invites-mariage-de-grace-et-eric-2026-12-12.xlsx"'
        )
        workbook = load_workbook(io.BytesIO(response.content))
        assert workbook.sheetnames == ["Invités", "Tables", "Résumé"]

    def test_lists_guests_by_table_with_presence_and_status(self, auth_client, event, seated):
        workbook = load_workbook(io.BytesIO(auth_client.get(export_url(event)).content))
        header, data = rows(workbook["Invités"], "N°")
        assert header[:11] == (
            "N°", "Invité", "Civilité", "Nom", "Table", "Précision de table",
            "Présence", "Confirmée le", "Invitation", "Émise le", "Expire le",
        )
        # No answer columns, no personal link: the header stops at « Expire le ».
        assert [cell for cell in header if cell is not None] == list(header[:11])
        # Table 2 before table 10 (natural order), guests without a table last;
        # the deleted invitation is left out, the revoked one stays listed.
        assert [row[1] for row in data] == ["Aline Kasongo", "M. Révoqué", "Mme Zoé Mbuyi", "M. Bob Ilunga"]
        aline = data[0]
        assert aline[4] == "2" and aline[5] == "Près de la piste"
        assert aline[6] == "Confirmée" and aline[7] is not None
        everything = [str(cell) for row in workbook["Invités"].iter_rows(values_only=True) for cell in row if cell]
        assert not any("Standard" in cell or "/i/" in cell for cell in everything)
        assert data[1][8] == "Révoquée"
        assert data[2][6] == "En attente"

    def test_tables_sheet_counts_seats_and_keeps_empty_tables(self, auth_client, event, seated):
        workbook = load_workbook(io.BytesIO(auth_client.get(export_url(event)).content))
        _, data = rows(workbook["Tables"], "Table")
        by_table = {row[0]: row for row in data}
        assert list(by_table) == ["2", "7", "10", "Sans table"]
        assert by_table["2"][2:4] == (1, 1)  # the revoked guest holds no seat
        assert by_table["7"][1:3] == ("Famille", 0)
        assert by_table["Sans table"][4] == "M. Bob Ilunga"

    def test_summary_totals(self, auth_client, event, seated):
        workbook = load_workbook(io.BytesIO(auth_client.get(export_url(event)).content))
        _, data = rows(workbook["Résumé"], "Indicateur")
        figures = dict(data)
        assert figures["Invités"] == 4
        assert figures["Présences confirmées"] == 1
        assert figures["Invitations révoquées"] == 1
        assert figures["Tables"] == 3
        assert "Réponses aux questions" not in figures

    def test_user_text_never_becomes_a_formula(self, auth_client, event):
        make_invitation(event, guest_name='=HYPERLINK("http://evil.example","clic")', civility=Invitation.Civility.NONE)
        workbook = load_workbook(io.BytesIO(auth_client.get(export_url(event)).content))
        sheet = workbook["Invités"]
        cell = next(cell for row in sheet.iter_rows() for cell in row if cell.value and str(cell.value).startswith("=HYPERLINK"))
        assert cell.data_type == "s"

    def test_other_organizer_gets_404(self, api_client, second_organizer, event):
        api_client.force_authenticate(user=second_organizer)
        assert api_client.get(export_url(event)).status_code == 404

    def test_anonymous_cannot_download(self, api_client, event):
        assert api_client.get(export_url(event)).status_code in (401, 403)


@pytest.mark.django_db
class TestEmail:
    def test_sends_the_workbook_as_an_attachment(self, auth_client, event, seated, organizer):
        response = auth_client.post(email_url(event), {"recipient": "traiteur@example.com", "message": "Voici la liste."})
        assert response.status_code == 200
        assert response.json() == {"status": "accepted"}
        message = mail.outbox[0]
        assert message.to == ["traiteur@example.com"]
        assert message.reply_to == [organizer.email]
        assert message.subject == "Liste des invités — Mariage de Grâce et Éric"
        assert "Voici la liste." in message.body
        filename, content, mimetype = message.attachments[0]
        assert filename == "invites-mariage-de-grace-et-eric-2026-12-12.xlsx"
        assert mimetype == XLSX
        assert load_workbook(io.BytesIO(content)).sheetnames == ["Invités", "Tables", "Résumé"]
        assert "4 invités" in message.body

    def test_rejects_an_invalid_address(self, auth_client, event):
        response = auth_client.post(email_url(event), {"recipient": "pas-une-adresse"})
        assert response.status_code == 400
        assert "recipient" in response.json()["error"]["fields"]
        assert mail.outbox == []

    def test_not_configured_is_an_explicit_503(self, auth_client, event, settings):
        settings.INVITATION_EMAIL_ENABLED = False
        response = auth_client.post(email_url(event), {"recipient": "traiteur@example.com"})
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "email_unavailable"

    def test_provider_failure_is_never_reported_as_sent(self, auth_client, event):
        with mock.patch("django.core.mail.EmailMultiAlternatives.send", side_effect=OSError("smtp down")):
            response = auth_client.post(email_url(event), {"recipient": "traiteur@example.com"})
        assert response.status_code == 502
        assert response.json()["error"]["code"] == "email_failed"

    def test_other_organizer_gets_404(self, api_client, second_organizer, event):
        api_client.force_authenticate(user=second_organizer)
        response = api_client.post(email_url(event), {"recipient": "traiteur@example.com"})
        assert response.status_code == 404
        assert mail.outbox == []
