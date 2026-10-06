"""Shared pytest fixtures."""
import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

PASSWORD = "MotDePasse-Solide-2026"


@pytest.fixture(autouse=True)
def _clear_throttle_cache():
    """Rate-limit state must never leak between tests."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def _fast_password_hashing(settings):
    """Fast hasher for tests only — production keeps Django's secure defaults."""
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def organizer(db, django_user_model):
    return django_user_model.objects.create_user(
        email="organisateur@example.com",
        password=PASSWORD,
        first_name="Nadine",
        last_name="Kabeya",
    )


@pytest.fixture
def second_organizer(db, django_user_model):
    return django_user_model.objects.create_user(
        email="autre-organisateur@example.com",
        password=PASSWORD,
        first_name="Paul",
        last_name="Ilunga",
    )


@pytest.fixture
def auth_client(api_client, organizer):
    api_client.force_authenticate(user=organizer)
    return api_client
