from django.contrib import admin

from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name",)
    ordering = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "sku", "category", "price", "stock_quantity", "low_stock_threshold", "stock_status")
    search_fields = ("name", "sku")
    list_filter = ("category",)
    ordering = ("name",)

    @admin.display(description="Status")
    def stock_status(self, obj):
        return "Low stock" if obj.is_low_stock else "Healthy"