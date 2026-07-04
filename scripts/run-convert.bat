@echo off
:: Change drive and directory to the project root
d:
cd "d:\Hwan\Documents\Web\edumaps"

:: Set target folder. If an argument is passed (%1), use it; otherwise, use the default path.
set "TARGET_FOLDER=%~1"
if "%TARGET_FOLDER%"=="" (
    set "TARGET_FOLDER=C:\Users\NT940XGQ\Downloads\thumbnails"
)

echo ==================================================
echo Starting WebP conversion for:
echo %TARGET_FOLDER%
echo ==================================================
echo.

:: Run the script using 'call' so execution returns to this script afterward
call npm run convert-webp "%TARGET_FOLDER%"

echo.
echo ==================================================
echo Work finished. Press any key to close this window...
echo ==================================================
pause > nul
