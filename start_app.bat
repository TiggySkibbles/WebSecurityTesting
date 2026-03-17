@echo off
setlocal

echo ==========================================
echo   OWASP WSTG Guided Walkthrough Platform
echo ==========================================
echo.
echo Starting Django Backend (serves both API and Frontend)...
echo Press Ctrl+C to stop the server.
echo.
echo - Application: http://localhost:8000
echo.

:: Collect static files (frontend + Django admin)
cd backend
call .\.venv\Scripts\activate
python manage.py collectstatic --noinput 2>nul

:: Load WSTG checklist data (idempotent)
python manage.py load_wstg_checklist

:: Start Backend
python manage.py runserver
