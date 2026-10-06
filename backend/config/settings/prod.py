"""Production settings.

Fails fast when required secrets are missing. Deployed on Vercel's Python
runtime behind TLS termination (see docs/deployment.md for the topology that
still needs live verification).
"""
from config.env import ImproperlyConfigured  # noqa: F401
from .base import *  # noqa: F401,F403

DEBUG = False

# Required in production — env() raises when absent.
SECRET_KEY = env("DJANGO_SECRET_KEY")
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")

# HTTPS hardening (Vercel terminates TLS and sets X-Forwarded-Proto).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", "true")
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = env_int("DJANGO_SECURE_HSTS_SECONDS", "3600")
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False
X_FRAME_OPTIONS = "DENY"

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# When frontend and API live on different registrable domains (e.g. two Vercel
# projects), cookies must be SameSite=None; Secure so the SPA can authenticate.
SESSION_COOKIE_SAMESITE = env("SESSION_COOKIE_SAMESITE", "None")
CSRF_COOKIE_SAMESITE = env("CSRF_COOKIE_SAMESITE", "None")

# Fail loudly on the first misconfiguration instead of at request time.
if not DATABASES["default"].get("NAME"):  # noqa: F405
    raise ImproperlyConfigured("DATABASE_URL must be configured in production")  # noqa: F405
