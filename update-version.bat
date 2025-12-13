@echo off
REM Quick version update script for deployment (Windows)
REM Usage: update-version.bat 1.0.3

if "%~1"=="" (
    echo Usage: update-version.bat ^<version^>
    echo Example: update-version.bat 1.0.3
    exit /b 1
)

set VERSION=%1
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set DATE=%%c%%a%%b)

echo Updating to version %VERSION%...
echo.

echo Manual steps required:
echo.
echo 1. Open public/sw.js
echo    Change: const CACHE_NAME = 'buzybee-v1.0.2-20251205';
echo    To:     const CACHE_NAME = 'buzybee-v%VERSION%-%DATE%';
echo.
echo 2. Open public/index.html
echo    Change all version numbers:
echo    - style.css?v=1.0.2  →  style.css?v=%VERSION%
echo    - decks.js?v=1.0.2   →  decks.js?v=%VERSION%
echo    - app.js?v=1.0.2     →  app.js?v=%VERSION%
echo.
echo 3. Upload all files in 'public' folder to your server
echo.
echo 4. On iOS: Settings → Safari → Clear History and Website Data
echo.
echo 5. Reload the page
echo.
pause
