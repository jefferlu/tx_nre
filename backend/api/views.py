from django.http import Http404
from django.shortcuts import render
from django.conf import settings
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, mixins
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from django_auto_prefetching import AutoPrefetchViewSetMixin

from utils.utils import Utils
from db import models
from . import serializers


class TokenObtainView(TokenObtainPairView):
    serializer_class = serializers.TokenObtainSerializer


class ChoicesViewSet(AutoPrefetchViewSetMixin, viewsets.ViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.ChoicesSerializer

    def list(self, request):
        instance = {
            'lab_locations': self.Convert(models.TestItem.LAB_LOCATION),
        }

        serializer = serializers.ChoicesSerializer(instance=instance)
        return Response({'results': serializer.data})

    def Convert(self, tup):
        di = []
        for t in tup:
            di.append({'id': t[0], 'name': t[1]})
        return di


class ItemViewSet(AutoPrefetchViewSetMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.ItemSerializer
    queryset = models.Item.objects.all()


class CustomerViewSet(AutoPrefetchViewSetMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.CustomerSerializer
    queryset = models.Customer.objects.all()
    # pagination_class = None


class ProjectViewSet(AutoPrefetchViewSetMixin, viewsets.ModelViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.ProjectSerializer
    queryset = models.Project.objects.all()
    lookup_field = 'name'

    def get_object(self):
        customer = self.request.GET.get('customer', None)
        name = self.kwargs['name']
        return get_object_or_404(models.Project, name=name, customer=customer)
