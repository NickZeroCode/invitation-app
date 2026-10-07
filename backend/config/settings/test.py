"""Test settings: always isolated SQLite, never a shared database.

pytest-django creates a test database from ``DATABASES``. When a local
``.env`` carries a Neon ``DATABASE_URL``, running the suite with dev/prod
settings would CREATE and DROP a ``test_*`` database on the production
cluster. Tests therefore run on in-memory SQLite regardless of the
environment; run migrations against real databases explicitly and only from
the deployment release step.
"""
from .dev import *  # noqa: F401,F403

DATABASES = {
    "default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"},
}
