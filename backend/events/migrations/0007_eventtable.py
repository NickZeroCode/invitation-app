from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0006_eventmodel_note"),
    ]

    operations = [
        migrations.CreateModel(
            name="EventTable",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("number", models.CharField(max_length=32, verbose_name="numéro de table")),
                ("text", models.CharField(blank=True, default="", max_length=255, verbose_name="texte de table")),
                ("order", models.PositiveIntegerField(default=0, verbose_name="ordre")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="tables",
                        to="events.eventmodel",
                    ),
                ),
            ],
            options={
                "verbose_name": "table",
                "verbose_name_plural": "tables",
                "ordering": ("order", "id"),
            },
        ),
    ]
