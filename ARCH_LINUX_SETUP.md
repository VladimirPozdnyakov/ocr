# Arch Linux Installation Guide

Special instructions for Arch Linux and its derivatives (Manjaro, EndeavourOS, etc.).

## Quick Install

```bash
# Install Tesseract (system packages)
sudo pacman -S tesseract tesseract-data-eng tesseract-data-kor tesseract-data-jpn tesseract-data-chi_sim tesseract-data-chi_tra

# Install OCR engines (Python packages in virtual environment)
npm run install:ocr
```

The installation script will automatically detect Arch Linux and create a virtual environment for Python packages.

## What Gets Installed

### System Packages (via Pacman)
- **tesseract** - OCR engine
- **tesseract-data-eng** - English language data
- **tesseract-data-kor** - Korean language data
- **tesseract-data-jpn** - Japanese language data
- **tesseract-data-chi_sim** - Chinese Simplified
- **tesseract-data-chi_tra** - Chinese Traditional

### Python Packages (in Virtual Environment)
- **PaddleOCR** - Theseus engine (~250 MB)
- **MangaOCR** - Manga OCR (~500 MB)
- **PyTorch** - Required by MangaOCR
- **PaddlePaddle** - Required by PaddleOCR

All Python packages are installed in:
```
~/.local/share/ocr-desktop/venv/
```

Wrapper scripts are created in:
```
~/.local/bin/paddleocr
```

## Manual Installation

If the automated script fails, you can install manually:

### 1. Tesseract (System)
```bash
sudo pacman -S tesseract tesseract-data-eng tesseract-data-kor tesseract-data-jpn tesseract-data-chi_sim tesseract-data-chi_tra
```

### 2. Create Virtual Environment
```bash
python3 -m venv ~/.local/share/ocr-desktop/venv
source ~/.local/share/ocr-desktop/venv/bin/activate
```

### 3. Install PaddleOCR
```bash
pip install --upgrade pip
pip install paddleocr paddlepaddle opencv-python
```

### 4. Install MangaOCR
```bash
# CPU version (slower, more compatible)
pip install torch torchvision manga-ocr

# OR GPU version (faster, requires NVIDIA GPU)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install manga-ocr
```

### 5. Create Wrapper Script
```bash
mkdir -p ~/.local/bin
cat > ~/.local/bin/paddleocr << 'EOF'
#!/bin/bash
source "$HOME/.local/share/ocr-desktop/venv/bin/activate"
paddleocr "$@"
EOF
chmod +x ~/.local/bin/paddleocr
```

### 6. Update PATH
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

## Troubleshooting

### "externally-managed-environment" Error
This is expected on Arch Linux. The installation script automatically creates a virtual environment.

### Python Not Found
```bash
sudo pacman -S python python-pip
```

### Virtual Environment Issues
```bash
# Remove and recreate
rm -rf ~/.local/share/ocr-desktop/venv
python3 -m venv ~/.local/share/ocr-desktop/venv
source ~/.local/share/ocr-desktop/venv/bin/activate
pip install paddleocr manga-ocr torch torchvision
```

### Tesseract Language Data Missing
```bash
sudo pacman -S tesseract-data-{eng,kor,jpn,chi_sim,chi_tra}
```

### PaddleOCR Wrapper Not Working
```bash
# Recreate the wrapper
cat > ~/.local/bin/paddleocr << 'EOF'
#!/bin/bash
source "$HOME/.local/share/ocr-desktop/venv/bin/activate"
paddleocr "$@"
EOF
chmod +x ~/.local/bin/paddleocr
```

### Models Not Downloading
Models are downloaded automatically on first use. Make sure you have internet connection and sufficient disk space (~750 MB total).

### Permission Issues
```bash
# Fix permissions
chmod -R +rwx ~/.local/share/ocr-desktop
```

## AUR Packages (Alternative)

Some OCR packages may be available in AUR:

```bash
# Using yay (AUR helper)
yay -S python-paddleocr
yay -S python-manga-ocr

# Using paru (AUR helper)
paru -S python-paddleocr
paru -S python-manga-ocr
```

Note: AUR packages may not be up-to-date. Virtual environment method is recommended.

## Performance Tips

### Enable GPU Support
```bash
# Install NVIDIA drivers (if not already installed)
sudo pacman -S nvidia nvidia-utils

# Install CUDA versions of PyTorch and PaddlePaddle
source ~/.local/share/ocr-desktop/venv/bin/activate
pip uninstall paddlepaddle torch torchvision
pip install paddlepaddle-gpu
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### Check GPU Detection
```bash
nvidia-smi
```

### Monitor GPU Usage
```bash
nvidia-smi dmon
```

## Uninstallation

### Remove System Packages
```bash
sudo pacman -R tesseract tesseract-data-*
```

### Remove Virtual Environment
```bash
rm -rf ~/.local/share/ocr-desktop
rm ~/.local/bin/paddleocr
```

### Remove Application
```bash
# From project directory
npm run clean
rm -rf node_modules
```

## System Requirements

- **RAM**: 4 GB minimum, 8 GB recommended
- **Storage**: 2 GB free space (for models)
- **GPU**: NVIDIA GPU with CUDA support (optional, for better performance)

## Verification

Test your installation:

```bash
# Test Tesseract
tesseract --version

# Test PaddleOCR (via wrapper)
~/.local/bin/paddleocr --help

# Test MangaOCR (in virtual env)
source ~/.local/share/ocr-desktop/venv/bin/activate
python3 -c "import manga_ocr; print('MangaOCR installed')"
```

## Next Steps

After installation:

1. Launch the application: `npm run tauri:dev`
2. Upload an image
3. Select OCR engine in Settings
4. Choose language
5. Draw selection areas
6. Click "Process Areas"

## Additional Resources

- [Arch Wiki - Python](https://wiki.archlinux.org/title/Python)
- [Arch Wiki - Tesseract](https://wiki.archlinux.org/title/Tesseract)
- [PaddleOCR Documentation](https://github.com/PaddlePaddle/PaddleOCR)
- [MangaOCR GitHub](https://github.com/kha-white/manga-ocr)
