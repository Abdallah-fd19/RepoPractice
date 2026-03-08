from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer, ProfileSerializer
from .models import Profile
# Create your views here.

class RegisterView(APIView):
 def post(self, request):
  serializer = RegisterSerializer(data=request.data)
  
  if serializer.is_valid():
   username = serializer.validated_data["username"]
   email = serializer.validated_data["email"]
   password = serializer.validated_data["password"]

   # Check if the username already exists
   if User.objects.filter(username=username).exists():
    return Response({"username": ["This username is already taken."]}, status=status.HTTP_400_BAD_REQUEST)
   
   if User.objects.filter(email=email).exists():
    return Response({"email": ["This email is already used."]}, status=status.HTTP_400_BAD_REQUEST)

   user = User.objects.create_user(
    username=username,
    email=email,
    password=password
   )

   Profile.objects.create(user=user)

   refresh = RefreshToken.for_user(user)

   return Response({
      "message": "User registered successfully",
      "user": {
          "id": user.id,
          "username": user.username,
          "email": user.email
      },
      "tokens": {
          "refresh": str(refresh),
          "access": str(refresh.access_token),
      }
   }, status=status.HTTP_201_CREATED)
  
  return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 

class LoginView(APIView):
 def post(self, request):
  serializer = LoginSerializer(data=request.data)
  if serializer.is_valid():
   username = serializer.validated_data["username"]
   password = serializer.validated_data["password"]
   
   user = authenticate(username=username, password=password)

   if user is None:
    return Response({"errors":["Invalid username or password"]}, status=status.HTTP_401_UNAUTHORIZED)
   
   refresh = RefreshToken.for_user(user)
   
   return Response({
    "message": "Login successful",
    "user":{
        "id": user.id,
        "username": user.username,
        "email": user.email
    },
    "tokens": {
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    }
   }, status=status.HTTP_200_OK)
  

class ProfileView(APIView):
 permission_classes = [IsAuthenticated]
 
 def get(self, request):
  profile = request.user.profile # one-to-one relationship
  serializer = ProfileSerializer(profile)
  return Response(serializer.data, status=status.HTTP_200_OK)
 
 def put(self, request):
  profile = request.user.profile
  serializer = ProfileSerializer(profile, data=request.data)

  if serializer.is_valid():
   serializer.save()
   return Response(serializer.data, status=status.HTTP_200_OK)
  
  return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
 def patch(self, request):
  profile = request.user.profile
  serializer = ProfileSerializer(profile, data=request.data, partial=True)

  if serializer.is_valid():
   serializer.save()
   return Response(serializer.data, status=status.HTTP_200_OK)
  
  return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

