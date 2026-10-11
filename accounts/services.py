from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.sessions.models import Session
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import AuditLog
from api.permissions import get_user_role

User = get_user_model()


def delete_user_sessions(user):
    """
    Terminates all active Django database sessions for a given user.
    """
    deleted_count = 0
    now = timezone.now()
    for session in Session.objects.filter(expire_date__gte=now):
        try:
            data = session.get_decoded()
            if str(data.get("_auth_user_id")) == str(user.id):
                session.delete()
                deleted_count += 1
        except Exception:
            pass
    return deleted_count


def count_active_admins(exclude_user_id=None):
    """
    Returns the count of active users who have the Admin role.
    """
    qs = User.objects.filter(is_active=True)
    if exclude_user_id:
        qs = qs.exclude(id=exclude_user_id)
    
    admin_group = Group.objects.filter(name="Admin").first()
    if admin_group:
        return qs.filter(groups=admin_group).count() + qs.filter(is_superuser=True).exclude(groups=admin_group).count()
    return qs.filter(is_superuser=True).count()


def change_user_role(actor, target_user, new_role):
    """
    Safely changes a user's role and writes to the AuditLog.
    Enforces:
    - Nobody can change their own role.
    - The last active Admin cannot be demoted.
    """
    if actor and actor.id == target_user.id:
        raise ValidationError("You cannot change your own role.")

    valid_roles = ["Admin", "Manager", "Cashier"]
    if new_role not in valid_roles:
        raise ValidationError(f"Invalid role '{new_role}'. Must be one of {valid_roles}.")

    old_role = get_user_role(target_user)
    if old_role == new_role:
        return target_user

    # Last active admin protection
    if old_role == "Admin" and target_user.is_active:
        if count_active_admins() <= 1:
            raise ValidationError("Cannot demote the last active Admin.")

    # Update groups
    role_groups = Group.objects.filter(name__in=valid_roles)
    target_user.groups.remove(*role_groups)

    new_group, _ = Group.objects.get_or_create(name=new_role)
    target_user.groups.add(new_group)

    if new_role == "Admin":
        target_user.is_staff = True
    else:
        target_user.is_superuser = False

    target_user.save()

    AuditLog.objects.create(
        actor=actor,
        target_user=target_user,
        action="ROLE_CHANGE",
        details=f"Changed role from {old_role} to {new_role}",
    )
    return target_user


def set_user_active(actor, target_user, is_active):
    """
    Activates or deactivates a user account.
    Enforces:
    - Nobody can deactivate their own account.
    - The last active Admin cannot be deactivated.
    - Deactivating a user deletes all their active sessions.
    """
    if actor and actor.id == target_user.id and not is_active:
        raise ValidationError("You cannot deactivate your own account.")

    current_role = get_user_role(target_user)
    if not is_active and target_user.is_active and current_role == "Admin":
        if count_active_admins() <= 1:
            raise ValidationError("Cannot deactivate the last active Admin.")

    target_user.is_active = is_active
    target_user.save(update_fields=["is_active"])

    if not is_active:
        delete_user_sessions(target_user)

    action = "DEACTIVATE" if not is_active else "ACTIVATE"
    AuditLog.objects.create(
        actor=actor,
        target_user=target_user,
        action=action,
        details=f"Account {'deactivated' if not is_active else 'activated'}",
    )
    return target_user
