from django.urls import path

from events.views import EventModelCoverView, EventModelViewSet
from invitations.views import (
    InvitationBulkGenerateView,
    InvitationDetailView,
    InvitationDuplicateView,
    InvitationRevokeView,
    EventInvitationsView,
)
from templates_app.views import InvitationTemplateViewSet

from . import views

event_list = EventModelViewSet.as_view({"get": "list", "post": "create"})
event_detail = EventModelViewSet.as_view(
    {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
)

urlpatterns = [
    path("health/", views.health, name="health"),
    path("dashboard/overview/", views.DashboardOverviewView.as_view(), name="dashboard-overview"),
    # Template catalog (read-only, authenticated).
    path(
        "templates/",
        InvitationTemplateViewSet.as_view({"get": "list"}),
        name="template-list",
    ),
    path(
        "templates/<slug:key>/",
        InvitationTemplateViewSet.as_view({"get": "retrieve"}),
        name="template-detail",
    ),
    # Event invitation models (organizer-scoped CRUD).
    path("events/", event_list, name="event-list"),
    path("events/<int:pk>/", event_detail, name="event-detail"),
    path("events/<int:pk>/cover/", EventModelCoverView.as_view(), name="event-cover"),
    # Individual guest invitations (product brief Section 9).
    path(
        "events/<int:pk>/invitations/",
        EventInvitationsView.as_view(),
        name="event-invitations",
    ),
    path(
        "events/<int:pk>/invitations/bulk/",
        InvitationBulkGenerateView.as_view(),
        name="event-invitations-bulk",
    ),
    path("invitations/<int:pk>/", InvitationDetailView.as_view(), name="invitation-detail"),
    path("invitations/<int:pk>/revoke/", InvitationRevokeView.as_view(), name="invitation-revoke"),
    path(
        "invitations/<int:pk>/duplicate/",
        InvitationDuplicateView.as_view(),
        name="invitation-duplicate",
    ),
]
