from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models.deletion import ProtectedError
from django.db.models import F, Q, Sum
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from datetime import timedelta

from sales.models import Sale
from .forms import CategoryForm, ProductForm
from .models import Category, Product


@login_required
def dashboard(request):
    today = timezone.localdate()
    products = Product.objects.select_related("category")
    today_sales = Sale.objects.filter(created_at__date=today)
    recent_sales = Sale.objects.select_related("product", "sold_by").order_by("-created_at")[:6]
    low_stock = products.filter(stock_quantity__lte=F("low_stock_threshold"))[:6]
    chart_sales = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        total = Sale.objects.filter(created_at__date=day).aggregate(value=Sum("total_price"))["value"] or 0
        chart_sales.append({"label": day.strftime("%b %d"), "value": float(total)})
    context = {
        "total_products": products.count(),
        "total_stock": products.aggregate(value=Sum("stock_quantity"))["value"] or 0,
        "low_stock_count": products.filter(stock_quantity__lte=F("low_stock_threshold")).count(),
        "today_sales": today_sales.count(),
        "today_revenue": today_sales.aggregate(value=Sum("total_price"))["value"] or 0,
        "total_revenue": Sale.objects.aggregate(value=Sum("total_price"))["value"] or 0,
        "recent_sales": recent_sales,
        "low_stock": low_stock,
        "chart_labels": [item["label"] for item in chart_sales],
        "chart_values": [item["value"] for item in chart_sales],
    }
    return render(request, "inventory/dashboard.html", context)


@login_required
def product_list(request):
    query = request.GET.get("q", "").strip()
    category_id = request.GET.get("category", "")
    products = Product.objects.select_related("category")
    if query:
        products = products.filter(Q(name__icontains=query) | Q(sku__icontains=query))
    if category_id:
        products = products.filter(category_id=category_id)
    return render(request, "inventory/product_list.html", {
        "products": products, "categories": Category.objects.all(), "query": query, "selected_category": category_id,
    })


@login_required
def product_detail(request, pk):
    return render(request, "inventory/product_detail.html", {"product": get_object_or_404(Product.objects.select_related("category"), pk=pk)})


@login_required
def product_create(request):
    form = ProductForm(request.POST or None)
    if form.is_valid():
        product = form.save()
        messages.success(request, f"{product.name} was added to your inventory.")
        return redirect("product-detail", product.pk)
    return render(request, "inventory/product_form.html", {"form": form, "title": "Add product", "submit_label": "Add product"})


@login_required
def product_update(request, pk):
    product = get_object_or_404(Product, pk=pk)
    form = ProductForm(request.POST or None, instance=product)
    if form.is_valid():
        product = form.save()
        messages.success(request, f"{product.name} was updated.")
        return redirect("product-detail", product.pk)
    return render(request, "inventory/product_form.html", {"form": form, "title": "Edit product", "submit_label": "Save changes", "product": product})


@login_required
def product_delete(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == "POST":
        name = product.name
        try:
            product.delete()
            messages.success(request, f"{name} was deleted.")
        except ProtectedError:
            messages.error(request, "This product has sales history and cannot be deleted.")
        return redirect("product-list")
    return render(request, "inventory/confirm_delete.html", {"object": product, "object_type": "product"})


@login_required
def category_list(request):
    categories = Category.objects.all().prefetch_related("products")
    form = CategoryForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        category = form.save()
        messages.success(request, f"{category.name} was created.")
        return redirect("category-list")
    return render(request, "inventory/category_list.html", {"categories": categories, "form": form})


@login_required
def category_delete(request, pk):
    category = get_object_or_404(Category, pk=pk)
    if request.method == "POST":
        try:
            category.delete()
            messages.success(request, f"{category.name} was deleted.")
        except Exception:
            messages.error(request, "This category still has products and cannot be deleted.")
        return redirect("category-list")
    return render(request, "inventory/confirm_delete.html", {"object": category, "object_type": "category"})
