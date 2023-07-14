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

'''
UI:
1. this.page.data是顯示架構以customer為主串出頁面顯示架構
2. project API回傳的是每一筆record的資料，因此需對應test_item將查詢資料回填至thisp.page.data

Backend:
1. 查詢時使用GET，參數只有customer及project
    a. 資料存在時: 在get_object()用first()取得最新一筆資料(-id降冪排序)
    b. 資料不存在時，會回傳所有欄為皆為null的結果
2. 當query_params裡面有version時:
    a. 以customer、project及version查詢，因使用get()找不到資料會回傳404，因此一樣以first()回傳結果
    b. 找不到資料會回傳所有欄位皆為null的結果
3. 前端以project.id來判別執行create及update
    a. create時，只帶lookup_field，即可新資資料
    b. update時，需在get_object()提供version以避免更新錯識資料(只用custumer、project會有多筆)
    
'''

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
            qs = qs.filter(Q(no__icontains=query) | Q(name__icontains=query))

        return qs

    def create(self, request, *args, **kwargs):
        # get
        data = request.data

       # Categorize data into items to create and items to update
        create_data = [item for item in data if 'id' not in item]
        update_data = [item for item in data if 'id' in item]

        created_objects = []
        if create_data:
            serializer = self.get_serializer(data=create_data, many=True)
            try:
                serializer.is_valid(raise_exception=True)
            except exceptions.ValidationError as e:
                if '這個 name 在 item 已經存在。' in str(e):
                    # Data duplication case
                    message = f'{create_data[0]["name"]} 資料重覆'
                    # print("資料重覆")
                else:
                    # Other error cases
                    message = e.message
                    # print("其他錯誤")
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
                        # print("資料重覆")
                    else:
                        # Other error cases
                        message = e.message
                        # print("其他錯誤")
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


class ProjectViewSet(
        AutoPrefetchViewSetMixin,
        mixins.RetrieveModelMixin,
        mixins.UpdateModelMixin,
        mixins.CreateModelMixin,
        viewsets.GenericViewSet):

    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.ProjectSerializer
    queryset = models.Project.objects.all()
    lookup_field = 'name'

    def get_object(self):
        customer = self.request.query_params.get('customer')
        version = self.request.query_params.get('version')
        name = self.kwargs['name']

        print(customer, name, version)
        if version is not None:
            print('check', version)
            q = models.Project.objects.all().filter(name=name, customer=customer, version=version).first()
        else:
            q = models.Project.objects.all().filter(name=name, customer=customer).order_by('-id').first()
        # q = get_object_or_404(models.Project, name=name, customer=customer)
        return q


class ProjectDistinctViewSet(
        AutoPrefetchViewSetMixin,
        mixins.ListModelMixin,
        viewsets.GenericViewSet):

    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )

    serializer_class = serializers.ProjectDistinctSerializer
    queryset = models.Project.objects.all()

    def get_queryset(self):
        customer = self.request.query_params.get('customer')
        name = self.request.query_params.get('name')
        # print(customer, name,)

        qs = []
        if customer and name:
            qs = models.Project.objects.all().distinct('name', 'customer').order_by('name')
            qs = qs.filter(customer=customer, name__icontains=name)
        return qs


class ProjectVersionsViewSet(
        AutoPrefetchViewSetMixin,
        mixins.ListModelMixin,
        viewsets.GenericViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )

    serializer_class = serializers.ProjectDistinctSerializer
    queryset = models.Project.objects.all()

    def get_queryset(self):
        customer = self.request.query_params.get('customer')
        name = self.request.query_params.get('name')
        qs = []
        if customer and name:
            qs = models.Project.objects.all().order_by('id')
            qs = qs.filter(customer=customer, name=name)
        return qs
