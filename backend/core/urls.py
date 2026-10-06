from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("dashboard/overview/", views.DashboardOverviewView.as_view(), name="dashboard-overview"),
]
