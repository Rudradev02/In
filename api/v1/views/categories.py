from django.db.models import Count
from django.db.models.deletion import ProtectedError
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.permissions import CategoryPermission
from inventory.models import Category
from ..serializers.categories import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, CategoryPermission]
    serializer_class = CategorySerializer
    pagination_class = None  # Categories are typically small and needed in full for selects

    def get_queryset(self):
        return Category.objects.annotate(products_count=Count("products")).order_by("name")

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        if category.products.exists():
            return Response(
                {"detail": "This category still has products and cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This category is protected and cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
