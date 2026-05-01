@echo off
echo Building Raseed Financial Management Application...
echo.
echo Installing dependencies (if needed)...
call npm install
echo.
echo Building for production...
call npm run build
echo.
echo Build complete! Check the 'dist' folder.
echo.
pause






