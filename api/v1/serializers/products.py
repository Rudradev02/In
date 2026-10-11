from rest_framework import serializers
from inventory.models import Category, Product
from .categories import CategorySerializer


class ProductListSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(source="category.id", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category_id",
            "category_name",
            "price",
            "stock_quantity",
            "low_stock_threshold",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True
    )
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category",
            "category_id",
            "price",
            "stock_quantity",
            "low_stock_threshold",
            "description",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category"
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "sku",
            "category_id",
            "price",
            "stock_quantity",
            "low_stock_threshold",
            "description",
        ]

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be a non-negative number.")
        return value

    def validate_stock_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value

    def validate_low_stock_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError("Low stock threshold cannot be negative.")
        return value


class StockAdjustmentSerializer(serializers.Serializer):
    adjustment = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_adjustment(self, value):
        if value == 0:
            raise serializers.ValidationError("Adjustment amount cannot be zero.")
        return value
