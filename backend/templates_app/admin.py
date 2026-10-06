from django.contrib import admin

from .models import InvitationTemplate


@admin.register(InvitationTemplate)
class InvitationTemplateAdmin(admin.ModelAdmin):
    list_display = ("key", "name", "category", "version", "is_active", "updated_at")
    list_filter = ("category", "is_active")
    search_fields = ("key", "name")
    readonly_fields = ("created_at", "updated_at")
