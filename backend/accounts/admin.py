from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

from .forms import CustomUserCreationForm, CustomUserChangeForm
from . import models


@admin.register(models.User)
class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = models.User
    list_display = ('email', 'username', 'first_name', 'is_staff',
                    'is_active', 'is_superuser',  'last_login', 'date_joined', )
    list_filter = ('username', 'email', 'is_staff', 'is_active',)

    # 定義在編輯使用者時顯示的字段
    fieldsets = (
        # *UserAdmin.fieldsets,
        (None, {'fields': ('username', 'password',
         'is_staff', 'is_active', 'is_superuser',)}),
        # (_('Personal info'), {'fields': ('first_name', 'email',)}),
        # (_('Permissions'), {
        #  'fields': ('is_staff', 'is_active', 'is_superuser',)}),
        # (_('Important dates'),
        #  {'fields': ('last_login', 'date_joined',)}),
    )

    # 定義在建立使用者時顯示的字段
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2',  'email', 'is_staff', 'is_active', 'is_superuser',)}
         ),
    )
    search_fields = ('username',)
    ordering = ('username',)

    def get_db(self, obj):
        # return "\n".join([d.name for d in obj.db.all()])
        return obj
