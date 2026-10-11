from django.urls import path

from . import views

urlpatterns = [
    path("", views.sale_list, name="sale-list"),
    path("add/", views.sale_create, name="sale-create"),
    path("<int:pk>/", views.sale_detail, name="sale-detail"),
]