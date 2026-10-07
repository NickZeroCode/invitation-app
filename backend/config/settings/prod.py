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

# --- Media storage --------------------------------------------------------
# Serverless filesystems are ephemeral: production REQUIRES S3-compatible
# object storage for cover images (AWS S3, Cloudflare R2, MinIO — all speak
# the S3 API). Fail fast instead of silently losing uploads (Section 18).
# Bucket name is required — the endpoint can hold several buckets (this Neon
# project ships "invitation-app"); a default would silently write elsewhere.
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME")
AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY")
# Custom endpoint for S3-compatible providers (R2, MinIO, Neon); empty for
# AWS S3. The boto3-native AWS_ENDPOINT_URL_S3 / AWS_REGION spellings used
# in vendor .env samples are accepted as fallbacks.
AWS_S3_ENDPOINT_URL = env("AWS_S3_ENDPOINT_URL", "") or env("AWS_ENDPOINT_URL_S3", "") or None
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", "") or env("AWS_REGION", "") or None
# S3-compatible endpoints serve a wildcard TLS cert for the bare host only —
# virtual-hosted-style URLs (bucket.host) fail certificate validation, so
# path-style is required ("virtual" only for real AWS S3).
AWS_S3_ADDRESSING_STYLE = env("AWS_S3_ADDRESSING_STYLE", "path")
# Private bucket: no canned ACL; URLs are short-lived signed links
# (mirrors generate_presigned_url(..., ExpiresIn=3600)).
AWS_DEFAULT_ACL = None
AWS_QUERYSTRING_AUTH = True
AWS_QUERYSTRING_EXPIRE = env_int("AWS_QUERYSTRING_EXPIRE", "3600")

STORAGES = {
    "default": {"BACKEND": "storages.backends.s3.S3Storage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
MEDIA_URL = "media/"
