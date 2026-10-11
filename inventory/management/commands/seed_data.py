from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

from inventory.models import Category, Product
from sales.models import Sale


class Command(BaseCommand):
    help = "Create demo categories, products, sales, and role-based demo users (Admin, Manager, Cashier)."

    def handle(self, *args, **options):
        User = get_user_model()
        
        # Ensure role groups exist
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        manager_group, _ = Group.objects.get_or_create(name="Manager")
        cashier_group, _ = Group.objects.get_or_create(name="Cashier")
        
        group_map = {
            "Admin": admin_group,
            "Manager": manager_group,
            "Cashier": cashier_group,
        }

        # 1. Create one demo user per role
        demo_users_spec = [
            ("admin", "admin12345", "System", "Administrator", "Admin", True, "admin@invlab.local"),
            ("manager", "manager12345", "Store", "Manager", "Manager", True, "manager@invlab.local"),
            ("cashier", "cashier12345", "Frontdesk", "Cashier", "Cashier", False, "cashier@invlab.local"),
        ]
        created_users = {}
        for username, password, fname, lname, role_name, is_staff, email in demo_users_spec:
            user, created = User.objects.get_or_create(username=username, defaults={"email": email})
            user.set_password(password)
            user.first_name = fname
            user.last_name = lname
            user.is_staff = is_staff
            user.is_active = True
            user.save()
            user.groups.clear()
            user.groups.add(group_map[role_name])
            created_users[username] = user

        # Legacy fallback
        demo_user = created_users["manager"]

        category_data = [
            ("Electronics", "Devices and everyday tech accessories."),
            ("Office", "Tools for productive workspaces."),
            ("Home & Living", "Useful products for modern homes."),
            ("Outdoor", "Gear for active days outside."),
        ]
        categories = {}
        for name, description in category_data:
            categories[name], _ = Category.objects.get_or_create(name=name, defaults={"description": description})

        products = [
            ("Wireless Headphones", "ELEC-001", "Electronics", Decimal("89.99"), 18, 5),
            ("Mechanical Keyboard", "ELEC-002", "Electronics", Decimal("119.00"), 7, 4),
            ("USB-C Hub", "ELEC-003", "Electronics", Decimal("42.50"), 3, 5),
            ("Desk Organizer", "OFF-001", "Office", Decimal("24.00"), 28, 8),
            ("Notebook Set", "OFF-002", "Office", Decimal("16.50"), 42, 10),
            ("Ergonomic Desk Lamp", "HOME-001", "Home & Living", Decimal("64.00"), 5, 5),
            ("Insulated Bottle", "OUT-001", "Outdoor", Decimal("31.95"), 21, 6),
            ("Travel Backpack", "OUT-002", "Outdoor", Decimal("78.00"), 2, 4),
        ]
        for name, sku, category, price, stock, threshold in products:
            Product.objects.update_or_create(
                sku=sku,
                defaults={
                    "name": name, "category": categories[category], "price": price,
                    "stock_quantity": stock, "low_stock_threshold": threshold,
                    "description": f"{name} from the {category.lower()} collection.",
                },
            )

        if not Sale.objects.exists():
            for sku, quantity in [("ELEC-001", 2), ("OFF-001", 3), ("OUT-001", 1), ("ELEC-002", 1)]:
                product = Product.objects.get(sku=sku)
                Sale.objects.create(
                    product=product, quantity=quantity, unit_price=product.price,
                    total_price=product.price * quantity, sold_by=demo_user,
                )
                product.stock_quantity = max(0, product.stock_quantity - quantity)
                product.save(update_fields=["stock_quantity", "updated_at"])

        self.stdout.write(self.style.SUCCESS("Demo data ready. Demo accounts: admin / admin12345 (Admin), manager / manager12345 (Manager), cashier / cashier12345 (Cashier)"))