"""Refresh the catalog descriptions of the three redesigned templates.

Data only — the « Confetti », « Jardin » and « Mémoire » designs were redrawn
in the React registry (same keys, same capabilities), so their gallery
descriptions are updated to describe what organizers will actually get.
Reversible: the previous wording is restored on rollback.
"""
from django.db import migrations

DESCRIPTIONS = {
    "confetti": (
        "Anniversaire festif, couleurs franches et titrage joyeux.",
        "Impression riso deux tons : l’âge en grand chiffre, confettis de papier et date sur ticket perforé.",
    ),
    "jardin-floral": (
        "Décor floral délicat, tons poudrés et titrage romantique.",
        "Planche botanique : couronne de laurier et boutons de rose à l’encre fine, les années au cœur.",
    ),
    "memoire": (
        "Hommage sobre et lumineux, composition apaisée et discrète.",
        "Hommage sobre : un arum gravé, une serif apaisée et de grandes marges.",
    ),
}


def apply_new(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    for key, (_old, new) in DESCRIPTIONS.items():
        InvitationTemplate.objects.filter(key=key).update(description=new)


def restore_old(apps, schema_editor):
    InvitationTemplate = apps.get_model("templates_app", "InvitationTemplate")
    for key, (old, _new) in DESCRIPTIONS.items():
        InvitationTemplate.objects.filter(key=key).update(description=old)


class Migration(migrations.Migration):
    dependencies = [
        ("templates_app", "0006_seed_kasai_template"),
    ]

    operations = [
        migrations.RunPython(apply_new, restore_old),
    ]
