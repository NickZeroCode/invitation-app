from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0005_eventmodel_cover_title"),
    ]

    operations = [
        migrations.AddField(
            model_name="eventmodel",
            name="note",
            field=models.TextField(blank=True, default="", verbose_name="note"),
        ),
    ]
