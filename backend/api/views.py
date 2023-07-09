from django.http import Http404
from django.shortcuts import render
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import Q

from rest_framework import viewsets, mixins, status, exceptions
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from django_auto_prefetching import AutoPrefetchViewSetMixin

from utils.utils import Utils
from db import models
from . import serializers


class TokenObtainView(TokenObtainPairView):
    serializer_class = serializers.TokenObtainSerializer


# class ChoicesViewSet(AutoPrefetchViewSetMixin, viewsets.ViewSet):
#     if (not settings.DEBUG):
#         permission_classes = (IsAuthenticated, )
#     serializer_class = serializers.ChoicesSerializer

#     def list(self, request):
#         instance = {
#             'lab_locations': self.Convert(models.TestItem.LAB_LOCATION),
#         }

#         serializer = serializers.ChoicesSerializer(instance=instance)
#         return Response({'results': serializer.data})

#     def Convert(self, tup):
#         di = []
#         for t in tup:
#             di.append({'id': t[0], 'name': t[1]})
#         return di


class ItemViewSet(AutoPrefetchViewSetMixin, viewsets.ModelViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.ItemSerializer
    # list_serializer_class = serializers.ItemListSerializer
    queryset = models.Item.objects.all().order_by('name')

    # def get_serializer_class(self):
    #     if self.action == 'create' and isinstance(self.request.data, list):
    #         return self.list_serializer_class
    #     return super().get_serializer_class()

    def get_queryset(self):
        query = self.request.query_params.get('query')
        qs = models.Item.objects.all().order_by('name')

        if query:
            qs = self.queryset.filter(Q(no__icontains=query) | Q(name__icontains=query))

        return qs

    def create(self, request, *args, **kwargs):
        # get
        data = request.data

       # Categorize data into items to create and items to update
        create_data = [item for item in data if 'id' not in item]
        update_data = [item for item in data if 'id' in item]
        print(update_data)
        created_objects = []
        if create_data:
            serializer = self.get_serializer(data=create_data, many=True)
            try:
                serializer.is_valid(raise_exception=True)
            except exceptions.ValidationError as e:
                if '這個 name 在 item 已經存在。' in str(e):
                    # Data duplication case
                    message = f'{create_data[0]["name"]} 資料重覆'
                    print("資料重覆")
                else:
                    # Other error cases
                    message = e.message
                    print("其他錯誤")
                return Response(message, status=status.HTTP_400_BAD_REQUEST)
            created_objects = serializer.save()

        # Perform update actions
        if update_data:
            for item in update_data:
                instance = self.get_queryset().get(id=item['id'])
                serializer = self.get_serializer(instance, data=item, partial=True)
                try:
                    serializer.is_valid(raise_exception=True)
                except exceptions.ValidationError as e:
                    if '這個 name 在 item 已經存在。' in str(e):
                        # Data duplication case
                        message = f'{update_data[0]["name"]} 資料重覆'
                        print("資料重覆")
                    else:
                        # Other error cases
                        message = e.message
                        print("其他錯誤")
                    return Response(message, status=status.HTTP_400_BAD_REQUEST)
                serializer.save()

        # Combine the results of creation and update and return
        result = self.get_serializer(created_objects + update_data, many=True)
        return Response(result.data, status=status.HTTP_201_CREATED)


class CustomerViewSet(AutoPrefetchViewSetMixin, viewsets.ModelViewSet):
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
