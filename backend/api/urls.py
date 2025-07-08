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
router.register(r'users', views.UserViewSet)
router.register(r'chambers', views.ChamberViewSet)
router.register(r'items', views.ItemViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'projects', views.ProjectDistinctViewSet, basename='projects')
router.register(r'project-versions', views.ProjectVersionsViewSet, basename='project-versions')
router.register(r'project', views.ProjectViewSet, basename='project')
router.register(r'project-history', views.ProjectHistoryViewSet, basename='project-history')
router.register(r'project_delete', views.ProjectDeleteViewSet, basename='project_delete')
router.register(r'analytics', views.AnalyticsViewSet, basename='analytics')

# router.register(r'projects/(?P<project>\w+)/(?P<customer>\d+)/', views.ProjectViewSet)

urlpatterns = [
    path('login', views.TokenObtainView.as_view(), name='token_obtain_pair'),
    path('reset_password', views.PasswordResetView.as_view(), name='reset_password'),
    path('token/refresh', jwt_views.TokenRefreshView.as_view(), name='token_refresh'),

    path('', include(router.urls)),
]
