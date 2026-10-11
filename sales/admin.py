from django.contrib import admin

from .models import Sale


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("product", "quantity", "unit_price", "total_price", "sold_by", "created_at")
    search_fields = ("product__name", "product__sku", "sold_by__username")
    list_filter = ("created_at", "sold_by")
    ordering = ("-created_at",)
    readonly_fields = ("unit_price", "total_price", "sold_by")