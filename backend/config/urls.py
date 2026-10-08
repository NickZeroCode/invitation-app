"""Root URL configuration.

The Django admin at ``/admin/`` is the ONLY provisioning channel for organizer
accounts (created manually by the super administrator). It is intentionally not
exposed or linked anywhere in the React application.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("core.urls")),
]

# Development only: serve uploaded media from MEDIA_ROOT. ``static()`` is a
# no-op when DEBUG is False, and production media lives on S3 anyway.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
