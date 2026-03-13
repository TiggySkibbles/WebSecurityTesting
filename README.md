# OWASP WSTG Guided Walkthrough Platform

The OWASP Web Security Testing Guide (WSTG) Platform is a collaborative project management and reporting tool built to assist security professionals in conducting structured web application penetration tests based on the WSTG framework.

## Architecture

This application uses a single-origin architecture. Django serves both the RESTful API and the vanilla JavaScript frontend as static files — no build step, no bundler, no npm required.

- **Backend**: Django & Django REST Framework (Python)
- **Frontend**: Vanilla JavaScript SPA (no framework, no build step)
- **Static Files**: Served via WhiteNoise
- **Database**: SQLite (Default)

## Prerequisites

Before setting up the project, ensure you have the following installed:
- Python 3.10+

> **Note:** Node.js and npm are **not required**. The frontend is pure vanilla JS served directly by Django.

## Configuration & Setup

### 1. Environment Setup

An automated setup script is provided to generate secure initial `.env` files for the backend.

Run the environment setup script from the root of the project:
```bash
python setup_env.py
```

Note: If you are uncomfortable using the automated script, you can manually create the `.env` files by copying the `.env.example` files to `.env` and filling in the values.

### 2. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment:
```bash
python -m venv .venv

# Activate on Windows
.\.venv\Scripts\activate
# Activate on Linux/macOS
source .venv/bin/activate
```

Install the dependencies:
```bash
pip install -r requirements.txt
```

Apply database migrations:
```bash
python manage.py migrate
```

Collect static files (frontend assets + Django admin):
```bash
python manage.py collectstatic --noinput
```

(Optional) Create a superuser account for the admin panel:
```bash
python manage.py createsuperuser
```

## Running the Application

### Local Quickstart (Recommended)

If you prefer to run the application natively on your system, use the provided startup script in the root directory:

**Windows:**
```bat
start_app.bat
```
This script collects static files and starts the Django server. You can stop it by pressing `Ctrl+C`.

### Manual Startup

```bash
cd backend
.\.venv\Scripts\activate
python manage.py collectstatic --noinput
python manage.py runserver
```

The application will be available at:
- **Application**: http://localhost:8000
- **API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

### Docker Quickstart (Untested)

Ensure you have Docker Desktop (Windows/Mac) or Docker Engine and Compose installed.

From the root directory, simply run:
```bash
docker compose up -d --build
```

The application will be available at:
- **Application**: http://localhost:8000
- **API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

To stop the containers:
```bash
docker compose down
```

## Project Structure

```
wstg_webapp/
├── backend/                  # Django backend
│   ├── api/                  # REST API app
│   ├── wstg_backend/         # Django project settings
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   └── static/               # Vanilla JS frontend (served by Django)
│       ├── index.html         # SPA entry point
│       ├── css/style.css      # Application styles
│       ├── js/
│       │   ├── app.js         # Router & auth state
│       │   ├── api.js         # fetch()-based API client
│       │   ├── utils.js       # DOM helpers, SVG icons
│       │   ├── pages/         # Page modules
│       │   └── components/    # Reusable component modules
│       └── vendor/
│           └── purify.min.js  # DOMPurify 3.3.3 (vendored)
├── frontend-old/             # Archived React/Vite frontend (reference only)
├── start_app.bat             # Windows startup script
├── docker-compose.yml
└── setup_env.py
```

## Security

- **XSS Protection**: User-facing HTML is sanitized via vendored DOMPurify 3.3.3
- **CSRF**: All mutating API calls include the `X-CSRFToken` header from the CSRF cookie
- **Content Security Policy**: Enforced via `<meta>` tag in `index.html`
- **Evidence Files**: Served through a Django view with authentication checks, not directly from the filesystem
- **URL Sanitization**: All external URLs are validated to `http:`/`https:` protocols only