"""Organizer accounts.

Accounts are created manually by the super administrator through the Django
admin (product brief Section 6). There is no public self-registration.
"""
from __future__ import annotations

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.timezone import now as timezone_now


class OrganizerManager(BaseUserManager):
    """Email-based manager for organizers."""

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("L'adresse e-mail est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True or extra_fields.get("is_superuser") is not True:
            raise ValueError("Le superutilisateur doit avoir is_staff=True et is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class Organizer(AbstractBaseUser, PermissionsMixin):
    """An organizer account: owns events, invitations and guest responses."""

    email = models.EmailField("adresse e-mail", unique=True, db_index=True)
    first_name = models.CharField("prénom", max_length=150, blank=True)
    last_name = models.CharField("nom", max_length=150, blank=True)
    timezone = models.CharField("fuseau horaire", max_length=64, default="Africa/Kinshasa")
    is_active = models.BooleanField("compte actif", default=True)
    is_staff = models.BooleanField("accès administration", default=False)
    date_joined = models.DateTimeField("inscrit le", default=timezone_now, editable=False)

    objects = OrganizerManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = "organisateur"
        verbose_name_plural = "organisateurs"
        ordering = ("email",)

    def __str__(self) -> str:
        return self.email

    @property
    def full_name(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        return name or self.email
