"""Development settings. Never use in production."""
from .base import *  # noqa: F401,F403

DEBUG = True
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Unhashed static files + finders so /admin/ renders styled without a
# collectstatic step. Production keeps the manifest storage from base.py.
STORAGES["staticfiles"]["backend"] = "whitenoise.storage.CompressedStaticFilesStorage"  # noqa: F405
WHITENOISE_USE_FINDERS = True

# Local development serves uploaded media from the filesystem (see base.py
# NOTE for the production storage requirement).
