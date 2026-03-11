from django.contrib import admin
from .models import Project, ProjectShare, WSTGCategory, WSTGTest, TestExecution, Evidence

admin.site.register(Project)
admin.site.register(ProjectShare)
admin.site.register(WSTGCategory)
admin.site.register(WSTGTest)
admin.site.register(TestExecution)
admin.site.register(Evidence)
