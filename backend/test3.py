import os
import sys
import django
import io
from xhtml2pdf import pisa

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wstg_backend.settings')
django.setup()

from core.models import Project
from api.views import ProjectViewSet
from django.template.loader import render_to_string

project = Project.objects.first()
if not project:
    print("No project found.")
    sys.exit(0)

print(f"Testing on project {project.id}")
view = ProjectViewSet()
from django.http import HttpRequest
from django.contrib.auth import get_user_model

request = HttpRequest()
request.user = project.owner
view.request = request
data = view._get_export_data(project, vulnerable_only=True)
print("Data gathered.")
try:
    html_string = render_to_string('export/report_pdf.html', {'report': data})
    print("HTML rendered. Length:", len(html_string))
    
    result_bytes = io.BytesIO()
    pdf = pisa.pisaDocument(io.BytesIO(html_string.encode("UTF-8")), result_bytes)
    print("PDF generated. Error count:", pdf.err)
except Exception as e:
    import traceback
    traceback.print_exc()
