from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from inventory.models import Category, Product
from sales.models import Sale

User = get_user_model()


class APITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="testpassword123",
            first_name="Test",
            last_name="User",
        )
        self.category = Category.objects.create(
            name="Hardware",
            description="Computer parts and accessories",
        )
        self.product = Product.objects.create(
            name="Mechanical Keyboard",
            sku="KB-001",
            category=self.category,
            price=Decimal("100.00"),
            stock_quantity=10,
            low_stock_threshold=3,
            description="RGB mechanical keyboard",
        )

    # ---------------- Auth Tests ---------------- #
    def test_login_success(self):
        url = reverse("api:v1:api-auth-login")
        response = self.client.post(url, {"username": "testuser", "password": "testpassword123"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser")
        self.assertIn("_auth_user_id", self.client.session)

    def test_login_failure(self):
        url = reverse("api:v1:api-auth-login")
        response = self.client.post(url, {"username": "testuser", "password": "wrongpassword"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_current_user_authenticated(self):
        self.client.force_login(self.user)
        url = reverse("api:v1:api-auth-me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "testuser")

    def test_get_current_user_unauthenticated(self):
        url = reverse("api:v1:api-auth-me")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout(self):
        self.client.force_login(self.user)
        url = reverse("api:v1:api-auth-logout")
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("_auth_user_id", self.client.session)

    # ---------------- Category Tests ---------------- #
    def test_category_crud_and_protection(self):
        self.client.force_login(self.user)

        # Create
        url = reverse("api:v1:category-list")
        res = self.client.post(url, {"name": "Office Supplies", "description": "Stationery"})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        new_cat_id = res.data["id"]

        # Delete with products protection
        del_protected_url = reverse("api:v1:category-detail", kwargs={"pk": self.category.id})
        res_del = self.client.delete(del_protected_url)
        self.assertEqual(res_del.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Category.objects.filter(pk=self.category.id).exists())

        # Delete empty category
        del_empty_url = reverse("api:v1:category-detail", kwargs={"pk": new_cat_id})
        res_del_ok = self.client.delete(del_empty_url)
        self.assertEqual(res_del_ok.status_code, status.HTTP_204_NO_CONTENT)

    # ---------------- Product Tests ---------------- #
    def test_product_crud_and_validation(self):
        self.client.force_login(self.user)

        # Create product
        url = reverse("api:v1:product-list")
        payload = {
            "name": "Wireless Mouse",
            "sku": "MS-001",
            "category_id": self.category.id,
            "price": "45.00",
            "stock_quantity": 15,
            "low_stock_threshold": 4,
            "description": "Ergonomic wireless mouse",
        }
        res = self.client.post(url, payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        created_id = res.data["id"]

        # Duplicate SKU rejection
        res_dup = self.client.post(url, payload)
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)

        # Detail
        detail_url = reverse("api:v1:product-detail", kwargs={"pk": created_id})
        res_detail = self.client.get(detail_url)
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data["name"], "Wireless Mouse")

        # Update
        res_patch = self.client.patch(detail_url, {"price": "49.99"})
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(Product.objects.get(pk=created_id).price, Decimal("49.99"))

    # ---------------- Stock Adjustment Tests ---------------- #
    def test_stock_adjustment(self):
        self.client.force_login(self.user)
        adjust_url = reverse("api:v1:product-adjust-stock", kwargs={"pk": self.product.id})

        # Add 5 units
        res_add = self.client.post(adjust_url, {"adjustment": 5, "reason": "Restocked"})
        self.assertEqual(res_add.status_code, status.HTTP_200_OK)
        self.assertEqual(res_add.data["stock_quantity"], 15)

        # Deduct 8 units
        res_sub = self.client.post(adjust_url, {"adjustment": -8, "reason": "Inventory count"})
        self.assertEqual(res_sub.status_code, status.HTTP_200_OK)
        self.assertEqual(res_sub.data["stock_quantity"], 7)

        # Deduct below zero rejection
        res_invalid = self.client.post(adjust_url, {"adjustment": -20})
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Product.objects.get(pk=self.product.id).stock_quantity, 7)

    # ---------------- Sales & Atomic Business Logic Tests ---------------- #
    def test_sale_creation_success_and_stock_deduction(self):
        self.client.force_login(self.user)
        url = reverse("api:v1:sale-list")

        # Buy 4 units
        res = self.client.post(url, {"product_id": self.product.id, "quantity": 4})
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(res.data["unit_price"])), Decimal("100.00"))
        self.assertEqual(Decimal(str(res.data["total_price"])), Decimal("400.00"))

        # Check stock deduction
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 6)

        # Try to delete product with sales history (must be protected)
        del_prod_url = reverse("api:v1:product-detail", kwargs={"pk": self.product.id})
        res_del = self.client.delete(del_prod_url)
        self.assertEqual(res_del.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Product.objects.filter(pk=self.product.id).exists())

    def test_sale_insufficient_stock_rejection(self):
        self.client.force_login(self.user)
        url = reverse("api:v1:sale-list")

        # Product has 10 units; attempting to purchase 11
        res = self.client.post(url, {"product_id": self.product.id, "quantity": 11})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantity", res.data)

        # Stock must remain completely untouched
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 10)
        self.assertEqual(Sale.objects.count(), 0)

    # ---------------- Dashboard Aggregates Tests ---------------- #
    def test_dashboard_aggregates_match_database(self):
        self.client.force_login(self.user)

        # Record a sale
        Sale.objects.create(
            product=self.product,
            quantity=2,
            unit_price=self.product.price,
            total_price=self.product.price * 2,
            sold_by=self.user,
        )
        self.product.stock_quantity = 2  # Low stock threshold is 3, so now it's low stock
        self.product.save()

        url = reverse("api:v1:api-dashboard-stats")
        res = self.client.get(url, {"range": "7d"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        kpis = res.data["kpis"]
        self.assertEqual(kpis["total_products"], 1)
        self.assertEqual(kpis["total_stock_units"], 2)
        self.assertEqual(kpis["low_stock_count"], 1)
        self.assertEqual(kpis["today_sales_count"], 1)
        self.assertEqual(Decimal(str(kpis["today_revenue"])), Decimal("200.00"))
        self.assertEqual(Decimal(str(kpis["total_revenue"])), Decimal("200.00"))

        self.assertEqual(len(res.data["low_stock_products"]), 1)
        self.assertEqual(len(res.data["recent_sales"]), 1)
