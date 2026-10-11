from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from accounts.services import change_user_role, set_user_active
from api.permissions import IsAdminRole
from ..serializers.users import (
    UserChangeRoleSerializer,
    UserCreateAdminSerializer,
    UserListSerializer,
    UserToggleActiveSerializer,
)

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    Admin-only user management viewset.
    Enforces:
    - Last active Admin cannot be demoted or deactivated.
    - Nobody can change their own role or deactivate themselves.
    - Deactivation terminates all active user sessions.
    - Role changes are logged to the AuditLog.
    """
    permission_classes = [IsAuthenticated, IsAdminRole]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateAdminSerializer
        if self.action == "change_role":
            return UserChangeRoleSerializer
        if self.action == "toggle_active":
            return UserToggleActiveSerializer
        return UserListSerializer

    def get_queryset(self):
        return User.objects.all().prefetch_related("groups").order_by("-date_joined")

    @extend_schema(request=UserCreateAdminSerializer, responses={201: UserListSerializer})
    def create(self, request, *args, **kwargs):
        serializer = UserCreateAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserListSerializer(user).data, status=status.HTTP_201_CREATED)

    @extend_schema(request=UserChangeRoleSerializer, responses={200: UserListSerializer})
    @action(detail=True, methods=["post"], url_path="change-role")
    def change_role(self, request, pk=None):
        target_user = self.get_object()
        serializer = UserChangeRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated_user = change_user_role(
                actor=request.user,
                target_user=target_user,
                new_role=serializer.validated_data["role"],
            )
            return Response(UserListSerializer(updated_user).data, status=status.HTTP_200_OK)
        except DjangoValidationError as e:
            msg = e.message if hasattr(e, "message") else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(request=UserToggleActiveSerializer, responses={200: UserListSerializer})
    @action(detail=True, methods=["post"], url_path="toggle-active")
    def toggle_active(self, request, pk=None):
        target_user = self.get_object()
        serializer = UserToggleActiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            updated_user = set_user_active(
                actor=request.user,
                target_user=target_user,
                is_active=serializer.validated_data["is_active"],
            )
            return Response(UserListSerializer(updated_user).data, status=status.HTTP_200_OK)
        except DjangoValidationError as e:
            msg = e.message if hasattr(e, "message") else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, *args, **kwargs):
        target_user = self.get_object()
        data = request.data

        try:
            if "role" in data:
                target_user = change_user_role(
                    actor=request.user,
                    target_user=target_user,
                    new_role=data["role"],
                )
            if "is_active" in data:
                target_user = set_user_active(
                    actor=request.user,
                    target_user=target_user,
                    is_active=bool(data["is_active"]),
                )
            return Response(UserListSerializer(target_user).data, status=status.HTTP_200_OK)
        except DjangoValidationError as e:
            msg = e.message if hasattr(e, "message") else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
