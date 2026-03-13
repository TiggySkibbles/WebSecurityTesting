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

### 1. Environment Setup

An automated setup script is provided to generate secure initial `.env` files for both the frontend and backend. 

Run the environment setup script from the root of the project:
```bash
python setup_env.py
```

Note: If you are uncomfortable using the automated script, you can manually create the .env files by copying the .env.example files to .env and filling in the values.

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

The `setup_env.py` script automatically configures the frontend to route API requests to `http://localhost:8000/api/` locally. If your backend is hosted elsewhere, edit the `frontend/.env` file to update your `VITE_API_URL`.

## Running the Application

### Docker Quickstart (Recommended)

The easiest way to run the entire application stack is using Docker Compose. Ensure you have Docker Desktop (Windows/Mac) or Docker Engine and Compose installed.

From the root directory, simply run:
```bash
docker compose up -d --build
```

The application will be available at:
- **Frontend App**: http://localhost
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

To stop the containers:
```bash
docker compose down
```

### Local Quickstart

If you prefer to run the application natively on your system, you can launch both the frontend and backend servers simultaneously using the provided startup script in the root directory:

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

A `dependency-check-suppression.xml` file is included in the root directory. If you perform software composition analysis (SCA) on this project using the OWASP Dependency-Check tool, be sure to reference this suppression file to ignore known false positives.
