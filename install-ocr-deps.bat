@echo off
REM OCR Desktop Application - Dependency Installation Script for Windows
REM Run as Administrator if possible

echo ================================================
echo OCR Desktop - Dependency Installation Script
echo ================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.11 or later from https://www.python.org/
    pause
    exit /b 1
)

echo Python detected successfully
echo.

REM Check if pip is available
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: pip not found. Please reinstall Python with pip included.
    pause
    exit /b 1
)

echo pip detected successfully
echo.

REM Function to install PaddleOCR
:install_paddleocr
echo.
echo ================================================
echo Installing PaddleOCR (Theseus engine)...
echo ================================================
echo.

echo Installing PaddlePaddle and PaddleOCR...
echo This may take a few minutes...

REM Try GPU version first, fallback to CPU
echo Attempting to install PaddlePaddle with GPU support...
pip install paddlepaddle-gpu >nul 2>&1
if %errorlevel% neq 0 (
    echo GPU version not available, installing CPU version...
    pip install paddlepaddle
)

pip install paddleocr opencv-python

echo.
echo ================================================
echo PaddleOCR installed successfully!
echo Note: Models will be downloaded on first use (~200MB)
echo ================================================
echo.
goto :eof

REM Function to install MangaOCR
:install_mangaocr
echo.
echo ================================================
echo Installing MangaOCR...
echo ================================================
echo.

echo Installing PyTorch and MangaOCR...
echo This may take several minutes...

REM Detect NVIDIA GPU
nvidia-smi >nul 2>&1
if %errorlevel% equ 0 (
    echo NVIDIA GPU detected, installing CUDA version of PyTorch...
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
) else (
    echo No NVIDIA GPU detected, installing CPU version of PyTorch...
    pip install torch torchvision
)

pip install manga-ocr

echo.
echo ================================================
echo MangaOCR installed successfully!
echo Note: Models will be downloaded on first use (~500MB)
echo ================================================
echo.
goto :eof

REM Function to check Tesseract
:check_tesseract
echo.
echo ================================================
echo Checking Tesseract OCR (Ortheus engine)...
echo ================================================
echo.

where tesseract >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo WARNING: Tesseract not found in PATH!
    echo.
    echo To install Tesseract on Windows:
    echo 1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
    echo 2. Install to: C:\Program Files\Tesseract-OCR
    echo 3. Add C:\Program Files\Tesseract-OCR to system PATH
    echo 4. Restart command prompt
    echo.
    echo Press any key to continue without Tesseract...
    pause >nul
) else (
    echo Tesseract found in PATH:
    where tesseract
    tesseract --version
    echo.
)
goto :eof

REM Main menu
:menu
echo.
echo ================================================
echo Select OCR engines to install:
echo ================================================
echo 1) All engines (recommended)
echo 2) Theseus (PaddleOCR) only - Best for Asian languages
echo 3) MangaOCR only - Specialized for manga
echo 4) Check Tesseract installation only
echo 5) Custom selection
echo 6) Exit
echo.
set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto install_all
if "%choice%"=="2" goto install_theseus
if "%choice%"=="3" goto install_manga
if "%choice%"=="4" goto check_tesseract_only
if "%choice%"=="5" goto custom
if "%choice%"=="6" goto end
echo Invalid choice
goto menu

:install_all
echo Installing all OCR engines...
call :check_tesseract
call :install_paddleocr
call :install_mangaocr
goto done

:install_theseus
call :install_paddleocr
goto done

:install_manga
call :install_mangaocr
goto done

:check_tesseract_only
call :check_tesseract
goto menu

:custom
echo.
set /p t="Install Ortheus (Tesseract)? Check installation (y/n): "
if /i "%t%"=="y" call :check_tesseract

set /p p="Install Theseus (PaddleOCR)? (y/n): "
if /i "%p%"=="y" call :install_paddleocr

set /p m="Install MangaOCR? (y/n): "
if /i "%m%"=="y" call :install_mangaocr
goto done

:done
echo.
echo ================================================
echo Installation complete!
echo ================================================
echo.
echo Next steps:
echo 1. Launch the application: npm run tauri:dev
echo 2. Upload an image
echo 3. Select your preferred OCR engine in Settings
echo 4. Process and enjoy!
echo.
echo For detailed documentation, see OCR_SETUP.md
echo.
pause
goto end

:end
