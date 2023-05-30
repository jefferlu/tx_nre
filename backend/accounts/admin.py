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
    list_display = ('username', 'first_name', 'email', 'is_staff', 'is_active', 'is_superuser', 'db', 'last_login', 'date_joined', )
    list_filter = ('username', 'email', 'is_staff', 'is_active',)

    fieldsets = (
        # *UserAdmin.fieldsets,
        (None, {'fields': ('username', 'password', 'db',)}),
        # (_('Personal info'), {'fields': ('first_name', 'email',)}),
        # (_('Permissions'), {
        #  'fields': ('is_staff', 'is_active', 'is_superuser',)}),
        # (_('Important dates'),
        #  {'fields': ('last_login', 'date_joined',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2',  'email', 'db', 'is_staff', 'is_active', 'is_superuser',)}
         ),
    )
    search_fields = ('username',)
    ordering = ('username',)

    def get_db(self, obj):
        # return "\n".join([d.name for d in obj.db.all()])
        return obj
