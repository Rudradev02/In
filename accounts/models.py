from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("ROLE_CHANGE", "Role Change"),
        ("DEACTIVATE", "Deactivate User"),
        ("ACTIVATE", "Activate User"),
        ("CREATE_USER", "Create User"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_actions",
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        permissions = [
            ("manage_users", "Can manage users and roles"),
            ("view_reports", "Can view reports and analytics"),
            ("adjust_stock", "Can adjust product stock levels"),
            ("view_all_sales", "Can view all sales transactions"),
        ]

    def __str__(self):
        actor_name = self.actor.username if self.actor else "System"
        target_name = self.target_user.username if self.target_user else "N/A"
        return f"[{self.action}] by {actor_name} on {target_name} at {self.created_at}"
