"""Seed the reference-illustration template collection (10 templates).

Keys must stay in sync with the React template registry
(`frontend/src/templates/registry.tsx`) — rendering is code, this data is
only catalog metadata + capabilities. Mirrors the pattern of
`0003_seed_wedding_templates.py`.
"""
from django.db import migrations

BASE_SECTIONS = ["guest", "title", "message", "date", "venue", "preferences", "qr", "footer"]

TEMPLATES = [
    {
        "key": "floraison",
        "name": "Floraison",
        "category": "wedding",
        "description": "Papier ivoire, double cadre doré à coins ajourés et bouquets aquarelle aux quatre coins.",
        "config": {
            "supports_cover": True,
            "sections": ["cover", *BASE_SECTIONS],
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "arche-pivoine",
        "name": "Arche Pivoine",
        "category": "wedding",
        "description": "Double arche dorée ouverte en bas, pivoines bleues aux coins et jour en cœur.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "brume-bleue",
        "name": "Brume Bleue",
        "category": "wedding",
        "description": "Eucalyptus aquarelle bleu poussière, prénoms calligraphiés sur une ligne et date à trois volets.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "ruban-dor",
        "name": "Ruban d’Or",
        "category": "other",
        "description": "Rubans d’or ondulés sur papier crème, grand mot calligraphié et compositions bleues.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "hexagone",
        "name": "Hexagone",
        "category": "wedding",
        "description": "Hexagone d’or ouvert aux intersections fleuries, roses taupe aux quatre coins.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "roses-dor",
        "name": "Roses d’Or",
        "category": "wedding",
        "description": "Roses gravées dorées, prénoms en dégradé d’or devant un grand chevalier fantôme.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "mandala",
        "name": "Mandala",
        "category": "other",
        "description": "Rouge damassé, guirlande dorée suspendue, rosaces dorées et berceau cérémoniel.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "lilas",
        "name": "Lilas",
        "category": "birthday",
        "description": "Couronnes de clématites violettes, grand prénom calligraphié et long ruban plumé.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "romance",
        "name": "Romance",
        "category": "wedding",
        "description": "Aquarelles bleues, illustration de couple naïve et prénoms empilés autour du esperluette dorée.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
    {
        "key": "grenat",
        "name": "Grenat",
        "category": "wedding",
        "description": "Dégradé blush, roses grenat aux coins supérieurs et pétales de lotus dorés en pied.",
        "config": {
            "supports_cover": False,
            "sections": BASE_SECTIONS,
            "emphasis_fields": ["title", "date", "venue"],
        },
    },
]


def seed_reference_templates(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    for entry in TEMPLATES:
        data = {k: v for k, v in entry.items() if k != "key"}
        InvitationTemplate.objects.update_or_create(key=entry["key"], defaults=data)


def remove_reference_templates(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    InvitationTemplate.objects.filter(key__in=[entry["key"] for entry in TEMPLATES]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("templates_app", "0003_seed_wedding_templates"),
    ]

    operations = [
        migrations.RunPython(seed_reference_templates, remove_reference_templates),
    ]
