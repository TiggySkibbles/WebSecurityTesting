from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_delete
from django.dispatch import receiver
import uuid
import os
from datetime import datetime

def evidence_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    new_filename = f"{uuid.uuid4()}{ext}"
    date_path = datetime.now().strftime('evidence/%Y/%m/%d/')
    return date_path + new_filename

class Project(models.Model):
    name = models.CharField(max_length=255)
    target_url = models.URLField(max_length=500, blank=True, null=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class ProjectShare(models.Model):
    ACCESS_CHOICES = (
        ('READ', 'Read Only'),
        ('EDIT', 'Edit'),
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='shares')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_projects')
    access_level = models.CharField(max_length=4, choices=ACCESS_CHOICES, default='READ')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'user')

    def __str__(self):
        return f"{self.project.name} shared with {self.user.username} ({self.access_level})"

class WSTGCategory(models.Model):
    ref_id = models.CharField(max_length=50, unique=True) # e.g. WSTG-INFO
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.ref_id}: {self.name}"

class WSTGTest(models.Model):
    category = models.ForeignKey(WSTGCategory, on_delete=models.CASCADE, related_name='tests')
    ref_id = models.CharField(max_length=50, unique=True) # e.g. WSTG-INFO-01
    name = models.CharField(max_length=500)
    reference_url = models.URLField(max_length=1000, blank=True, null=True)

    def __str__(self):
        return f"{self.ref_id}: {self.name}"

class TestExecution(models.Model):
    STATUS_CHOICES = (
        ('NOT_STARTED', 'Not Started'),
        ('PASS', 'Pass'),
        ('FAIL', 'Fail'),
        ('NA', 'Not Applicable'),
    )
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='test_executions')
    test = models.ForeignKey(WSTGTest, on_delete=models.CASCADE, related_name='executions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')
    notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'test')

    def __str__(self):
        return f"{self.project.name} - {self.test.ref_id} ({self.status})"

class Evidence(models.Model):
    test_execution = models.ForeignKey(TestExecution, on_delete=models.CASCADE, related_name='evidence')
    file = models.FileField(upload_to=evidence_upload_path)
    original_filename = models.CharField(max_length=255, blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Evidence for {self.test_execution.test.ref_id}"

@receiver(post_delete, sender=Evidence)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    """
    Deletes file from filesystem
    when corresponding `Evidence` object is deleted.
    Also cleans up empty parent directories.
    """
    if instance.file:
        file_path = instance.file.path
        if os.path.isfile(file_path):
            os.remove(file_path)
        
        # Clean up empty parent directories
        dir_path = os.path.dirname(file_path)
        from django.conf import settings
        media_root = os.path.abspath(settings.MEDIA_ROOT)
        
        while dir_path and dir_path != media_root and dir_path.startswith(media_root):
            try:
                if not os.listdir(dir_path):
                    os.rmdir(dir_path)
                    dir_path = os.path.dirname(dir_path)
                else:
                    break
            except OSError:
                break
