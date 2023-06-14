from django.contrib import admin

from . import models


@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    # list_display = ('name', 'gender', 'nationality',  'cost_centers', 'shift_schedule', 'organizational_unit',
    #                 'department', 'department_attributes', 'room', 'duty_status', 'isolated_date', 'release_date', 'on_duty_date',)
    list_display = ('name', 'power_ratio',)


@admin.register(models.Customer)
class CustomerAdmin(admin.ModelAdmin):
    # list_display = ('name', 'gender', 'nationality',  'cost_centers', 'shift_schedule', 'organizational_unit',
    #                 'department', 'department_attributes', 'room', 'duty_status', 'isolated_date', 'release_date', 'on_duty_date',)
    list_display = ('name', )


@admin.register(models.Function)
class FunctionAdmin(admin.ModelAdmin):
    # list_display = ('name', 'gender', 'nationality',  'cost_centers', 'shift_schedule', 'organizational_unit',
    #                 'department', 'department_attributes', 'room', 'duty_status', 'isolated_date', 'release_date', 'on_duty_date',)
    list_display = ('customer', 'name', 'order', )


@admin.register(models.TestItem)
class TestItemAdmin(admin.ModelAdmin):
    # list_display = ('name', 'gender', 'nationality',  'cost_centers', 'shift_schedule', 'organizational_unit',
    #                 'department', 'department_attributes', 'room', 'duty_status', 'isolated_date', 'release_date', 'on_duty_date',)
    list_display = ('function', 'name', )


@admin.register(models.Record)
class RecordAdmin(admin.ModelAdmin):
    # list_display = ('name', 'gender', 'nationality',  'cost_centers', 'shift_schedule', 'organizational_unit',
    #                 'department', 'department_attributes', 'room', 'duty_status', 'isolated_date', 'release_date', 'on_duty_date',)
    list_display = ('test_item', 'concept_test_uut', 'concept_need_test', 'concept_regression_rate',)
