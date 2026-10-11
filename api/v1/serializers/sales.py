from rest_framework import serializers
from sales.models import Sale
from inventory.models import Product


class SaleUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.CharField(source="get_full_name", read_only=True)


class SaleProductSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    sku = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    stock_quantity = serializers.IntegerField(read_only=True)


class SaleSerializer(serializers.ModelSerializer):
    product = SaleProductSerializer(read_only=True)
    sold_by = SaleUserSerializer(read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "product",
            "quantity",
            "unit_price",
            "total_price",
            "sold_by",
            "created_at",
        ]


class SaleCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)

    def validate_product_id(self, value):
        if not Product.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Product does not exist.")
        return value
