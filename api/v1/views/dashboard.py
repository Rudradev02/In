from datetime import timedelta
from decimal import Decimal
from django.db.models import Count, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiParameter

from inventory.models import Category, Product
from sales.models import Sale
from ..serializers.dashboard import DashboardStatsSerializer
from ..serializers.products import ProductListSerializer
from ..serializers.sales import SaleSerializer


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="range",
                description="Date range for revenue trends (7d, 30d, 90d)",
                required=False,
                type=str,
                default="7d",
            )
        ],
        responses={200: DashboardStatsSerializer},
    )
    def get(self, request):
        today = timezone.localdate()
        range_param = request.query_params.get("range", "7d").lower()
        days_map = {"7d": 7, "30d": 30, "90d": 90}
        days_count = days_map.get(range_param, 7)

        # High-level KPIs
        products_qs = Product.objects.all()
        total_products = products_qs.count()
        total_stock_units = products_qs.aggregate(total=Sum("stock_quantity"))["total"] or 0
        low_stock_count = products_qs.filter(stock_quantity__lte=F("low_stock_threshold")).count()

        today_sales_qs = Sale.objects.filter(created_at__date=today)
        today_sales_count = today_sales_qs.count()
        today_revenue = today_sales_qs.aggregate(total=Sum("total_price"))["total"] or Decimal("0.00")
        total_revenue = Sale.objects.aggregate(total=Sum("total_price"))["total"] or Decimal("0.00")

        # Revenue trend aggregation in a single query
        start_date = today - timedelta(days=days_count - 1)
        sales_in_range = Sale.objects.filter(created_at__date__gte=start_date, created_at__date__lte=today)
        daily_aggregates = (
            sales_in_range.annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total_price"), sales_count=Count("id"))
            .order_by("day")
        )
        daily_map = {item["day"]: item for item in daily_aggregates}

        revenue_trend = []
        for offset in range(days_count - 1, -1, -1):
            day = today - timedelta(days=offset)
            record = daily_map.get(day)
            revenue = record["revenue"] if record else Decimal("0.00")
            sales_count = record["sales_count"] if record else 0
            revenue_trend.append({
                "date": day.isoformat(),
                "label": day.strftime("%d %b"),
                "revenue": revenue,
                "sales_count": sales_count,
            })

        # Category distribution
        categories = (
            Category.objects.annotate(
                product_count=Count("products"),
                total_stock=Sum("products__stock_quantity"),
            )
            .filter(product_count__gt=0)
            .order_by("-product_count")
        )
        category_distribution = [
            {
                "id": cat.id,
                "name": cat.name,
                "product_count": cat.product_count,
                "total_stock": cat.total_stock or 0,
            }
            for cat in categories
        ]

        # Low stock products (urgency sorted)
        low_stock_products = (
            Product.objects.select_related("category")
            .filter(stock_quantity__lte=F("low_stock_threshold"))
            .order_by("stock_quantity")[:6]
        )

        # Recent transactions
        recent_sales = Sale.objects.select_related("product", "sold_by").order_by("-created_at")[:6]

        data = {
            "kpis": {
                "total_products": total_products,
                "total_stock_units": total_stock_units,
                "low_stock_count": low_stock_count,
                "today_sales_count": today_sales_count,
                "today_revenue": today_revenue,
                "total_revenue": total_revenue,
            },
            "revenue_trend": revenue_trend,
            "category_distribution": category_distribution,
            "low_stock_products": ProductListSerializer(low_stock_products, many=True).data,
            "recent_sales": SaleSerializer(recent_sales, many=True).data,
        }

        return Response(data)
