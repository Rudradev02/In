from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from sales.models import Sale
from sales.services import record_sale
from ..serializers.sales import SaleCreateSerializer, SaleSerializer


class SaleViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return SaleCreateSerializer
        return SaleSerializer

    def get_queryset(self):
        queryset = Sale.objects.select_related("product", "sold_by").order_by("-created_at")

        # Search filter
        q = self.request.query_params.get("q", "").strip()
        if q:
            queryset = queryset.filter(
                Q(product__name__icontains=q)
                | Q(product__sku__icontains=q)
                | Q(sold_by__username__icontains=q)
                | Q(sold_by__first_name__icontains=q)
                | Q(sold_by__last_name__icontains=q)
            )

        # Product filter
        product_id = self.request.query_params.get("product")
        if product_id:
            queryset = queryset.filter(product_id=product_id)

        # Date range filter
        start_date = self.request.query_params.get("start_date")
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)

        end_date = self.request.query_params.get("end_date")
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        return queryset

    @extend_schema(request=SaleCreateSerializer, responses={201: SaleSerializer})
    def create(self, request, *args, **kwargs):
        serializer = SaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            sale = record_sale(
                product_id=serializer.validated_data["product_id"],
                quantity=serializer.validated_data["quantity"],
                user=request.user,
            )
            return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)
        except DjangoValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
