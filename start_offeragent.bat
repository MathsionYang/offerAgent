@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "APP_URL=http://127.0.0.1:5173/"
set "KEY_FILE=%~dp01.md"
set "PYTHON_EXE="
set "PYTHON_ARGS="
set "CHROME_EXE="
set "CHECK_ONLY=0"
if /I "%~1"=="--check" set "CHECK_ONLY=1"

if not exist "%KEY_FILE%" (
  echo [OfferAgent] Missing key file: "%KEY_FILE%"
  echo The file must contain KEY: and URL: entries.
  if "%CHECK_ONLY%"=="0" pause
  exit /b 1
)

where py.exe >nul 2>nul
if errorlevel 1 goto try_python
set "PYTHON_EXE=py.exe"
set "PYTHON_ARGS=-3"
goto python_found

:try_python
where python.exe >nul 2>nul
if errorlevel 1 (
  echo [OfferAgent] Python was not found in PATH.
  echo Install Python 3 or add python.exe to PATH.
  if "%CHECK_ONLY%"=="0" pause
  exit /b 1
)
set "PYTHON_EXE=python.exe"

:python_found
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  set "CHROME_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
)
if not defined CHROME_EXE if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  set "CHROME_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
)
if not defined CHROME_EXE if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
  set "CHROME_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
)
if not defined CHROME_EXE if exist "%LocalAppData%\Google\Chrome\Bin\chrome.exe" (
  set "CHROME_EXE=%LocalAppData%\Google\Chrome\Bin\chrome.exe"
)
if not defined CHROME_EXE (
  for /f "delims=" %%I in ('where chrome.exe 2^>nul') do if not defined CHROME_EXE set "CHROME_EXE=%%I"
)

if not defined CHROME_EXE (
  echo [OfferAgent] Google Chrome was not found.
  echo Install Chrome in a standard location and run this script again.
  if "%CHECK_ONLY%"=="0" pause
  exit /b 1
)

if /I "%~1"=="--check" (
  echo [OfferAgent] Environment check passed.
  echo Python: %PYTHON_EXE% %PYTHON_ARGS%
  echo Chrome: %CHROME_EXE%
  echo Key file: %KEY_FILE%
  exit /b 0
)

set "OFFERAGENT_CHROME=%CHROME_EXE%"
echo [OfferAgent] Starting local web and model proxy...
echo [OfferAgent] Chrome will open automatically when the page is ready.
echo [OfferAgent] Keep this window open. Press Ctrl+C to stop.
echo.

start "" /B powershell.exe -NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -Command "$url='%APP_URL%'; $chrome=$env:OFFERAGENT_CHROME; for($i=0; $i -lt 120; $i++){ try { $response=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 1; if($response.StatusCode -eq 200){ Start-Process -FilePath $chrome -ArgumentList $url; exit 0 } } catch {}; Start-Sleep -Milliseconds 500 }; exit 1"

"%PYTHON_EXE%" %PYTHON_ARGS% "scripts\local_proxy.py" --key-file "%KEY_FILE%"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo [OfferAgent] The local service stopped with exit code %EXIT_CODE%.
  pause
)

exit /b %EXIT_CODE%
