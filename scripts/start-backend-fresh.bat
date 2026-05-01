@echo off
title Raseed Backend - Fresh Start
color 0A
echo ========================================
echo   Starting Fresh Backend Server
echo ========================================
echo.

echo Stopping any existing Python processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo Clearing Python cache...
if exist __pycache__ rmdir /s /q __pycache__ >nul 2>&1
if exist *.pyc del /q *.pyc >nul 2>&1

echo.
echo Starting backend server...
echo Backend will be available at: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo ========================================
echo.

python -m uvicorn app:app --reload --port 8000 --host 0.0.0.0

