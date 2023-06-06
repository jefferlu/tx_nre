from django.shortcuts import render
from rest_framework_simplejwt.views import TokenObtainPairView

from . import serializers

class TokenObtainView(TokenObtainPairView):
    serializer_class = serializers.TokenObtainSerializer