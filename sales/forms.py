from django import forms

from inventory.models import Product
from .models import Sale


class SaleForm(forms.ModelForm):
    class Meta:
        model = Sale
        fields = ["product", "quantity"]
        widgets = {"quantity": forms.NumberInput(attrs={"min": "1"})}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["product"].queryset = Product.objects.filter(stock_quantity__gt=0).order_by("name")

    def clean_quantity(self):
        quantity = self.cleaned_data["quantity"]
        product = self.cleaned_data.get("product")
        if product and quantity > product.stock_quantity:
            raise forms.ValidationError(f"Only {product.stock_quantity} units are currently available.")
        return quantity