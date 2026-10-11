from rest_framework import serializers
from .products import ProductListSerializer
from .sales import SaleSerializer


class KPISerializer(serializers.Serializer):
    total_products = serializers.IntegerField()
    total_stock_units = serializers.IntegerField()
    low_stock_count = serializers.IntegerField()
    today_sales_count = serializers.IntegerField()
    today_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)


class RevenueTrendPointSerializer(serializers.Serializer):
    date = serializers.DateField()
    label = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    sales_count = serializers.IntegerField()


class CategoryDistributionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    product_count = serializers.IntegerField()
    total_stock = serializers.IntegerField()


class DashboardStatsSerializer(serializers.Serializer):
    kpis = KPISerializer()
    revenue_trend = RevenueTrendPointSerializer(many=True)
    category_distribution = CategoryDistributionSerializer(many=True)
    low_stock_products = ProductListSerializer(many=True)
    recent_sales = SaleSerializer(many=True)
