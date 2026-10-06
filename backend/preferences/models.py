"""Guest preference questions, options and responses (product brief Section 13).

Business rule (documented default): one response per invitation, editable
until the invitation expires. Answers reference the questions/options defined
on the event model — arbitrary options are rejected by the API layer.
"""
from django.db import models

from events.models import EventModel
from invitations.models import Invitation


class PreferenceQuestion(models.Model):
    class InputType(models.TextChoices):
        SINGLE = "single", "Choix unique"
        MULTIPLE = "multiple", "Choix multiples"

    event_model = models.ForeignKey(EventModel, on_delete=models.CASCADE, related_name="preference_questions")
    label = models.CharField("question", max_length=255)
    help_text = models.CharField("précision", max_length=255, blank=True)
    input_type = models.CharField("type", max_length=16, choices=InputType.choices, default=InputType.SINGLE)
    required = models.BooleanField("obligatoire", default=False)
    order = models.PositiveIntegerField("ordre", default=0)
    is_active = models.BooleanField("actif", default=True)

    class Meta:
        verbose_name = "question de préférence"
        verbose_name_plural = "questions de préférence"
        ordering = ("order", "id")

    def __str__(self) -> str:
        return self.label


class PreferenceOption(models.Model):
    question = models.ForeignKey(PreferenceQuestion, on_delete=models.CASCADE, related_name="options")
    label = models.CharField("option", max_length=255)
    order = models.PositiveIntegerField("ordre", default=0)

    class Meta:
        verbose_name = "option de préférence"
        verbose_name_plural = "options de préférence"
        ordering = ("order", "id")

    def __str__(self) -> str:
        return self.label


class GuestResponse(models.Model):
    """One response per invitation; editable until the invitation expires."""

    invitation = models.OneToOneField(Invitation, on_delete=models.CASCADE, related_name="preference_response")
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "réponse d'invité"
        verbose_name_plural = "réponses d'invités"
        ordering = ("-submitted_at",)

    def __str__(self) -> str:
        return f"Réponse de {self.invitation.guest_name}"


class GuestResponseAnswer(models.Model):
    response = models.ForeignKey(GuestResponse, on_delete=models.CASCADE, related_name="answers")
    # PROTECT: a question with recorded answers can never be silently destroyed.
    question = models.ForeignKey(PreferenceQuestion, on_delete=models.PROTECT, related_name="answers")
    options = models.ManyToManyField(PreferenceOption, related_name="answers")

    class Meta:
        verbose_name = "réponse à une question"
        verbose_name_plural = "réponses aux questions"
        constraints = [
            models.UniqueConstraint(fields=["response", "question"], name="unique_answer_per_question"),
        ]

    def __str__(self) -> str:
        return f"Réponse à « {self.question.label} »"
