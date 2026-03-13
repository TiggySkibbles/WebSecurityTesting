FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Start Gunicorn server
CMD ["gunicorn", "wstg_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
