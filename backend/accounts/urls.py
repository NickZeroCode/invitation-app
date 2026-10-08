from django.urls import path

from . import views

app_name = "auth"

urlpatterns = [
    path("csrf/", views.CSRFView.as_view(), name="csrf"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("password/", views.ChangePasswordView.as_view(), name="password"),
]
