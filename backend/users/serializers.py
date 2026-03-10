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

 class Meta:
  model = Profile
  fields = ["id", "user", "bio", "avatar"]




