@echo off
echo Starting Raseed Financial Management Application...
echo.
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting development server...
echo Server will be available at http://localhost:8080
echo Press Ctrl+C to stop the server
echo.
call npm run dev
pause






