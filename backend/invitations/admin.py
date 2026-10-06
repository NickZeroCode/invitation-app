from django.contrib import admin

from .models import Invitation


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    list_display = ("guest_name", "event_model", "state", "issued_at", "expires_at")
    list_filter = ("state", "civility")
    search_fields = ("guest_name", "token", "event_model__title")
    readonly_fields = ("token", "issued_at", "created_at", "updated_at")
    date_hierarchy = "issued_at"
