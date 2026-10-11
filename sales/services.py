from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import transaction

from inventory.models import Product
from .models import Sale


def record_sale(product_id: int, quantity: int, user) -> Sale:
    """
    Atomically records a sale for a product and quantity.
    Uses select_for_update inside transaction.atomic() to ensure concurrent safety
    and prevent overselling.
    """
    if quantity is None or quantity <= 0:
        raise ValidationError({"quantity": "Quantity must be greater than zero."})

    with transaction.atomic():
        try:
            product = Product.objects.select_for_update().get(pk=product_id)
        except Product.DoesNotExist:
            raise ValidationError({"product": "Product does not exist."})

        if quantity > product.stock_quantity:
            raise ValidationError({
                "quantity": f"Only {product.stock_quantity} units are currently available."
            })

        unit_price = product.price
        total_price = unit_price * Decimal(quantity)

        sale = Sale.objects.create(
            product=product,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price,
            sold_by=user,
        )

        product.stock_quantity -= quantity
        product.save(update_fields=["stock_quantity", "updated_at"])

        return sale
