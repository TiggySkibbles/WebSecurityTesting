"""
URL configuration for wstg_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include, re_path
from api.views import serve_evidence
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('media/evidence/<path:path>', serve_evidence, name='serve_evidence'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# SPA catch-all: serve index.html for any path not matched above.
# This must be last so it doesn't shadow API or static file routes.
urlpatterns += [
    re_path(r'^(?!static/|media/).*$', TemplateView.as_view(template_name='index.html'), name='spa-entry'),
]
