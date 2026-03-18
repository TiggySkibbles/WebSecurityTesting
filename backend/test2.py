import io
import os
import sys
from xhtml2pdf import pisa

img_path = None
for root, dirs, files in os.walk(r'c:\Users\Tiggy\.dev\wstg_webapp\backend\media'):
    for f in files:
        if f.lower().endswith('.png'):
            img_path = os.path.abspath(os.path.join(root, f))
            break
    if img_path: break

if not img_path:
    print("No PNG found in media")
    sys.exit(0)

print('Found image:', img_path)

# Test 1: raw Windows path
html1 = f'<html><body><img src="{img_path}" /></body></html>'
pdf1 = pisa.pisaDocument(io.BytesIO(html1.encode('UTF-8')), io.BytesIO())
print('Raw path err:', pdf1.err)

# Test 2: URI path
uri_path = 'file:///' + img_path.replace('\\', '/')
html2 = f'<html><body><img src="{uri_path}" /></body></html>'
pdf2 = pisa.pisaDocument(io.BytesIO(html2.encode('UTF-8')), io.BytesIO())
print('URI path err:', pdf2.err)
