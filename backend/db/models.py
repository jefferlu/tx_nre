from django.db import models


class Project(models.Model):
    name = models.CharField(max_length=120, verbose_name='name')
    power_ratio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,  verbose_name='power ratio')

    class Meta:
        db_table = 'nre_project'

    def __str__(self):
        return self.name


class Customer(models.Model):
    name = models.CharField(max_length=120, verbose_name='name')

    class Meta:
        db_table = 'nre_customer'

    def __str__(self):
        return '%s' % self.name


class Function(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name='customer')
    name = models.CharField(max_length=120, verbose_name='name')
    order = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'nre_function'

    def __str__(self):
        return '%s-%s' % (self.customer.name, self.name)


class TestItem(models.Model):
    function = models.ForeignKey(Function, on_delete=models.CASCADE, verbose_name='function')
    name = models.CharField(max_length=120, verbose_name='name')

    class Meta:
        db_table = 'nre_test_item'

    def __str__(self):
        return '%s-%s-%s' % (self.function.customer.name, self.function.name, self.name)


class Record(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, verbose_name='project')
    test_item = models.ForeignKey(TestItem, on_delete=models.CASCADE, verbose_name='test_item')

    concept_test_uut = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='concept_test_uut')
    concept_need_test = models.BooleanField(default=False, verbose_name='concept_need_test')
    concept_regression_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='concept_regression_rate')

    bu_test_uut = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='bu_test_uut')
    bu_need_test = models.BooleanField(default=False, verbose_name='bu_need_test')
    bu_regression_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='bu_regression_rate')

    ct_test_uut = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='ct_test_uut')
    ct_need_test = models.BooleanField(default=False, verbose_name='ct_need_test')
    ct_regression_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='ct_regression_rate')

    nt_test_uut = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='nt_test_uut')
    nt_need_test = models.BooleanField(default=False, verbose_name='nt_need_test')
    nt_regression_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='nt_regression_rate')

    ot_test_uut = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='ot_test_uut')
    ot_need_test = models.BooleanField(default=False, verbose_name='ot_need_test')
    ot_regression_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='ot_regression_rate')

    class Meta:
        db_table = 'nre_record'

    def __str__(self):
        return '%s-%s-%s' % (self.test_item.function.customer.name, self.test_item.function.name, self.test_item.name)
