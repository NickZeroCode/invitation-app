from django.contrib import admin

from .models import GuestResponse, GuestResponseAnswer, PreferenceOption, PreferenceQuestion


class PreferenceOptionInline(admin.TabularInline):
    model = PreferenceOption
    extra = 1


@admin.register(PreferenceQuestion)
class PreferenceQuestionAdmin(admin.ModelAdmin):
    list_display = ("label", "event_model", "input_type", "required", "order", "is_active")
    list_filter = ("input_type", "required", "is_active")
    search_fields = ("label", "event_model__title")
    inlines = [PreferenceOptionInline]


class GuestResponseAnswerInline(admin.TabularInline):
    model = GuestResponseAnswer
    extra = 0
    autocomplete_fields = ("question",)
    filter_horizontal = ("options",)


@admin.register(GuestResponse)
class GuestResponseAdmin(admin.ModelAdmin):
    list_display = ("invitation", "submitted_at", "updated_at")
    search_fields = ("invitation__guest_name", "invitation__token")
    readonly_fields = ("invitation", "submitted_at", "updated_at")
    inlines = [GuestResponseAnswerInline]
