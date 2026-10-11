from django.core.exceptions import ValidationError
from django.db import transaction

from .models import Product


def adjust_stock(product_id: int, adjustment: int, reason: str = "") -> Product:
    """
    Atomically adjust product stock quantity by an integer adjustment (can be positive or negative).
    Ensures final stock does not fall below zero.
    """
    if adjustment == 0:
        raise ValidationError({"adjustment": "Adjustment cannot be zero."})

    with transaction.atomic():
        try:
            product = Product.objects.select_for_update().get(pk=product_id)
        except Product.DoesNotExist:
            raise ValidationError({"product": "Product does not exist."})

        new_quantity = product.stock_quantity + adjustment
        if new_quantity < 0:
            raise ValidationError({
                "adjustment": f"Cannot reduce stock below zero. Current stock is {product.stock_quantity}."
            })

        product.stock_quantity = new_quantity
        product.save(update_fields=["stock_quantity", "updated_at"])
        return product
