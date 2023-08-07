from datetime import datetime

from django.http import Http404
from django.shortcuts import render
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db.models import Q, F, Count, Max, OuterRef, Subquery
from django.db.models.functions import ExtractYear

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


class ChamberViewSet(AutoPrefetchViewSetMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.ChamberSerializer
    queryset = models.Chamber.objects.all()


class ItemViewSet(AutoPrefetchViewSetMixin, viewsets.ModelViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.ItemSerializer
    # list_serializer_class = serializers.ItemListSerializer
    queryset = models.Item.objects.all().order_by('id')

    # def get_serializer_class(self):
    #     if self.action == 'create' and isinstance(self.request.data, list):
    #         return self.list_serializer_class
    #     return super().get_serializer_class()

    def get_queryset(self):
        query = self.request.query_params.get('query')
        qs = models.Item.objects.all().order_by('order')

        if query:
            qs = qs.filter(Q(no__icontains=query) | Q(name__icontains=query))

        return qs

    def create(self, request, *args, **kwargs):
        # get
        data = request.data

        # Categorize data into items to create and items to update
        # create_data = [item for item in data if 'id' not in item]
        # update_data = [item for item in data if 'id' in item]

        create_data = []
        update_data = []

        for item in data:
            if 'id' in item:
                update_data.append(item)
            else:
                try:
                    item['id'] = models.Item.objects.get(no=item['no']).id
                    update_data.append(item)
                except models.Item.DoesNotExist:
                    # 資料不存在的處理邏輯
                    create_data.append(item)

        created_objects = []
        if create_data:
            serializer = self.get_serializer(data=create_data, many=True)

            try:
                serializer.is_valid(raise_exception=True)
            except exceptions.ValidationError as e:
                return Response(e.get_full_details(), status=status.HTTP_400_BAD_REQUEST)

            created_objects = serializer.save()

        # Perform update actions
        if update_data:
            for item in update_data:
                instance = self.get_queryset().get(id=item['id'])
                serializer = self.get_serializer(instance, data=item, partial=True)

                if serializer.is_valid(raise_exception=True):
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

    def create(self, request, *args, **kwargs):
        data = request.data

        customer_name = data.get('name')
        functions_data = data.get('functions', [])

        # 檢查 Customer 是否存在
        customer, _ = models.Customer.objects.update_or_create(name=customer_name)

        # 處理 functions 數據
        for function_data in functions_data:
            function_name = function_data.get('name')
            test_items_data = function_data.get('test_items', [])

            # 檢查 Function 是否存在
            function, _ = models.Function.objects.update_or_create(customer=customer, name=function_name)

            # 處理 test_items 資料
            for test_item_data in test_items_data:
                item_name = test_item_data.get('item_name')
                print('-->', item_name)
                lab_location = test_item_data.get('lab_location')
                fee = test_item_data.get('fee')
                order = test_item_data.get('order')

            # 檢查 TestItem 是否存在
                try:
                    item = models.Item.objects.get(no=item_name.split()[0])
                except models.Item.DoesNotExist:
                    item = None

                if not item:
                    continue

                test_item, _ = models.TestItem.objects.update_or_create(function=function, item=item, lab_location=lab_location, defaults={'order': order})

                # Fee
                year = datetime.date.today().year
                fee, _ = models.Fee.objects.update_or_create(test_item=test_item, defaults={'year': year, 'amount': fee})
                print(test_item, test_item.order), test_item.lab_location

        # 返回新增的資料
        serializer = self.get_serializer(customer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectViewSet(AutoPrefetchViewSetMixin, viewsets.ModelViewSet):

    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )
    serializer_class = serializers.ProjectSerializer
    queryset = models.Project.objects.all()
    lookup_field = 'name'

    def create(self, request, *args, **kwargs):
        data = request.data
        records_data = data.pop('records', None)

        name = data.get('name')
        customer = get_object_or_404(models.Customer, id=data.get('customer'))  # 避免create時找不到，取得customer實體
        version = data.get('version')
        power_ratio = data.get('power_ratio')

        man_hrs = data.get('man_hrs')
        equip_hrs = data.get('equip_hrs')

        print(man_hrs, equip_hrs)

        # 檢查 專案版本 是否存在
        project, created = models.Project.objects.update_or_create(name=name, customer=customer, version=version, defaults={'power_ratio': power_ratio, 'man_hrs': man_hrs, 'equip_hrs': equip_hrs})

        for record_data in records_data:
            record_id = record_data.pop('id', None)

            if created:
                serializer = serializers.RecordSerializer(data=record_data)
            else:
                if record_id:
                    instance = models.Record.objects.get(id=record_id)
                    serializer = serializers.RecordSerializer(instance, data=record_data, partial=True)
                else:
                    serializer = serializers.RecordSerializer(data=record_data)

            if serializer.is_valid(raise_exception=True):
                serializer.save(project=project)  # 綁定project

        serializer = self.get_serializer(project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get_object(self):
        customer = self.request.query_params.get('customer')
        version = self.request.query_params.get('version')
        name = self.kwargs['name']

        if version is not None:
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

        qs = []
        if customer and name:
            qs = models.Project.objects.all().distinct('name', 'customer').order_by('name')
            qs = qs.filter(customer=customer, name__icontains=name)
        return qs

    def list(self, request, *args, **kwargs):
        print('list')
        return super().list(request, *args, **kwargs)


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


class AnalyticsViewSet(AutoPrefetchViewSetMixin, viewsets.ViewSet):
    if (not settings.DEBUG):
        permission_classes = (IsAuthenticated, )

    def list(self, request):
        year = self.request.query_params.get('year')
        if year is None:
            year = datetime.now().year

        instance = {
            'year': year,
            'nre_updates': self.get_project_version(year=year),
            'hrs': self.get_project_hrs(year=year),
        }

        return Response(instance)

    def get_project_version(self, year):

        queryset = models.Project.objects.filter(created_at__year=year).order_by('name').values('name').annotate(version_count=Count('version'))

        version_sum = 0
        for entry in queryset:
            version_sum += entry['version_count']

        return {
            'count': version_sum,
            'data': queryset
        }

    def get_project_hrs(self, year):

        latest_versions_subquery = models.Project.objects.filter(
            name=OuterRef('name'),
            created_at__year=year
        ).order_by('-created_at').values('id')[:1]  # id比created_at精準

        queryset = models.Project.objects.filter(
            created_at__year=year,
            id=Subquery(latest_versions_subquery),
            man_hrs__isnull=False,
            equip_hrs__isnull=False
        ).order_by('name').values('name', 'version', 'man_hrs', 'equip_hrs')

        man_hrs_sum = 0
        equip_hrs_sum = 0
        for entry in queryset:
            man_hrs_sum += entry['man_hrs']
            equip_hrs_sum += entry['equip_hrs']

        return {
            'man_hrs_sum': man_hrs_sum,
            'equip_hrs_sum': equip_hrs_sum,
            'data': queryset
        }
