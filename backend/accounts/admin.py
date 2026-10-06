"""Django admin: the ONLY channel for provisioning organizer accounts."""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import Organizer


class OrganizerCreationForm(UserCreationForm):
    class Meta:
        model = Organizer
        fields = ("email", "first_name", "last_name", "timezone")


class OrganizerChangeForm(UserChangeForm):
    class Meta:
        model = Organizer
        fields = "__all__"


@admin.register(Organizer)
class OrganizerAdmin(UserAdmin):
    form = OrganizerChangeForm
    add_form = OrganizerCreationForm

    list_display = ("email", "first_name", "last_name", "is_active", "is_staff", "date_joined")
    list_filter = ("is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations personnelles", {"fields": ("first_name", "last_name", "timezone")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "timezone",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                ),
            },
        ),
    )
    readonly_fields = ("last_login", "date_joined")
