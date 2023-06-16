
from django.conf import settings

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
        print('-->', self.user)
        data['user'] = {
            "name": self.user.email,
            "email": self.user.email,
        }
        return data


class RecordSerializer(serializers.ModelSerializer):

    class Meta:
        model = models.Record
        fields = '__all__'


class TestItemSerializer(serializers.ModelSerializer):
    record = serializers.ReadOnlyField(default={
        'concept_test_uut': None, 'concept_need_test': False, 'concept_regression_rate': None,
        'bu_test_uut': None, 'bu_need_test': False, 'bu_regression_rate': None,
        'ct_test_uut': None, 'ct_need_test': False, 'ct_regression_rate': None,
        'nt_test_uut': None, 'nt_need_test': False, 'nt_regression_rate': None,
        'ot_test_uut': None, 'ot_need_test': False, 'ot_regression_rate': None,
    })

    class Meta:
        model = models.TestItem
        fields = '__all__'

    # def get_records(self, test_item):
    #     qs = models.Record.objects.filter(test_item=test_item)
    #     serializer = RecordSerializer(instance=qs, many=True, read_only=True)
    #     return serializer.data


class FunctionSerializer(serializers.ModelSerializer):

    test_items = serializers.SerializerMethodField()

    class Meta:
        model = models.Function
        fields = '__all__'

    def get_test_items(self, function):
        qs = models.TestItem.objects.filter(function=function)
        serializer = TestItemSerializer(instance=qs, many=True, read_only=True)
        return serializer.data


class CustomerSerializer(serializers.ModelSerializer):
    functions = serializers.SerializerMethodField()

    class Meta:
        model = models.Customer
        fields = '__all__'

    def get_functions(self, customer):
        print('function-->', self)
        qs = models.Function.objects.filter(customer=customer)
        serializer = FunctionSerializer(instance=qs, many=True, read_only=True)
        return serializer.data


class ProjectSerializer(serializers.ModelSerializer):
    records = serializers.SerializerMethodField()

    class Meta:
        model = models.Project
        fields = '__all__'

    def get_records(self, project):
        qs = models.Record.objects.filter(project=project)
        serializer = RecordSerializer(instance=qs, many=True, read_only=True)
        return serializer.data
