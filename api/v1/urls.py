from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views.auth import CsrfTokenView, CurrentUserView, LoginView, LogoutView, RegisterView
from .views.categories import CategoryViewSet
from .views.dashboard import DashboardStatsView
from .views.products import ProductViewSet
from .views.sales import SaleViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"sales", SaleViewSet, basename="sale")

urlpatterns = [
    path("auth/csrf/", CsrfTokenView.as_view(), name="api-auth-csrf"),
    path("auth/login/", LoginView.as_view(), name="api-auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="api-auth-logout"),
    path("auth/register/", RegisterView.as_view(), name="api-auth-register"),
    path("auth/me/", CurrentUserView.as_view(), name="api-auth-me"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="api-dashboard-stats"),
    path("", include(router.urls)),
]
