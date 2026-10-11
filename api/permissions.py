from django.http import Http404
from rest_framework.permissions import BasePermission, SAFE_METHODS


def get_user_role(user):
    """
    Returns the role name ('Admin', 'Manager', 'Cashier') for a user.
    """
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser or user.groups.filter(name="Admin").exists():
        return "Admin"
    if user.groups.filter(name="Manager").exists():
        return "Manager"
    if user.groups.filter(name="Cashier").exists():
        return "Cashier"
    return "Cashier"


class IsAdminRole(BasePermission):
    """
    Allows access only to Admin users (or superusers).
    """
    message = "Admin role required to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_superuser or request.user.groups.filter(name="Admin").exists())
        )


class IsManagerOrAdmin(BasePermission):
    """
    Allows access to Managers and Admins.
    """
    message = "Manager or Admin role required to perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.groups.filter(name__in=["Admin", "Manager"]).exists()
            )
        )


class CanManageUsers(BasePermission):
    """
    Allows access to users who have 'accounts.manage_users' permission or are Admin.
    """
    message = "You do not have permission to manage users."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.has_perm("accounts.manage_users")
                or request.user.groups.filter(name="Admin").exists()
            )
        )


class CanViewReports(BasePermission):
    """
    Allows access to financial/dashboard reports (Admin or Manager).
    """
    message = "You do not have permission to view financial reports."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.has_perm("accounts.view_reports")
                or request.user.groups.filter(name__in=["Admin", "Manager"]).exists()
            )
        )


class CanAdjustStock(BasePermission):
    """
    Allows adjusting inventory stock levels (Admin or Manager).
    """
    message = "You do not have permission to adjust inventory stock."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.has_perm("accounts.adjust_stock")
                or request.user.groups.filter(name__in=["Admin", "Manager"]).exists()
            )
        )


class CanViewAllSales(BasePermission):
    """
    Allows viewing all sales across the company.
    """
    message = "You do not have permission to view all sales transactions."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                request.user.is_superuser
                or request.user.has_perm("accounts.view_all_sales")
                or request.user.groups.filter(name__in=["Admin", "Manager"]).exists()
            )
        )


class CategoryPermission(BasePermission):
    """
    Category access rules:
    - Safe methods (GET, HEAD, OPTIONS): any authenticated user (Cashier, Manager, Admin).
    - Write methods (POST, PUT, PATCH, DELETE): Manager or Admin only.
    """
    message = "You do not have permission to create, edit, or delete categories."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user.is_superuser
            or request.user.groups.filter(name__in=["Admin", "Manager"]).exists()
        )


class ProductPermission(BasePermission):
    """
    Product access rules:
    - Safe methods (GET, HEAD, OPTIONS): any authenticated user (Cashier, Manager, Admin).
    - Write methods (POST, PUT, PATCH, DELETE): Manager or Admin only.
    """
    message = "You do not have permission to create, edit prices, or delete products."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user.is_superuser
            or request.user.groups.filter(name__in=["Admin", "Manager"]).exists()
        )


class SalePermission(BasePermission):
    """
    Sale access rules:
    - POST: any authenticated user (Cashier, Manager, Admin).
    - GET (list & retrieve): all authenticated users, but Cashier can only see their own sales.
      If a Cashier tries to retrieve a sale made by someone else, returns 404.
    """
    message = "You do not have permission to access sales transactions."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser or user.groups.filter(name__in=["Admin", "Manager"]).exists() or user.has_perm("accounts.view_all_sales"):
            return True
        # Cashier: own sales only; return 404 if accessed by someone else
        if obj.sold_by_id != user.id:
            raise Http404("Sale receipt not found.")
        return True
