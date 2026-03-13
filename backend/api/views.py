from rest_framework import serializers, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse, JsonResponse, FileResponse, Http404
from django.template.loader import render_to_string
from datetime import datetime
import json
import zipfile
import io
import os
try:
    from xhtml2pdf import pisa
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.contrib.auth.decorators import login_required
from django.conf import settings
from rest_framework.throttling import AnonRateThrottle
from core.models import Project, ProjectShare, WSTGCategory, WSTGTest, TestExecution, Evidence
from .serializers import (
    ProjectSerializer, ProjectShareSerializer, 
    WSTGCategorySerializer, TestExecutionSerializer, EvidenceSerializer,
    RegisterSerializer, UserSerializer
)
from rest_framework.exceptions import PermissionDenied

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def user(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    @method_decorator(ensure_csrf_cookie)
    def csrf(self, request):
        return JsonResponse({'detail': 'CSRF cookie set'})

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            django_login(request, user)
            return JsonResponse({'detail': 'Successfully logged in', 'username': user.username})
        else:
            return JsonResponse({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        django_logout(request)
        return JsonResponse({'detail': 'Successfully logged out'})

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Optionally log them in immediately
            django_login(request, user)
            return JsonResponse({
                'detail': 'User created successfully',
                'username': user.username
            }, status=status.HTTP_201_CREATED)
        return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can see projects they own OR projects shared with them
        user = self.request.user
        return Project.objects.filter(
            Q(owner=user) | Q(shares__user=user)
        ).distinct()

    def perform_create(self, serializer):
        project = serializer.save(owner=self.request.user)
        # Auto-create TestExecutions for all WSTG tests
        tests = WSTGTest.objects.all()
        executions_to_create = [
            TestExecution(project=project, test=test, status='NOT_STARTED')
            for test in tests
        ]
        if executions_to_create:
            TestExecution.objects.bulk_create(executions_to_create)

    def perform_update(self, serializer):
        if self.get_object().owner != self.request.user:
            raise PermissionDenied("Only the project owner can edit this assessment.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owner != self.request.user:
            raise PermissionDenied("Only the project owner can delete this assessment.")
        instance.delete()

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        project = self.get_object()
        
        if project.owner != request.user:
            return Response({'error': 'Only the owner can share projects'}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = ProjectShareSerializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data['user'].id
            access_level = serializer.validated_data['access_level']
            
            share, created = ProjectShare.objects.update_or_create(
                project=project,
                user_id=user_id,
                defaults={'access_level': access_level}
            )
            return Response(ProjectShareSerializer(share).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _get_export_data(self, project, vulnerable_only=False):
        # Helper to format data for export
        categories = WSTGCategory.objects.all().prefetch_related('tests')
        executions = TestExecution.objects.filter(project=project).select_related('test')
        
        exec_map = {e.test_id: e for e in executions}
        
        data = []
        summary = []
        for cat in categories:
            cat_tests = []
            pass_count = 0
            fail_count = 0
            
            for test in cat.tests.all():
                ex = exec_map.get(test.id)
                if not ex: continue
                
                if ex.status == 'PASS': pass_count += 1
                elif ex.status == 'FAIL': fail_count += 1
                
                if vulnerable_only and ex.status != 'FAIL':
                    continue
                    
                cat_tests.append({
                    'ref_id': test.ref_id,
                    'name': test.name,
                    'status': ex.status,
                    'notes': ex.notes,
                    'evidence': [
                        {
                            'description': ev.description,
                            'filename': ev.original_filename or os.path.basename(ev.file.path),
                            'zip_path': f"{cat.ref_id}/{test.ref_id.split('-')[-1]}/{ev.original_filename or os.path.basename(ev.file.path)}"
                        } for ev in ex.evidence.all() if ev.file and os.path.exists(ev.file.path)
                    ]
                })
            
            total_active = pass_count + fail_count # Or use all tests in cat? 
            # User example showed 3 Pass, 7 Fail, 10 Total. 
            # So Total is Pass + Fail + others? Or just all tests in category?
            # Let's use all tests that have an execution record.
            cat_total = sum(1 for test in cat.tests.all() if test.id in exec_map)
            
            if cat_total > 0:
                summary.append({
                    'section': cat.ref_id,
                    'pass': pass_count,
                    'fail': fail_count,
                    'total': cat_total
                })

            if cat_tests:
                data.append({
                    'category': cat.name,
                    'ref_id': cat.ref_id,
                    'tests': cat_tests
                })
        
        return {
            'project_name': project.name,
            'target_url': project.target_url,
            'owner_name': project.owner.get_full_name() or project.owner.username,
            'user_name': self.request.user.get_full_name() or self.request.user.username,
            'date': project.created_at.strftime("%Y-%m-%d"),
            'export_date': datetime.now().strftime("%Y-%m-%d"),
            'summary': summary,
            'categories': data
        }

    @action(detail=True, methods=['get'])
    def export_json(self, request, pk=None):
        project = self.get_object()
        data = self._get_export_data(project)
        return JsonResponse(data, json_dumps_params={'indent': 2})

    @action(detail=True, methods=['get'])
    def export_html(self, request, pk=None):
        project = self.get_object()
        data = self._get_export_data(project)
        html_string = render_to_string('export/report.html', {'report': data})
        return HttpResponse(html_string, content_type='text/html')

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, pk=None):
        if not PDF_AVAILABLE:
            return JsonResponse({'error': 'PDF generation is currently unavailable on this host due to missing dependencies.'}, status=status.HTTP_501_NOT_IMPLEMENTED)
            
        project = self.get_object()
        data = self._get_export_data(project, vulnerable_only=True)
        html_string = render_to_string('export/report_pdf.html', {'report': data})
        
        result_bytes = io.BytesIO()
        pdf = pisa.pisaDocument(io.BytesIO(html_string.encode("UTF-8")), result_bytes)
        
        if not pdf.err:
            response = HttpResponse(result_bytes.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="vulnerability_report_{project.id}.pdf"'
            return response
        return JsonResponse({'error': 'Failed to generate PDF.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def export_bundle(self, request, pk=None):
        project = self.get_object()
        data = self._get_export_data(project)
        
        # Render HTML report
        html_string = render_to_string('export/report.html', {'report': data})
        
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as zip_file:
            # Add HTML report
            zip_file.writestr('report.html', html_string)
            
            # Add evidence files
            executions = TestExecution.objects.filter(project=project).select_related('test', 'test__category').prefetch_related('evidence')
            for ex in executions:
                for ev in ex.evidence.all():
                    if ev.file and os.path.exists(ev.file.path):
                        category_ref = ex.test.category.ref_id
                        test_parts = ex.test.ref_id.split('-')
                        test_num = test_parts[-1] if len(test_parts) > 0 else ex.test.ref_id
                        
                        filename = ev.original_filename or os.path.basename(ev.file.path)
                        safe_filename = os.path.basename(filename)
                        arcname = f"{category_ref}/{test_num}/{safe_filename}"
                        zip_file.write(ev.file.path, arcname)
                        
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{project.name.replace(" ", "_")}_Bundle.zip"'
        return response

    @action(detail=True, methods=['get'])
    def export_evidence(self, request, pk=None):
        project = self.get_object()
        executions = TestExecution.objects.filter(project=project).select_related('test', 'test__category').prefetch_related('evidence')
        
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w') as zip_file:
            for ex in executions:
                for ev in ex.evidence.all():
                    if ev.file and os.path.exists(ev.file.path):
                        category_ref = ex.test.category.ref_id
                        # WSTG-INFO-01 -> We want "01" part
                        test_parts = ex.test.ref_id.split('-')
                        test_num = test_parts[-1] if len(test_parts) > 0 else ex.test.ref_id
                        
                        filename = ev.original_filename or os.path.basename(ev.file.path)
                        safe_filename = os.path.basename(filename)
                        arcname = f"{category_ref}/{test_num}/{safe_filename}"
                        zip_file.write(ev.file.path, arcname)
                        
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="evidence_{project.id}.zip"'
        return response


class WSTGCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WSTGCategory.objects.all().prefetch_related('tests')
    serializer_class = WSTGCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class TestExecutionViewSet(viewsets.ModelViewSet):
    serializer_class = TestExecutionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Allow access to executions if user owns the project or it is shared with them
        qs = TestExecution.objects.filter(
            Q(project__owner=user) | Q(project__shares__user=user)
        ).distinct()

        project_id = self.request.query_params.get('project_id')
        if project_id:
            qs = qs.filter(project_id=project_id)
            
        return qs

    def perform_update(self, serializer):
        # Double check edit access before saving
        instance = self.get_object()
        project = instance.project
        user = self.request.user
        
        has_edit_access = (project.owner == user) or ProjectShare.objects.filter(
            project=project, user=user, access_level='EDIT'
        ).exists()
        
        if not has_edit_access:
            raise serializers.ValidationError("You do not have edit access to this project")
            
        serializer.save()

    def perform_create(self, serializer):
        # We need the project ID to verify edit permissions
        project_id = self.request.data.get('project')
        user = self.request.user
        
        project = Project.objects.filter(id=project_id).first()
        if not project:
            raise serializers.ValidationError("Project not found")
            
        # Check edit rights
        if project.owner != user:
            share = ProjectShare.objects.filter(project=project, user=user).first()
            if not share or share.access_level != 'EDIT':
                raise serializers.ValidationError("You do not have edit access to this project")
                
        serializer.save(project=project)


class EvidenceViewSet(viewsets.ModelViewSet):
    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        execution_id = self.request.query_params.get('execution_id')
        if execution_id:
            user = self.request.user
            return Evidence.objects.filter(
                test_execution_id=execution_id
            ).filter(
                Q(test_execution__project__owner=user) | 
                Q(test_execution__project__shares__user=user)
            ).distinct()
        return Evidence.objects.none()

    def perform_create(self, serializer):
        execution_id = self.request.data.get('test_execution')
        try:
            execution = TestExecution.objects.get(id=execution_id)
        except TestExecution.DoesNotExist:
            raise serializers.ValidationError("Test Execution not found")
            
        # Check permissions via project
        project = execution.project
        user = self.request.user
        
        if project.owner != user:
            share = ProjectShare.objects.filter(project=project, user=user).first()
            if not share or share.access_level != 'EDIT':
                raise serializers.ValidationError("You do not have edit access to this project")
                
        file_obj = self.request.data.get('file')
        original_filename = file_obj.name if file_obj else None
        serializer.save(test_execution=execution, original_filename=original_filename)

@login_required
def serve_evidence(request, path):
    user = request.user
    # The URL pattern 'media/evidence/<path>' captures everything after 'media/evidence/',
    # but the FileField stores the path relative to MEDIA_ROOT as 'evidence/YYYY/MM/DD/uuid.ext'.
    # Use forward slashes for the DB lookup (Django always stores with /) 
    # and os.path.join for the actual filesystem path.
    file_field_path = 'evidence/' + path
    evidence = Evidence.objects.filter(file=file_field_path).first()
    if not evidence:
        raise Http404("Evidence not found")

    # Check permissions
    project = evidence.test_execution.project
    has_access = (project.owner == user) or ProjectShare.objects.filter(
        project=project, user=user
    ).exists()

    if not has_access:
        raise Http404("Evidence not found")

    file_path = os.path.join(settings.MEDIA_ROOT, *file_field_path.split('/'))
    if os.path.exists(file_path):
        return FileResponse(open(file_path, 'rb'))
    raise Http404("File not found on disk")
