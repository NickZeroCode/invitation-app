"""Vercel entry point: exposes the Django WSGI application.

The backend Vercel project uses ``backend/`` as its root directory. This file
must be validated against the live Vercel Python runtime before production
use — see docs/deployment.md ("verify before trusting").
"""
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

from django.core.wsgi import get_wsgi_application  # noqa: E402

app = get_wsgi_application()
