from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0007_eventtable"),
        ("invitations", "0003_invitation_presence_confirmed_at_verificationlink"),
    ]

    operations = [
        migrations.AddField(
            model_name="invitation",
            name="table",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="invitations",
                to="events.eventtable",
                verbose_name="table",
            ),
        ),
    ]
