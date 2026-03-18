import io
import os
from xhtml2pdf import pisa

# create a dummy image
img_path = r"test_img.png"
with open(img_path, "wb") as f:
    # 1x1 png
    f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\xfc\xff\xff?\x03\x00\x06 \x01\xfe\xca\x90\x0e\x00\x00\x00\x00IEND\xaeB`\x82')

abs_img_path = os.path.abspath(img_path)

html = f'''
<html><body>
<h1>Test</h1>
<img src="{abs_img_path}" />
</body></html>
'''
print(html)
result_bytes = io.BytesIO()
pdf = pisa.pisaDocument(io.BytesIO(html.encode('UTF-8')), result_bytes)
print("Error count:", pdf.err)
if pdf.err:
    print("Failure occurred")
else:
    print("Success")
    with open("test.pdf", "wb") as f:
        f.write(result_bytes.getvalue())
