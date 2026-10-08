"""Serializers for organizer accounts and authentication."""
from __future__ import annotations

from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Organizer


class OrganizerSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Organizer
        fields = ("id", "email", "first_name", "last_name", "full_name", "timezone", "date_joined")
        read_only_fields = ("id", "email", "date_joined")


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organizer
        fields = ("first_name", "last_name", "timezone")

    def validate_timezone(self, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise serializers.ValidationError("Fuseau horaire invalide.")
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class RegisterSerializer(serializers.Serializer):
    """Public self-registration for a new organizer account."""

    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        if Organizer.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cette adresse e-mail.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Les mots de passe ne correspondent pas."}
            )
        return attrs

    def create(self, validated_data):
        return Organizer.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
        )


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Les mots de passe ne correspondent pas."}
            )
        return attrs
