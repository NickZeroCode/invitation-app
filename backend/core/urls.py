from django.urls import path

from events.views import (
    EventDressCodeItemView,
    EventDressCodeView,
    EventModelCoverView,
    EventModelViewSet,
)
from invitations.public import (
    PublicConfirmPresenceView,
    PublicInvitationView,
    PublicVerificationView,
)
from invitations.verification import (
    EventVerificationLinksView,
    EventVerificationScanView,
    PublicVerificationAuthorizeView,
    PublicVerificationLinkView,
    PublicVerificationScanView,
    VerificationLinkRevokeView,
)
from invitations.views import (
    InvitationBulkGenerateView,
    InvitationDetailView,
    InvitationDuplicateView,
    InvitationRevokeView,
    EventInvitationsView,
)
from preferences.views import EventResponsesView, GuestResponseSubmitView
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
    # Dress-code gallery (one image per upload, with caption + ordering).
    path("events/<int:pk>/dress-code/", EventDressCodeView.as_view(), name="event-dress-code"),
    path(
        "events/<int:pk>/dress-code/<int:item_pk>/",
        EventDressCodeItemView.as_view(),
        name="event-dress-code-item",
    ),
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
    # Guest responses for one event (organizer reporting, Section 13).
    path("events/<int:pk>/responses/", EventResponsesView.as_view(), name="event-responses"),
    # Public, token-scoped endpoints (Sections 10–11, 13).
    path(
        "public/invitations/<str:token>/",
        PublicInvitationView.as_view(),
        name="public-invitation",
    ),
    path(
        "public/invitations/<str:token>/verify/",
        PublicVerificationView.as_view(),
        name="public-invitation-verify",
    ),
    path(
        "public/invitations/<str:token>/response/",
        GuestResponseSubmitView.as_view(),
        name="public-invitation-response",
    ),
    # Guest presence confirmation (one-way, token-scoped).
    path(
        "public/invitations/<str:token>/confirm-presence/",
        PublicConfirmPresenceView.as_view(),
        name="public-invitation-confirm-presence",
    ),
    # QR-authenticity verification: delegated links + door-side verdicts.
    path(
        "events/<int:pk>/verification-links/",
        EventVerificationLinksView.as_view(),
        name="event-verification-links",
    ),
    path(
        "events/<int:pk>/verification-scan/",
        EventVerificationScanView.as_view(),
        name="event-verification-scan",
    ),
    path(
        "verification-links/<int:pk>/revoke/",
        VerificationLinkRevokeView.as_view(),
        name="verification-link-revoke",
    ),
    path(
        "public/verify-links/<str:token>/",
        PublicVerificationLinkView.as_view(),
        name="public-verification-link",
    ),
    path(
        "public/verify-links/<str:token>/authorize/",
        PublicVerificationAuthorizeView.as_view(),
        name="public-verification-authorize",
    ),
    path(
        "public/verify-links/<str:token>/scan/",
        PublicVerificationScanView.as_view(),
        name="public-verification-scan",
    ),
]
