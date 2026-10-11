from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import F, Q
from django.db.models.deletion import ProtectedError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter

from inventory.models import Product
from inventory.services import adjust_stock
from ..serializers.products import (
    ProductDetailSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
    StockAdjustmentSerializer,
)


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ProductWriteSerializer
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    def get_queryset(self):
        queryset = Product.objects.select_related("category").order_by("-created_at")
        
        # Search filter (name or SKU)
        q = self.request.query_params.get("q", "").strip()
        if q:
            queryset = queryset.filter(Q(name__icontains=q) | Q(sku__icontains=q))

        # Category filter
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # Status filter
        status_filter = self.request.query_params.get("status")
        if status_filter == "low_stock":
            queryset = queryset.filter(stock_quantity__lte=F("low_stock_threshold"))
        elif status_filter == "out_of_stock":
            queryset = queryset.filter(stock_quantity=0)
        elif status_filter == "in_stock":
            queryset = queryset.filter(stock_quantity__gt=0)

        # Ordering
        ordering = self.request.query_params.get("ordering")
        allowed_ordering = ["name", "-name", "price", "-price", "stock_quantity", "-stock_quantity", "created_at", "-created_at"]
        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "This product has sales history and cannot be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @extend_schema(
        request=StockAdjustmentSerializer,
        responses={200: ProductDetailSerializer},
    )
    @action(detail=True, methods=["post"], url_path="adjust-stock")
    def adjust_stock(self, request, pk=None):
        product = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated_product = adjust_stock(
                product_id=product.pk,
                adjustment=serializer.validated_data["adjustment"],
                reason=serializer.validated_data.get("reason", ""),
            )
            return Response(ProductDetailSerializer(updated_product).data, status=status.HTTP_200_OK)
        except DjangoValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
