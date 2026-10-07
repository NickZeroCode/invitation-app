"""Seed the premium wedding template collection.

Keys must stay in sync with the React template registry
(`frontend/src/templates/registry.tsx`) — rendering is code, this data is
only catalog metadata + capabilities. Mirrors the pattern of
`0002_seed_templates.py`.
"""
from django.db import migrations

BASE_SECTIONS = ["guest", "title", "message", "date", "venue", "preferences", "qr", "footer"]

TEMPLATES = [
    {
        "key": "eternite-or",
        "name": "Éternité",
        "category": "wedding",
        "description": "Art déco noir et or : cadre doré, éventails géométriques et titrage champagne.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "jardin-olive",
        "name": "Jardin d’Olive",
        "category": "wedding",
        "description": "Botanique d’art : branches d’olivier dessinées à la main et photo en arche.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "arche-soleil",
        "name": "Arche Soleil",
        "category": "wedding",
        "description": "Bohème chic terracotta : grande arche, soleil levant et vagues dessinées.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "nuit-celeste",
        "name": "Nuit Céleste",
        "category": "wedding",
        "description": "Minuit étoilé : éclats d’or, croissant de lune et cadre céleste.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
]


def seed_wedding_templates(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    for entry in TEMPLATES:
        data = {k: v for k, v in entry.items() if k != "key"}
        InvitationTemplate.objects.update_or_create(key=entry["key"], defaults=data)


def remove_wedding_templates(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    InvitationTemplate.objects.filter(key__in=[entry["key"] for entry in TEMPLATES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("templates_app", "0002_seed_templates"),
    ]

    operations = [
        migrations.RunPython(seed_wedding_templates, remove_wedding_templates),
    ]
