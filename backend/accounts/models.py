from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

from .managers import CustomUserManager


class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(max_length=30, blank=True, null=True, verbose_name='使用者名稱')
    db = models.CharField(max_length=10)
    session_id = models.CharField(max_length=30, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email
