@echo off
setlocal

echo ==========================================
echo   OWASP WSTG Guided Walkthrough Platform
echo ==========================================
echo.
echo Starting Django Backend and React Frontend...
echo Press Ctrl+C to stop both servers.
echo.
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:3000
echo.

:: Start Backend in the background without a new window
start /b "" cmd /c "cd backend && .\.venv\Scripts\activate && python manage.py runserver"

:: Wait a moment for backend to initialize
timeout /t 2 >nul

:: Start Frontend in the background without a new window
start /b "" cmd /c "cd frontend && npm run dev"

:: Keep the script running to hold the console window open.
:: Pressing Ctrl+C will send the interrupt signal to everything in this console.
:wait_loop
timeout /t 86400 /nobreak >nul
goto wait_loop
