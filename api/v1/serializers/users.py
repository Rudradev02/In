from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from api.permissions import get_user_role

User = get_user_model()


class UserListSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "date_joined",
            "last_login",
            "role",
        ]
        read_only_fields = fields

    def get_role(self, obj):
        return get_user_role(obj)


class UserCreateAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    role = serializers.ChoiceField(choices=["Admin", "Manager", "Cashier"], default="Cashier")

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "password",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        role_name = validated_data.pop("role", "Cashier")
        user = User.objects.create_user(**validated_data)
        group, _ = Group.objects.get_or_create(name=role_name)
        user.groups.add(group)
        if role_name == "Admin":
            user.is_staff = True
            user.save(update_fields=["is_staff"])
        return user


class UserChangeRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["Admin", "Manager", "Cashier"])


class UserToggleActiveSerializer(serializers.Serializer):
    is_active = serializers.BooleanField()
