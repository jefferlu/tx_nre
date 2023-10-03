from django.db import models


class Chamber(models.Model):
    name = models.CharField(max_length=120, verbose_name='name')
    capacity = models.IntegerField(verbose_name='capacity')
    amount = models.IntegerField(verbose_name='amount')


class Item(models.Model):
    no = models.CharField(max_length=500, verbose_name='no', unique=True)
    name = models.CharField(max_length=500, verbose_name='name')
    equip_working_hours = models.CharField(max_length=10, null=True, blank=True, verbose_name='equip_working_hours')
    man_working_hours = models.CharField(max_length=10, null=True, blank=True, verbose_name='man_working_hours')
    order = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='crated at')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='updated at')

    class Meta:
        db_table = 'nre_item'

    def __str__(self):
        return self.name


class Customer(models.Model):
    name = models.CharField(max_length=120, verbose_name='name', unique=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='crated at')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='updated at')

    class Meta:
        db_table = 'nre_customer'

    def __str__(self):
        return '%s' % self.name


class Function(models.Model):
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, verbose_name='customer')
    name = models.CharField(max_length=120, verbose_name='name')
    order = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'nre_function'

    def __str__(self):
        return '%s-%s' % (self.customer.name, self.name)


class TestItem(models.Model):

    function = models.ForeignKey(
        Function, on_delete=models.CASCADE, related_name='test_items', verbose_name='function')
    item = models.ForeignKey(
        Item, on_delete=models.CASCADE, verbose_name='item')
    lab_location = models.CharField(max_length=120, null=True, blank=True, verbose_name='lab_location')
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'nre_test_item'
        unique_together = ('function', 'item', 'lab_location',)

    def __str__(self):
        return '%s-%s-%s' % (self.function.customer.name, self.function.name, self.item.name)


class Fee(models.Model):
    test_item = models.ForeignKey(
        TestItem, on_delete=models.CASCADE, related_name='fees', verbose_name='fee')
    chamber = models.CharField(max_length=120, default='2K', verbose_name='chamber')
    year = models.IntegerField()
    amount = models.CharField(max_length=10, null=True, blank=True, verbose_name='amount')

    class Meta:
        db_table = 'nre_fee'


class Project(models.Model):
    name = models.CharField(max_length=520, verbose_name='name')
    version = models.CharField(max_length=120, verbose_name='version')
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, verbose_name='customer')
    power_ratio = models.CharField(max_length=10, null=True, blank=True, verbose_name='power ratio')
    man_hrs = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='man_hours')
    equip_hrs = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='equip_hours')
    fees = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='fees')

    rel_concept_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_concept_duration')
    rel_concept_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_concept_duty_rate')
    rel_bu_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_bu_duration')
    rel_bu_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_bu_duty_rate')
    rel_ct_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_ct_duration')
    rel_ct_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_ct_duty_rate')
    rel_nt_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_nt_duration')
    rel_nt_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_nt_duty_rate')
    rel_ot_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_ot_duration')
    rel_ot_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='rel_ot_duty_rate')

    sv_concept_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_concept_duration')
    sv_concept_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_concept_duty_rate')
    sv_bu_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_bu_duration')
    sv_bu_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_bu_duty_rate')
    sv_ct_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_ct_duration')
    sv_ct_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_ct_duty_rate')
    sv_nt_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_nt_duration')
    sv_nt_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_nt_duty_rate')
    sv_ot_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_ot_duration')
    sv_ot_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='sv_ot_duty_rate')

    pkg_concept_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_concept_duration')
    pkg_concept_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_concept_duty_rate')
    pkg_bu_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_bu_duration')
    pkg_bu_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_bu_duty_rate')
    pkg_ct_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_ct_duration')
    pkg_ct_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_ct_duty_rate')
    pkg_nt_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_nt_duration')
    pkg_nt_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_nt_duty_rate')
    pkg_ot_duration = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_ot_duration')
    pkg_ot_duty_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='pkg_ot_duty_rate')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='crated at')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='updated at')

    class Meta:
        db_table = 'nre_project'
        unique_together = ('customer', 'name', 'version',)

    def __str__(self):
        return '%s-%s-%s' % (self.customer.name, self.name, self.version)


class Record(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE,
                                verbose_name='project', related_name='records', null=True, blank=True)
    test_item = models.ForeignKey(
        TestItem, on_delete=models.CASCADE, verbose_name='test_item')
    walk_in = models.BooleanField(
        default=False, verbose_name='walk_in')

    concept_test_uut = models.IntegerField(
        null=True, blank=True, verbose_name='concept_test_uut')
    concept_need_test = models.BooleanField(
        default=False, verbose_name='concept_need_test')
    concept_regression_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='concept_regression_rate')

    bu_test_uut = models.IntegerField(
        null=True, blank=True, verbose_name='bu_test_uut')
    bu_need_test = models.BooleanField(
        default=False, verbose_name='bu_need_test')
    bu_regression_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='bu_regression_rate')

    ct_test_uut = models.IntegerField(
        null=True, blank=True, verbose_name='ct_test_uut')
    ct_need_test = models.BooleanField(
        default=False, verbose_name='ct_need_test')
    ct_regression_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='ct_regression_rate')

    nt_test_uut = models.IntegerField(
        null=True, blank=True, verbose_name='nt_test_uut')
    nt_need_test = models.BooleanField(
        default=False, verbose_name='nt_need_test')
    nt_regression_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='nt_regression_rate')

    ot_test_uut = models.IntegerField(
        null=True, blank=True, verbose_name='ot_test_uut')
    ot_need_test = models.BooleanField(
        default=False, verbose_name='ot_need_test')
    ot_regression_rate = models.CharField(max_length=10, null=True, blank=True, verbose_name='ot_regression_rate')

    class Meta:
        db_table = 'nre_record'
        # unique_together = ('project', 'test_item',)

    def __str__(self):
        return '%s-%s-%s' % (self.test_item.function.customer.name, self.test_item.function.name, self.test_item.item.name)


class ProjectHistory(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, verbose_name='project')
    data = models.JSONField()
    user = models.ForeignKey(to='accounts.User', on_delete=models.CASCADE, verbose_name='user')
    action = models.CharField(max_length=10, default='create')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='crated at')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='updated at')

    class Meta:
        db_table = 'nre_project_history'
