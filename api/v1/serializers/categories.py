from rest_framework import serializers
from inventory.models import Category


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Category
        fields = ["id", "name", "description", "products_count"]
