"""Root URL configuration.

The Django admin at ``/admin/`` is the ONLY provisioning channel for organizer
accounts (created manually by the super administrator). It is intentionally not
exposed or linked anywhere in the React application.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("core.urls")),
]
