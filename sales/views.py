from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render

from inventory.models import Product
from .forms import SaleForm
from .models import Sale


@login_required
def sale_list(request):
    query = request.GET.get("q", "").strip()
    sales = Sale.objects.select_related("product", "sold_by")
    if query:
        sales = sales.filter(Q(product__name__icontains=query) | Q(product__sku__icontains=query) | Q(sold_by__username__icontains=query))
    return render(request, "sales/sale_list.html", {"sales": sales, "query": query})


@login_required
def sale_detail(request, pk):
    return render(request, "sales/sale_detail.html", {"sale": get_object_or_404(Sale.objects.select_related("product", "sold_by"), pk=pk)})


@login_required
def sale_create(request):
    form = SaleForm(request.POST or None)
    if form.is_valid():
        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=form.cleaned_data["product"].pk)
            quantity = form.cleaned_data["quantity"]
            if quantity > product.stock_quantity:
                form.add_error("quantity", f"Only {product.stock_quantity} units are currently available.")
            else:
                sale = Sale.objects.create(
                    product=product, quantity=quantity, unit_price=product.price,
                    total_price=product.price * quantity, sold_by=request.user,
                )
                product.stock_quantity -= quantity
                product.save(update_fields=["stock_quantity", "updated_at"])
                messages.success(request, f"Sale recorded for {product.name}.")
                return redirect("sale-detail", sale.pk)
    return render(request, "sales/sale_form.html", {"form": form})