
from django.conf import settings
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from pprint import pprint


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
