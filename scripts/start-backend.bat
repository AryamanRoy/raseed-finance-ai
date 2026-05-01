@echo off
title Raseed Backend Server
color 0B
echo ========================================
echo   Raseed Backend Server
echo ========================================
echo.
echo Starting FastAPI backend server...
echo Backend URL: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python -m uvicorn app:app --reload --port 8000 --host 0.0.0.0

pause

