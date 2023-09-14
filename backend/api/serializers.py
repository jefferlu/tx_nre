import datetime

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

from db import models


class TokenObtainSerializer(TokenObtainPairSerializer):

    @classmethod
    def get_token(self, user):

        token = super().get_token(user)

        # Add custom claims
        # token['name'] = user.username
        return token

    def validate(self, attrs):

        data = super().validate(attrs)
        data['user'] = {
            "name": self.user.email,
            "email": self.user.email,
        }
        return data


# class ChoicesSerializer(serializers.Serializer):
#     lab_locations = serializers.ReadOnlyField()

class ChamberSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Chamber
        fields = '__all__'


class FeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Fee
        fields = '__all__'


class ItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Item
        fields = '__all__'
        # extra_kwargs = {'id': {'read_only': False, 'required': False}}

# class ItemListSerializer(serializers.ListSerializer):
#     child = ItemSerializer()    # child is keyword
#     # create or update

#     def create(self, validated_data):

#         items = []
#         for item_data in validated_data:
#             item_id = item_data.get('id')

#             if item_id:
#                 item_instance = models.Item.objects.get(id=item_id)
#                 serializer = ItemSerializer(item_instance, data=item_data)
#             else:
#                 serializer = ItemSerializer(data=item_data)

#             if serializer.is_valid():
#                 serializer.save()
#                 items.append(serializer.data)
#             # item, created = item_serializer.Meta.model.objects.get_or_create(id=item_id, defaults=item_data)
#             # if not created:
#             #     item_serializer.update(item, item_data)

#         sorted_items = sorted(items, key=lambda x: x['name'])  # sort by name
#         return sorted_items


class RecordSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Record
        fields = '__all__'
        extra_kwargs = {'id': {'read_only': False, 'required': False}}


class TestItemSerializer(serializers.ModelSerializer):
    record = serializers.ReadOnlyField(default={
        'walk_in': False,
        'concept_test_uut': None, 'concept_need_test': False, 'concept_regression_rate': None,
        'bu_test_uut': None, 'bu_need_test': False, 'bu_regression_rate': None,
        'ct_test_uut': None, 'ct_need_test': False, 'ct_regression_rate': None,
        'nt_test_uut': None, 'nt_need_test': False, 'nt_regression_rate': None,
        'ot_test_uut': None, 'ot_need_test': False, 'ot_regression_rate': None,
    })

    item_name = serializers.ReadOnlyField(source='item.name')
    equip_working_hours = serializers.ReadOnlyField(source='item.equip_working_hours')
    man_working_hours = serializers.ReadOnlyField(source='item.man_working_hours')

    # lab_location = serializers.SerializerMethodField()

    # fees = FeeSerializer(many=True)
    fee = serializers.SerializerMethodField()

    class Meta:
        model = models.TestItem
        fields = '__all__'

    # def get_lab_location(self, obj):
    #     return dict(models.TestItem.LAB_LOCATION).get(obj.lab_location)

    def get_fee(self, test_item):
        year = datetime.date.today().year
        try:
            q = models.Fee.objects.filter(test_item=test_item, year=year)
            serializer = FeeSerializer(instance=q, many=True)
            return serializer.data
        except ObjectDoesNotExist:
            return None


class FunctionSerializer(serializers.ModelSerializer):

    # test_items = TestItemSerializer(many=True)
    test_items = serializers.SerializerMethodField()

    class Meta:
        model = models.Function
        fields = '__all__'

    def get_test_items(self, function):
        qs = models.TestItem.objects.filter(function=function).order_by('order')
        serializer = TestItemSerializer(instance=qs, many=True, read_only=True)
        return serializer.data


class CustomerSerializer(serializers.ModelSerializer):
    functions = serializers.SerializerMethodField()

    class Meta:
        model = models.Customer
        fields = '__all__'

    def get_functions(self, customer):
        qs = models.Function.objects.filter(customer=customer)
        serializer = FunctionSerializer(instance=qs, many=True, read_only=True)
        return serializer.data


class ProjectSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')
    records = RecordSerializer(many=True)

    class Meta:
        model = models.Project
        fields = '__all__'

    # def create(self, validated_data):
    #     records_data = validated_data.pop('records', None)
    #     project_instance = models.Project.objects.create(**validated_data)

    #     if records_data is not None:
    #         for r in records_data:
    #             r['test_item'] = r['test_item'].id
    #             serializer = RecordSerializer(data=r)

    #             if serializer.is_valid():
    #                 serializer.save(project=project_instance)

    #     return project_instance

    # def update(self, instance, validated_data):
    #     records_data = validated_data.pop('records', None)

    #     if records_data is not None:
    #         for r in records_data:
    #             # validated_data後，records_data['project']、records_data['text_item']會序被序列化
    #             if r.get('project', None) is not None:
    #                 r['project'] = r.get('project', None).id

    #             r['test_item'] = r.get('test_item').id  # validated_data後的test_item是record instance，必須改為id才能正確建立關聯

    #             record_id = r.get('id', None)

    #             if record_id:
    #                 record_instance = models.Record.objects.get(id=record_id, project=instance)
    #                 serializer = RecordSerializer(record_instance, data=r)
    #                 if serializer.is_valid():
    #                     serializer.save()
    #             else:
    #                 serializer = RecordSerializer(data=r)

    #                 if serializer.is_valid():
    #                     serializer.save(project=instance)

    #     return super().update(instance, validated_data)
        # return instance


class ProjectDistinctSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.name')

    class Meta:
        model = models.Project
        fields = '__all__'
