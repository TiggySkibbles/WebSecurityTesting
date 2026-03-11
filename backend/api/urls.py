from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, WSTGCategoryViewSet, TestExecutionViewSet, EvidenceViewSet, AuthViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'categories', WSTGCategoryViewSet, basename='category')
router.register(r'test-executions', TestExecutionViewSet, basename='testexecution')
router.register(r'evidence', EvidenceViewSet, basename='evidence')

urlpatterns = [
    path('', include(router.urls)),
]
