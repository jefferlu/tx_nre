from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt import views as jwt_views

from . import views


class OptionalSlashRouter(DefaultRouter):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = '/?'


router = OptionalSlashRouter()
# router.register(r'choices', views.ChoicesViewSet, basename='choices')
router.register(r'chambers', views.ChamberViewSet)
router.register(r'items', views.ItemViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'projects', views.ProjectDistinctViewSet)
router.register(r'project-versions', views.ProjectVersionsViewSet)
router.register(r'project', views.ProjectViewSet)
# router.register(r'projects/(?P<project>\w+)/(?P<customer>\d+)/', views.ProjectViewSet)

urlpatterns = [
    path('login', views.TokenObtainView.as_view(), name='token_obtain_pair'),
    path('token/refresh', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),

    path('', include(router.urls)),
]
