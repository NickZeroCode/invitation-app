"""Seed the « Kasaï » template (1 template).

Additive catalog entry only — it creates/updates one `InvitationTemplate` row
and changes no schema. Keys must stay in sync with the React template registry
(`frontend/src/templates/registry.tsx`) — rendering is code, this data is
only catalog metadata + capabilities. Mirrors the pattern of
`0005_seed_moodboard_template.py`.
"""
from django.db import migrations

BASE_SECTIONS = ["guest", "title", "message", "date", "venue", "preferences", "qr", "footer"]

TEMPLATES = [
    {
        "key": "kasai",
        "name": "Kasaï",
        "category": "wedding",
        "description": (
            "Inspiré des tissus de raffia Kuba du Kasaï : frises entrelacées, "
            "losanges ocre et rouille sur papier tissé."
        ),
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
]


def seed_kasai_template(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    for entry in TEMPLATES:
        data = {k: v for k, v in entry.items() if k != "key"}
        InvitationTemplate.objects.update_or_create(key=entry["key"], defaults=data)


def remove_kasai_template(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    InvitationTemplate.objects.filter(key__in=[entry["key"] for entry in TEMPLATES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("templates_app", "0005_seed_moodboard_template"),
    ]

    operations = [
        migrations.RunPython(seed_kasai_template, remove_kasai_template),
    ]
