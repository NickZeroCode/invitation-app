from django.contrib import admin

from .models import EventModel


@admin.register(EventModel)
class EventModelAdmin(admin.ModelAdmin):
    list_display = ("title", "organizer", "event_date", "event_time", "template", "is_active")
    list_filter = ("is_active", "template__category")
    search_fields = ("title", "venue_name", "organizer__email")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "event_date"
