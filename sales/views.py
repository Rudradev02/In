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


from django.core.exceptions import ValidationError
from .services import record_sale


@login_required
def sale_create(request):
    form = SaleForm(request.POST or None)
    if form.is_valid():
        try:
            sale = record_sale(
                product_id=form.cleaned_data["product"].pk,
                quantity=form.cleaned_data["quantity"],
                user=request.user,
            )
            messages.success(request, f"Sale recorded for {sale.product.name}.")
            return redirect("sale-detail", sale.pk)
        except ValidationError as e:
            for field, errors in e.message_dict.items():
                for error in errors:
                    form.add_error(field if field != "__all__" else None, error)
    return render(request, "sales/sale_form.html", {"form": form})