"""Authentication endpoints (session-based, CSRF-protected)."""
from __future__ import annotations

from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.db import IntegrityError
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from core.authentication import SessionCookieAuthentication

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    OrganizerSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
)

GENERIC_LOGIN_ERROR = "Identifiants invalides."


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CSRFView(APIView):
    """Sets the CSRF cookie the SPA reads to send ``X-CSRFToken``."""

    authentication_classes: list = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class LoginView(APIView):
    """Authenticate an organizer with email + password."""

    # Session auth (CSRF enforced even for anonymous requests — see
    # core.authentication) on a publicly reachable endpoint.
    authentication_classes = [SessionCookieAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            # Generic message: never reveal whether the email exists.
            raise AuthenticationFailed(GENERIC_LOGIN_ERROR)
        login(request, user)
        return Response(OrganizerSerializer(user).data)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class RegisterView(APIView):
    """Create a new organizer account and sign it in (public sign up)."""

    # Same hardening as LoginView: session auth with CSRF enforced and a
    # scoped throttle on a publicly reachable endpoint.
    authentication_classes = [SessionCookieAuthentication]
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
        except IntegrityError:
            # Concurrent double sign up slipped past the uniqueness check.
            raise ValidationError({"email": ["Un compte existe déjà avec cette adresse e-mail."]})
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return Response(OrganizerSerializer(user).data, status=status.HTTP_201_CREATED)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """Current organizer profile (read / partial update)."""

    def get(self, request):
        return Response(OrganizerSerializer(request.user).data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OrganizerSerializer(request.user).data)


class ChangePasswordView(APIView):
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if not user.check_password(serializer.validated_data["current_password"]):
            raise ValidationError({"current_password": ["Mot de passe actuel incorrect."]})
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])
        # Keep the session valid after the password change.
        update_session_auth_hash(request, user)
        return Response(status=status.HTTP_204_NO_CONTENT)
