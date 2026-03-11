# OWASP WSTG Guided Walkthrough Platform

The OWASP Web Security Testing Guide (WSTG) Platform is a collaborative project management and reporting tool built to assist security professionals in conducting structured web application penetration tests based on the WSTG framework.

## Architecture

This application uses a decoupled architecture with a Django backend providing a RESTful API, and a React frontend built with Vite.

- **Backend**: Django & Django REST Framework (Python)
- **Frontend**: React & Vite (JavaScript)
- **Database**: SQLite (Default) 

## Prerequisites

Before setting up the project, ensure you have the following installed:
- Python 3.10+
- Node.js 18+
- npm (Node Package Manager)

## Configuration & Setup

### 1. Backend Setup

The backend requires environment variables to securely handle configuration. 

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

Create a `.env` file in the `backend/` directory with the following variables:
```ini
# backend/.env

# Security Settings
# Generate a secure key for production!
SECRET_KEY=your-super-secret-django-key-change-this
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Cookie Settings (Set to True in Production with HTTPS)
SECURE_COOKIES=False

# CORS Origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Apply database migrations:
```bash
python manage.py migrate
```

(Optional) Create a superuser account for the admin panel:
```bash
python manage.py createsuperuser
```

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
```

Install the Node dependencies:
```bash
npm install
```

*(Optional)* The frontend will automatically route requests to `http://localhost:8000/api/` by default. If your backend is hosted elsewhere, you can configure the API URL by creating a `.env` file in the `frontend/` directory:
```ini
# frontend/.env
VITE_API_URL=http://your-custom-backend.com/api/
```

## Running the Application

### Local Quickstart

You can launch both the frontend and backend servers simultaneously using the provided startup script in the root directory:

**Windows:**
```bat
start_app.bat
```
This script will start both servers in the background within the same terminal window. You can stop both by pressing `Ctrl+C`.

### Manual Startup

If you prefer to run them separately:

**Backend:**
```bash
cd backend
.\.venv\Scripts\activate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- **Frontend App**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

## Vulnerability Scanning / Dependency Check

If you are using the OWASP Dependency-Check tool, you can execute the `start_dc.bat` script. Be sure to edit the file to point to your local installation paths and provide your NVD API key either as an environment variable or directly in the script before running.
