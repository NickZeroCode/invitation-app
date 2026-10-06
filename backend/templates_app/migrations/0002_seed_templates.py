"""Seed the curated invitation template catalog (product brief Section 7).

Templates are product content. The `key` values must stay in sync with the
React template registry (`frontend/src/templates/registry.tsx`) — rendering
is code, this data is only catalog metadata + capabilities.
"""
from django.db import migrations

BASE_SECTIONS = ["guest", "title", "message", "date", "venue", "preferences", "qr", "footer"]

TEMPLATES = [
    {
        "key": "heritage-luxe",
        "name": "Héritage",
        "category": "wedding",
        "description": "Composition classique et centrée, typographie serif et filets dorés.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "jardin-floral",
        "name": "Jardin",
        "category": "anniversary",
        "description": "Décor floral délicat, tons poudrés et titrage romantique.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "ligne-moderne",
        "name": "Ligne moderne",
        "category": "corporate",
        "description": "Grille contemporaine, typographie serrée, aucune image superflue.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "message", "date", "venue"],
        },
    },
    {
        "key": "confetti",
        "name": "Confetti",
        "category": "birthday",
        "description": "Anniversaire festif, couleurs franches et titrage joyeux.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date"],
        },
    },
    {
        "key": "sceau-academique",
        "name": "Sceau académique",
        "category": "graduation",
        "description": "Remise de diplômes : marine et or, mise en page solennelle.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "soiree-formelle",
        "name": "Soirée",
        "category": "reception",
        "description": "Réception du soir : fond profond, titrage clair et élégant.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "memoire",
        "name": "Mémoire",
        "category": "memorial",
        "description": "Hommage sobre et lumineux, composition apaisée et discrète.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date"],
        },
    },
]


def seed_templates(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    for entry in TEMPLATES:
        data = {k: v for k, v in entry.items() if k != "key"}
        InvitationTemplate.objects.update_or_create(key=entry["key"], defaults=data)


def remove_templates(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    InvitationTemplate.objects.filter(key__in=[entry["key"] for entry in TEMPLATES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("templates_app", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_templates, remove_templates),
    ]
