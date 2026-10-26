"""Base settings shared by every environment."""
from pathlib import Path

from config.env import env, env_bool, env_int, env_list, parse_database_url

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# --- Core -----------------------------------------------------------------
SECRET_KEY = env("DJANGO_SECRET_KEY", "dev-only-insecure-secret-key-change-me")
DEBUG = env_bool("DJANGO_DEBUG", "false")
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    # Project apps
    "core",
    "accounts",
    "templates_app",
    "events",
    "invitations",
    "preferences",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# --- Database -------------------------------------------------------------
# Development/tests: sqlite (DATABASE_URL default). Staging/production: Neon
# PostgreSQL via DATABASE_URL=postgresql://... (pooled connection string).
DATABASES = {
    "default": parse_database_url(env("DATABASE_URL", "sqlite:///db.sqlite3"), BASE_DIR)
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- Auth -----------------------------------------------------------------
AUTH_USER_MODEL = "accounts.Organizer"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- I18n / time ----------------------------------------------------------
LANGUAGE_CODE = "fr"
TIME_ZONE = env("DJANGO_TIME_ZONE", "Africa/Kinshasa")
USE_I18N = True
USE_TZ = True  # store UTC; display in the event's configured timezone

# --- Static / media -------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
# NOTE: production media (cover images) must live in verified S3-compatible
# object storage — see docs/deployment.md. Local filesystem storage is for
# development only and is not a valid production strategy on serverless.

# --- CORS / CSRF ----------------------------------------------------------
# The SPA (Vercel frontend project) calls the API with credentials.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:5173")
CORS_ALLOW_CREDENTIALS = True
# The guest-list download names its file here; cross-origin JS only sees
# headers listed explicitly.
CORS_EXPOSE_HEADERS = ["Content-Disposition"]
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "http://localhost:5173")

# The SPA reads the CSRF cookie to send the X-CSRFToken header.
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = env("SESSION_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SAMESITE = env("CSRF_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_AGE = env_int("SESSION_COOKIE_AGE", str(60 * 60 * 24 * 14))  # 14 days

# --- Django REST Framework ------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "core.authentication.SessionCookieAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_THROTTLE_RATES": {
        # Sensitive auth endpoints (login) and future public endpoints.
        "auth": env("THROTTLE_AUTH_RATE", "20/min"),
        "public": env("THROTTLE_PUBLIC_RATE", "120/min"),
        # QR verification: code exchange is brute-force sensitive (plus the
        # per-link lock), scans run in bursts at the door.
        "verify-code": env("THROTTLE_VERIFY_CODE_RATE", "10/min"),
        "verify": env("THROTTLE_VERIFY_RATE", "60/min"),
        # Organizer → guest invitation e-mails (per organizer account).
        "share-email": env("THROTTLE_SHARE_EMAIL_RATE", "40/hour"),
    },
    "EXCEPTION_HANDLER": "core.exceptions.api_exception_handler",
    "TEST_REQUEST_DEFAULT_FORMAT": "json",
}

# --- Outgoing e-mail (invitation delivery) ----------------------------------
# Production sends through Resend (RESEND_API_KEY). An SMTP relay (EMAIL_HOST)
# is the alternative. With neither, the share dialog falls back to the
# organizer's own mail app and the API refuses to pretend it sent anything.
# Credentials live only in the server environment.
RESEND_API_KEY = env("RESEND_API_KEY", "")
SMTP_HOST = env("EMAIL_HOST", "")
SMTP_OPTIONS = {
    "host": SMTP_HOST,
    "port": env_int("EMAIL_PORT", "587"),
    "username": env("EMAIL_HOST_USER", ""),
    "password": env("EMAIL_HOST_PASSWORD", ""),
    # Port 587 → STARTTLS (EMAIL_USE_TLS); port 465 → implicit TLS
    # (EMAIL_USE_SSL=true and EMAIL_USE_TLS=false). Never both.
    "use_tls": env_bool("EMAIL_USE_TLS", "true"),
    "use_ssl": env_bool("EMAIL_USE_SSL", "false"),
    "timeout": env_int("EMAIL_TIMEOUT", "15"),
}
# Django 6.1 mailer configuration (replaces the deprecated EMAIL_* settings).
MAILERS = {
    "default": {"BACKEND": "django.core.mail.backends.smtp.EmailBackend", "OPTIONS": SMTP_OPTIONS},
}
# Must be on a domain verified in Resend (SPF/DKIM) — malaikaevent.com.
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", "MalaikaEvents <info@malaikaevent.com>")
INVITATION_EMAIL_ENABLED = bool(RESEND_API_KEY or SMTP_HOST)

# Public brand site, shown in e-mail footers.
SITE_URL = env("SITE_URL", "https://www.malaikaevent.com").rstrip("/")

# Absolute origin of the guest-facing SPA, used to build the invitation link
# placed in outgoing messages (and encoded in QR codes client-side). Empty =
# derive it from the request host; production defaults to malaikaevent.com.
PUBLIC_APP_URL = env("PUBLIC_APP_URL", "").rstrip("/")

# --- Logging --------------------------------------------------------------
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "concise": {"format": "{levelname} {asctime} {name} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "concise"},
    },
    "root": {
        "handlers": ["console"],
        "level": env("DJANGO_LOG_LEVEL", "INFO"),
    },
}
