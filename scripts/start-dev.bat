@echo off
title Raseed - Financial Management App
color 0A
echo ========================================
echo   Raseed Financial Management App
echo ========================================
echo.

echo Checking for node_modules...
if not exist "node_modules" (
    echo node_modules not found. Installing dependencies...
    call npm install
    echo.
)

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo.
echo Starting FastAPI backend server...
echo Backend URL: http://localhost:8000
echo.
start "Raseed Backend" cmd /k "python -m uvicorn app:app --reload --port 8000"
timeout /t 3 /nobreak >nul

echo.
echo Starting frontend development server...
echo Frontend URL: http://localhost:8080
echo.
echo ========================================
echo Both servers are starting...
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:8080
echo.
echo Press Ctrl+C to stop the frontend server
echo Close the backend window to stop the backend server
echo ========================================
echo.

call npm run dev

pause


