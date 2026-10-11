from django.db import migrations


def create_roles_and_permissions(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    User = apps.get_model("auth", "User")

    # Define groups idempotently
    admin_group, _ = Group.objects.get_or_create(name="Admin")
    manager_group, _ = Group.objects.get_or_create(name="Manager")
    cashier_group, _ = Group.objects.get_or_create(name="Cashier")

    # Helper to get or create permission
    def get_or_create_perm(app_label, model_name, codename, name):
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
        except ContentType.DoesNotExist:
            ct = ContentType.objects.create(app_label=app_label, model=model_name)
        perm, _ = Permission.objects.get_or_create(
            content_type=ct, codename=codename, defaults={"name": name}
        )
        return perm

    # 1. Custom permissions under accounts.auditlog
    perm_manage_users = get_or_create_perm("accounts", "auditlog", "manage_users", "Can manage users and roles")
    perm_view_reports = get_or_create_perm("accounts", "auditlog", "view_reports", "Can view reports and analytics")
    perm_adjust_stock = get_or_create_perm("accounts", "auditlog", "adjust_stock", "Can adjust product stock levels")
    perm_view_all_sales = get_or_create_perm("accounts", "auditlog", "view_all_sales", "Can view all sales transactions")

    # 2. Standard Category model permissions
    p_add_cat = get_or_create_perm("inventory", "category", "add_category", "Can add category")
    p_change_cat = get_or_create_perm("inventory", "category", "change_category", "Can change category")
    p_delete_cat = get_or_create_perm("inventory", "category", "delete_category", "Can delete category")
    p_view_cat = get_or_create_perm("inventory", "category", "view_category", "Can view category")

    # 3. Standard Product model permissions
    p_add_prod = get_or_create_perm("inventory", "product", "add_product", "Can add product")
    p_change_prod = get_or_create_perm("inventory", "product", "change_product", "Can change product")
    p_delete_prod = get_or_create_perm("inventory", "product", "delete_product", "Can delete product")
    p_view_prod = get_or_create_perm("inventory", "product", "view_product", "Can view product")

    # 4. Standard Sale model permissions
    p_add_sale = get_or_create_perm("sales", "sale", "add_sale", "Can add sale")
    p_change_sale = get_or_create_perm("sales", "sale", "change_sale", "Can change sale")
    p_delete_sale = get_or_create_perm("sales", "sale", "delete_sale", "Can delete sale")
    p_view_sale = get_or_create_perm("sales", "sale", "view_sale", "Can view sale")

    # Assign to Admin:
    admin_perms = [
        perm_manage_users, perm_view_reports, perm_adjust_stock, perm_view_all_sales,
        p_add_cat, p_change_cat, p_delete_cat, p_view_cat,
        p_add_prod, p_change_prod, p_delete_prod, p_view_prod,
        p_add_sale, p_change_sale, p_delete_sale, p_view_sale,
    ]
    admin_group.permissions.set(admin_perms)

    # Assign to Manager:
    manager_perms = [
        perm_view_reports, perm_adjust_stock, perm_view_all_sales,
        p_add_cat, p_change_cat, p_delete_cat, p_view_cat,
        p_add_prod, p_change_prod, p_delete_prod, p_view_prod,
        p_add_sale, p_view_sale,
    ]
    manager_group.permissions.set(manager_perms)

    # Assign to Cashier:
    cashier_perms = [
        p_view_cat, p_view_prod, p_add_sale, p_view_sale,
    ]
    cashier_group.permissions.set(cashier_perms)

    # User Migration:
    # Existing superusers become Admin
    for u in User.objects.filter(is_superuser=True):
        u.groups.add(admin_group)

    # Other existing users become Manager
    for u in User.objects.filter(is_superuser=False):
        if not u.groups.exists():
            u.groups.add(manager_group)


def reverse_roles_and_permissions(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("inventory", "0001_initial"),
        ("sales", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_roles_and_permissions, reverse_roles_and_permissions),
    ]
