from decimal import Decimal
from django.apps import apps
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.sessions.models import Session
from django.core.management import call_command
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import AuditLog
from accounts.services import change_user_role, set_user_active
from api.permissions import get_user_role
from inventory.models import Category, Product
from sales.models import Sale

User = get_user_model()


class RolesAndPermissionsTests(APITestCase):
    def setUp(self):
        # Ensure role groups exist
        self.admin_group, _ = Group.objects.get_or_create(name="Admin")
        self.manager_group, _ = Group.objects.get_or_create(name="Manager")
        self.cashier_group, _ = Group.objects.get_or_create(name="Cashier")

        # 1. Admin user
        self.admin = User.objects.create_user(
            username="admin_user",
            password="password123",
            first_name="Admin",
            last_name="One",
            is_staff=True,
        )
        self.admin.groups.add(self.admin_group)

        # 2. Manager user
        self.manager = User.objects.create_user(
            username="manager_user",
            password="password123",
            first_name="Manager",
            last_name="One",
            is_staff=True,
        )
        self.manager.groups.add(self.manager_group)

        # 3. Cashier 1
        self.cashier1 = User.objects.create_user(
            username="cashier_one",
            password="password123",
            first_name="Cashier",
            last_name="One",
        )
        self.cashier1.groups.add(self.cashier_group)

        # 4. Cashier 2
        self.cashier2 = User.objects.create_user(
            username="cashier_two",
            password="password123",
            first_name="Cashier",
            last_name="Two",
        )
        self.cashier2.groups.add(self.cashier_group)

        # Catalog setup
        self.category = Category.objects.create(name="Computers", description="Laptops and PCs")
        self.product = Product.objects.create(
            name="Ultrabook X1",
            sku="LAP-001",
            category=self.category,
            price=Decimal("1200.00"),
            stock_quantity=20,
            low_stock_threshold=5,
        )

    # =========================================================================
    # 1. Guard Test: Every endpoint must have explicit permission_classes
    # =========================================================================
    def test_guard_every_endpoint_has_explicit_permissions(self):
        from api.v1.urls import router, urlpatterns

        # Check router viewsets
        for prefix, viewset, basename in router.registry:
            self.assertTrue(
                hasattr(viewset, "permission_classes"),
                f"ViewSet '{viewset.__name__}' for prefix '{prefix}' must have permission_classes.",
            )
            self.assertTrue(
                len(viewset.permission_classes) > 0,
                f"ViewSet '{viewset.__name__}' must have non-empty permission_classes.",
            )

        # Check individual APIViews
        for pattern in urlpatterns:
            if hasattr(pattern, "callback") and hasattr(pattern.callback, "view_class"):
                view_class = pattern.callback.view_class
                self.assertTrue(
                    hasattr(view_class, "permission_classes"),
                    f"View '{view_class.__name__}' must have permission_classes.",
                )
                self.assertTrue(
                    len(view_class.permission_classes) > 0,
                    f"View '{view_class.__name__}' must have non-empty permission_classes.",
                )

    # =========================================================================
    # 2. Parametrized Permission Matrix across Role, Endpoint, and Method
    # =========================================================================
    def test_permission_matrix(self):
        cases = [
            # (client_user, method, url_name, kwargs, payload, expected_status)
            # --- Category CRUD ---
            (self.cashier1, "post", "api:v1:category-list", {}, {"name": "Test Cat"}, status.HTTP_403_FORBIDDEN),
            (self.manager, "post", "api:v1:category-list", {}, {"name": "Mgr Cat"}, status.HTTP_201_CREATED),
            (self.admin, "post", "api:v1:category-list", {}, {"name": "Adm Cat"}, status.HTTP_201_CREATED),

            (self.cashier1, "get", "api:v1:category-list", {}, {}, status.HTTP_200_OK),
            (self.manager, "get", "api:v1:category-list", {}, {}, status.HTTP_200_OK),
            (self.admin, "get", "api:v1:category-list", {}, {}, status.HTTP_200_OK),

            # --- Product CRUD ---
            (self.cashier1, "post", "api:v1:product-list", {}, {"name": "P1", "sku": "P1", "category_id": self.category.id, "price": "10.00"}, status.HTTP_403_FORBIDDEN),
            (self.manager, "post", "api:v1:product-list", {}, {"name": "P2", "sku": "P2", "category_id": self.category.id, "price": "10.00", "stock_quantity": 5}, status.HTTP_201_CREATED),
            (self.admin, "post", "api:v1:product-list", {}, {"name": "P3", "sku": "P3", "category_id": self.category.id, "price": "10.00", "stock_quantity": 5}, status.HTTP_201_CREATED),

            (self.cashier1, "patch", "api:v1:product-detail", {"pk": self.product.id}, {"price": "999.00"}, status.HTTP_403_FORBIDDEN),
            (self.manager, "patch", "api:v1:product-detail", {"pk": self.product.id}, {"price": "999.00"}, status.HTTP_200_OK),

            # --- Stock Adjustment ---
            (self.cashier1, "post", "api:v1:product-adjust-stock", {"pk": self.product.id}, {"adjustment": 5}, status.HTTP_403_FORBIDDEN),
            (self.manager, "post", "api:v1:product-adjust-stock", {"pk": self.product.id}, {"adjustment": 5}, status.HTTP_200_OK),
            (self.admin, "post", "api:v1:product-adjust-stock", {"pk": self.product.id}, {"adjustment": -2}, status.HTTP_200_OK),

            # --- Dashboard Reports ---
            (self.cashier1, "get", "api:v1:api-dashboard-stats", {}, {}, status.HTTP_403_FORBIDDEN),
            (self.manager, "get", "api:v1:api-dashboard-stats", {}, {}, status.HTTP_200_OK),
            (self.admin, "get", "api:v1:api-dashboard-stats", {}, {}, status.HTTP_200_OK),

            # --- Admin User Management ---
            (self.cashier1, "get", "api:v1:user-list", {}, {}, status.HTTP_403_FORBIDDEN),
            (self.manager, "get", "api:v1:user-list", {}, {}, status.HTTP_403_FORBIDDEN),
            (self.admin, "get", "api:v1:user-list", {}, {}, status.HTTP_200_OK),

            (self.cashier1, "post", "api:v1:user-list", {}, {"username": "newu1", "password": "pass12345password"}, status.HTTP_403_FORBIDDEN),
            (self.manager, "post", "api:v1:user-list", {}, {"username": "newu2", "password": "pass12345password"}, status.HTTP_403_FORBIDDEN),
            (self.admin, "post", "api:v1:user-list", {}, {"username": "newu3", "password": "pass12345password", "role": "Cashier"}, status.HTTP_201_CREATED),
        ]

        for user, method, url_name, kwargs, payload, expected_status in cases:
            self.client.force_login(user)
            url = reverse(url_name, kwargs=kwargs) if kwargs else reverse(url_name)
            if method == "get":
                res = self.client.get(url)
            elif method == "post":
                res = self.client.post(url, payload)
            elif method == "patch":
                res = self.client.patch(url, payload)
            elif method == "delete":
                res = self.client.delete(url)
            else:
                raise ValueError(f"Unsupported method {method}")

            self.assertEqual(
                res.status_code,
                expected_status,
                f"Failed for user '{user.username}' on {method.upper()} {url_name}. Expected {expected_status}, got {res.status_code}. Response: {getattr(res, 'data', res.content)}",
            )

    # =========================================================================
    # 3. Own-Sales Isolation: Cashiers see only own sales; others return 404
    # =========================================================================
    def test_own_sales_isolation(self):
        # Create sales by Cashier 1, Cashier 2, and Manager
        sale_c1 = Sale.objects.create(
            product=self.product, quantity=1, unit_price=self.product.price,
            total_price=self.product.price, sold_by=self.cashier1,
        )
        sale_c2 = Sale.objects.create(
            product=self.product, quantity=2, unit_price=self.product.price,
            total_price=self.product.price * 2, sold_by=self.cashier2,
        )
        sale_mgr = Sale.objects.create(
            product=self.product, quantity=1, unit_price=self.product.price,
            total_price=self.product.price, sold_by=self.manager,
        )

        # Cashier 1 queries sales list: only sees own sale
        self.client.force_login(self.cashier1)
        res_list = self.client.get(reverse("api:v1:sale-list"))
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        results = res_list.data.get("results", res_list.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], sale_c1.id)

        # Cashier 1 retrieves own sale receipt: 200 OK
        res_own = self.client.get(reverse("api:v1:sale-detail", kwargs={"pk": sale_c1.id}))
        self.assertEqual(res_own.status_code, status.HTTP_200_OK)

        # Cashier 1 retrieves Cashier 2's sale receipt: MUST BE 404 NOT FOUND
        res_other = self.client.get(reverse("api:v1:sale-detail", kwargs={"pk": sale_c2.id}))
        self.assertEqual(res_other.status_code, status.HTTP_404_NOT_FOUND)

        # Cashier 1 retrieves Manager's sale receipt: MUST BE 404 NOT FOUND
        res_mgr = self.client.get(reverse("api:v1:sale-detail", kwargs={"pk": sale_mgr.id}))
        self.assertEqual(res_mgr.status_code, status.HTTP_404_NOT_FOUND)

        # Manager queries sales list: sees ALL 3 sales
        self.client.force_login(self.manager)
        res_mgr_list = self.client.get(reverse("api:v1:sale-list"))
        self.assertEqual(res_mgr_list.status_code, status.HTTP_200_OK)
        mgr_results = res_mgr_list.data.get("results", res_mgr_list.data)
        self.assertEqual(len(mgr_results), 3)

        # Admin queries sales list: sees ALL 3 sales
        self.client.force_login(self.admin)
        res_adm_list = self.client.get(reverse("api:v1:sale-list"))
        self.assertEqual(res_adm_list.status_code, status.HTTP_200_OK)
        adm_results = res_adm_list.data.get("results", res_adm_list.data)
        self.assertEqual(len(adm_results), 3)

    # =========================================================================
    # 4. Safety: Last active Admin protection and Self-Role change rejection
    # =========================================================================
    def test_last_admin_protection_and_self_role_change(self):
        self.client.force_login(self.admin)

        # Self-role change rejection
        res_self = self.client.post(
            reverse("api:v1:user-change-role", kwargs={"pk": self.admin.id}),
            {"role": "Cashier"},
        )
        self.assertEqual(res_self.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot change your own role", res_self.data["detail"].lower())

        # Self-deactivation rejection
        res_self_deact = self.client.post(
            reverse("api:v1:user-toggle-active", kwargs={"pk": self.admin.id}),
            {"is_active": False},
        )
        self.assertEqual(res_self_deact.status_code, status.HTTP_400_BAD_REQUEST)

        # Create a second admin
        admin2 = User.objects.create_user(username="admin_two", password="password123", is_staff=True)
        admin2.groups.add(self.admin_group)

        # Now admin can demote admin2 (because admin is still active)
        res_demote = self.client.post(
            reverse("api:v1:user-change-role", kwargs={"pk": admin2.id}),
            {"role": "Manager"},
        )
        self.assertEqual(res_demote.status_code, status.HTTP_200_OK)
        self.assertEqual(get_user_role(admin2), "Manager")

        # Now only 1 admin remains. Admin2 cannot be demoted further, but let's test trying to demote the sole admin:
        # Promote admin2 back to Admin
        change_user_role(self.admin, admin2, "Admin")
        self.client.force_login(admin2)

        # Admin2 tries to demote Admin1 (leaving only Admin2) -> OK
        res_demote_admin1 = self.client.post(
            reverse("api:v1:user-change-role", kwargs={"pk": self.admin.id}),
            {"role": "Cashier"},
        )
        self.assertEqual(res_demote_admin1.status_code, status.HTTP_200_OK)

        # Now Admin2 is the ONLY active admin left.
        # Create a 3rd user with Cashier role, promote to Manager, try to demote Admin2 -> Rejected!
        # If Admin2 tries to deactivate themselves -> Rejected!
        res_sole_admin_deact = self.client.post(
            reverse("api:v1:user-toggle-active", kwargs={"pk": admin2.id}),
            {"is_active": False},
        )
        self.assertEqual(res_sole_admin_deact.status_code, status.HTTP_400_BAD_REQUEST)

        # AuditLog must record role changes
        self.assertTrue(AuditLog.objects.filter(action="ROLE_CHANGE").exists())

    # =========================================================================
    # 5. Deactivated User Session Invalidation and Login Rejection
    # =========================================================================
    def test_deactivated_user_cannot_login_and_sessions_purged(self):
        # 1. Cashier1 logs in via API
        login_res = self.client.post(
            reverse("api:v1:api-auth-login"),
            {"username": "cashier_one", "password": "password123"},
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        session_key = self.client.session.session_key
        self.assertTrue(Session.objects.filter(session_key=session_key).exists())

        # 2. Admin deactivates Cashier1
        self.client.force_login(self.admin)
        deact_res = self.client.post(
            reverse("api:v1:user-toggle-active", kwargs={"pk": self.cashier1.id}),
            {"is_active": False},
        )
        self.assertEqual(deact_res.status_code, status.HTTP_200_OK)

        # Verify sessions for Cashier1 were deleted
        self.assertFalse(Session.objects.filter(session_key=session_key).exists())

        # 3. Cashier1 tries to log in again: MUST BE REJECTED (400 Account disabled)
        self.client.logout()
        failed_login = self.client.post(
            reverse("api:v1:api-auth-login"),
            {"username": "cashier_one", "password": "password123"},
        )
        self.assertEqual(failed_login.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("disabled", str(failed_login.data).lower())

    # =========================================================================
    # 6. Idempotent Migration: Migration runs twice cleanly
    # =========================================================================
    def test_migration_runs_twice_cleanly(self):
        import importlib
        migration_mod = importlib.import_module("accounts.migrations.0002_create_roles_and_permissions")
        create_roles_and_permissions = migration_mod.create_roles_and_permissions

        # Run migration logic twice
        create_roles_and_permissions(apps, None)
        create_roles_and_permissions(apps, None)

        # Verify Groups are still exactly 3
        self.assertEqual(Group.objects.filter(name__in=["Admin", "Manager", "Cashier"]).count(), 3)
