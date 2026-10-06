"""Organizer account model tests (provisioning + integrity)."""
import pytest
from django.db import IntegrityError, transaction

from accounts.models import Organizer


@pytest.mark.django_db
class TestOrganizerManager:
    def test_create_user_normalizes_email(self):
        user = Organizer.objects.create_user(email="Nadine@Example.COM", password="x")
        assert user.email == "Nadine@example.com"
        assert user.check_password("x")
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_superuser_requires_privileges(self):
        with pytest.raises(ValueError):
            Organizer.objects.create_superuser(email="root@example.com", password="x", is_staff=False)

    def test_create_superuser(self):
        root = Organizer.objects.create_superuser(email="root@example.com", password="x")
        assert root.is_staff and root.is_superuser

    def test_email_is_unique(self):
        Organizer.objects.create_user(email="dup@example.com", password="x")
        with pytest.raises(IntegrityError), transaction.atomic():
            Organizer.objects.create_user(email="dup@example.com", password="x")

    def test_full_name_falls_back_to_email(self):
        user = Organizer.objects.create_user(email="solo@example.com", password="x")
        assert user.full_name == "solo@example.com"
        user.first_name, user.last_name = "Nadine", "Kabeya"
        assert user.full_name == "Nadine Kabeya"
