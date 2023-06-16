from django.contrib import admin

from . import models


@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'power_ratio',)


@admin.register(models.Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', )


@admin.register(models.Function)
class FunctionAdmin(admin.ModelAdmin):
    list_display = ('customer', 'name', 'order', )


@admin.register(models.TestItem)
class TestItemAdmin(admin.ModelAdmin):
    list_display = ('function', 'name', )


@admin.register(models.Record)
class RecordAdmin(admin.ModelAdmin):
    list_display = ('test_item', 'project', 'concept_test_uut', 'concept_need_test', 'concept_regression_rate',)
