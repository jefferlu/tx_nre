from django.shortcuts import render
from django.conf import settings

from rest_framework import viewsets, mixins
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny

from django_auto_prefetching import AutoPrefetchViewSetMixin

from utils.utils import Utils
from db import models
from . import serializers


class TokenObtainView(TokenObtainPairView):
    serializer_class = serializers.TokenObtainSerializer


class CustomerViewSet(AutoPrefetchViewSetMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.CustomerSerializer
    queryset = models.Customer.objects.all()
    # pagination_class = None
    lookup_field = 'name'


class RecordViewSet(AutoPrefetchViewSetMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.RecordSerializer
    queryset = models.Record.objects.all()

