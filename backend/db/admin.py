from django.contrib import admin

from . import models


@admin.register(models.Chamber)
class ChamberAdmin(admin.ModelAdmin):
    list_display = ('name', 'capacity', 'amount',)


@admin.register(models.Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('no', 'name', 'man_working_hours', 'equip_working_hours', 'order', 'created_at', 'updated_at',)


@admin.register(models.Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at', 'updated_at', )


@admin.register(models.Function)
class FunctionAdmin(admin.ModelAdmin):
    list_display = ('customer', 'name', 'order', )


@admin.register(models.TestItem)
class TestItemAdmin(admin.ModelAdmin):
    list_display = ('function', 'item', 'lab_location', 'order')


@admin.register(models.Fee)
class FeeAdmin(admin.ModelAdmin):
    list_display = ('test_item', 'chamber', 'year', 'amount',)


@admin.register(models.Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'customer', 'version', 'power_ratio', 'man_hrs', 'equip_hrs', 'fees', 'created_at', 'updated_at',)


@admin.register(models.Record)
class RecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'test_item', 'project', 'walk_in', 'concept_test_uut',
                    'concept_need_test', 'concept_regression_rate',)


@admin.register(models.ProjectHistory)
class ProjectHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'user', 'action', 'created_at', 'updated_at', )
