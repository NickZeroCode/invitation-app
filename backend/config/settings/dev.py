"""Development settings. Never use in production."""
from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")

# Invitation e-mails print to the runserver console in development, unless a
# real SMTP relay is configured in .env (then it is used, like production).
if not SMTP_HOST:  # noqa: F405
    MAILERS = {"default": {"BACKEND": "django.core.mail.backends.console.EmailBackend"}}
INVITATION_EMAIL_ENABLED = True

# Unhashed static files + finders so /admin/ renders styled without a
# collectstatic step. Production keeps the manifest storage from base.py.
STORAGES["staticfiles"]["backend"] = "whitenoise.storage.CompressedStaticFilesStorage"  # noqa: F405
WHITENOISE_USE_FINDERS = True

# Local development serves uploaded media from the filesystem (see base.py
# NOTE for the production storage requirement).
