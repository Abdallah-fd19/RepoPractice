from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class RegisterSerializer(serializers.Serializer):
 username = serializers.CharField(max_length=150)
 email = serializers.EmailField()
 password = serializers.CharField(write_only=True, min_length=6)

class LoginSerializer(serializers.Serializer):
    """
    Email-based login serializer.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class UserSerializer(serializers.ModelSerializer):
 class Meta:
  model = User
  fields = ["id", "username", "email"]

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(source="user.username", max_length=150, required=False)

    class Meta:
        model = Profile
        fields = ["id", "user", "username", "bio", "avatar", "github_username"]
        read_only_fields = ["github_username"]

    def validate_username(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Username cannot be blank.")
        user = self.context["request"].user
        if User.objects.filter(username=value.strip()).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value.strip()

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)
        if user_data and "username" in user_data:
            instance.user.username = user_data["username"]
            instance.user.save()
        return super().update(instance, validated_data)




