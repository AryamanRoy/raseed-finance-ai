@echo off
title Restart Raseed Backend
color 0C
echo ========================================
echo   Stopping old backend servers...
echo ========================================
echo.

echo Killing processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Stopping process %%a
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   Starting new backend server...
echo ========================================
echo.

start "Raseed Backend" cmd /k "python -m uvicorn app:app --reload --port 8000 --host 0.0.0.0"

timeout /t 3 /nobreak >nul

echo.
echo Backend server restarted!
echo Backend URL: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause >nul

