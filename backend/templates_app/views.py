"""Read-only API for the curated invitation template catalog.

Templates are provisioned by administrators (Django admin / migrations); the
organizer workspace only reads them. Rendering lives in the React template
registry — `config` is never executed (product brief Section 7).
"""
from __future__ import annotations

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from templates_app.models import InvitationTemplate
from templates_app.serializers import InvitationTemplateSerializer


class InvitationTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = InvitationTemplateSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "key"
    pagination_class = None  # curated catalog: bounded set, no pagination

    def get_queryset(self):
        return InvitationTemplate.objects.filter(is_active=True).order_by("category", "name")
