# OCR Engine Installation Guide

This application supports three OCR engines with different strengths and language support.

## Prerequisites

### System Dependencies

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-kor \
    tesseract-ocr-jpn \
    tesseract-ocr-chi-sim \
    tesseract-ocr-chi-tra \
    python3 \
    python3-pip \
    libgomp1
```

**macOS:**
```bash
brew install tesseract
brew install tesseract-lang  # For additional languages
brew install python@3.11
```

**Windows:**
1. Install Tesseract from [UB Mannheim's installer](https://github.com/UB-Mannheim/tesseract/wiki)
2. Install Python 3.11+ from [python.org](https://www.python.org/)
3. Add Python and Tesseract to your PATH

---

## OCR Engine Setup

### 1. Ortheus (Tesseract OCR)

**Description:** Traditional OCR engine, good for general text recognition.

**Supported Languages:** English, Korean, Japanese, Chinese (Simplified & Traditional)

**Installation:**
```bash
# Already installed via system dependencies above
# Verify installation:
tesseract --version
```

**Language Data:**
```bash
# Linux
sudo apt-get install tesseract-ocr-{lang_code}

# macOS
brew install tesseract-lang

# Available languages: eng, kor, jpn, chi_sim, chi_tra
```

---

### 2. Theseus (PaddleOCR)

**Description:** Deep learning-based OCR with excellent accuracy for Asian languages and mixed text layouts.

**Supported Languages:** English, Korean, Japanese, Chinese (Simplified & Traditional), Arabic, Russian, French, German, Spanish

**Installation:**

1. **Install Python dependencies:**
```bash
pip install paddlepaddle-gpu  # For GPU support
# OR
pip install paddlepaddle  # For CPU-only

pip install paddleocr
pip install opencv-python
```

2. **Verify installation:**
```bash
paddleocr --help
```

**Notes:**
- First run will download models automatically (~200MB)
- GPU version requires CUDA-compatible GPU
- Models are cached in `~/.paddleocr/`

**Troubleshooting:**
```bash
# If you get import errors:
pip install --upgrade pip
pip install --upgrade paddleocr

# For Apple Silicon (M1/M2):
pip install paddlepaddle -i https://pypi.tuna.tsinghua.edu.cn/simple
```

---

### 3. MangaOCR

**Description:** Specialized OCR for manga and comics with excellent Japanese text recognition, including vertical text.

**Supported Languages:** Japanese (primary), English

**Installation:**

1. **Install Python dependencies:**
```bash
pip install manga-ocr
pip install torch torchvision  # PyTorch dependency
```

2. **Verify installation:**
```bash
python3 -c "import manga_ocr; print('MangaOCR installed successfully')"
```

**Notes:**
- First run will download models automatically (~500MB)
- GPU support requires CUDA-capable GPU
- Best for manga/comics with clean text bubbles
- May struggle with handwritten text

**Installation Options:**

**CPU-only (slower but more compatible):**
```bash
pip install manga-ocr
```

**With CUDA support (faster on NVIDIA GPUs):**
```bash
pip install manga-ocr
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

**With Apple Silicon acceleration:**
```bash
pip install manga-ocr
pip install torch torchvision
```

---

## Model Locations

Models are automatically downloaded to:

- **PaddleOCR (Theseus):** `~/.paddleocr/`
- **MangaOCR:** `~/.cache/huggingface/` or `~/.cache/manga-ocr/`
- **Tesseract (Ortheus):** System directories (e.g., `/usr/share/tesseract-ocr/`)

---

## Performance Comparison

| Engine | Speed | Accuracy (Latin) | Accuracy (CJK) | Best For |
|--------|-------|------------------|----------------|----------|
| **Ortheus** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | General documents, fast processing |
| **Theseus** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Asian languages, mixed layouts |
| **MangaOCR** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | Manga, comics, Japanese text |

---

## Testing Your Installation

After installation, test each engine:

1. **Launch the application:**
```bash
npm run tauri dev
```

2. **Upload a test image**

3. **Try each engine:**
   - Select OCR engine in Settings
   - Select appropriate language
   - Click "Process Areas" or "Process Full Image"

4. **Check results:**
   - Text accuracy
   - Processing time
   - Confidence score

---

## Troubleshooting

### Tesseract not found
```bash
# Linux
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract

# Windows: Add Tesseract to system PATH
```

### PaddleOCR errors
```bash
# Reinstall PaddleOCR
pip uninstall paddleocr paddlepaddle
pip install paddleocr paddlepaddle

# Clear model cache
rm -rf ~/.paddleocr/
```

### MangaOCR errors
```bash
# Reinstall MangaOCR
pip uninstall manga-ocr
pip install manga-ocr --no-cache-dir

# Update PyTorch
pip install --upgrade torch torchvision
```

### Python not found
```bash
# Ensure Python 3 is in PATH
which python3

# Create symlink if needed
sudo ln -s /usr/bin/python3 /usr/bin/python
```

---

## System Requirements

**Minimum:**
- CPU: Dual-core 2.0 GHz
- RAM: 4 GB
- Storage: 2 GB free space

**Recommended:**
- CPU: Quad-core 3.0 GHz
- RAM: 8 GB
- GPU: NVIDIA GPU with 4GB VRAM (for Theseus/MangaOCR)
- Storage: 5 GB free space

---

## Language Support Matrix

| Language | Ortheus | Theseus | MangaOCR |
|----------|---------|---------|----------|
| English | ✅ | ✅ | ✅ |
| Korean | ✅ | ✅ | ⚠️ |
| Japanese | ✅ | ✅ | ✅ |
| Chinese (Simplified) | ✅ | ✅ | ⚠️ |
| Chinese (Traditional) | ✅ | ✅ | ⚠️ |
| Arabic | ❌ | ✅ | ❌ |
| Russian | ❌ | ✅ | ❌ |
| French | ❌ | ✅ | ❌ |
| German | ❌ | ✅ | ❌ |
| Spanish | ❌ | ✅ | ❌ |

Legend: ✅ Excellent | ⚠️ Limited | ❌ Not supported

---

## Advanced Configuration

### Tesseract Custom Parameters
Edit `src-tauri/src/ocr/ortheus.rs` to modify:
- Page Segmentation Mode (`--psm`)
- OCR Engine Mode (`--oem`)
- Custom tessdata directory

### PaddleOCR Custom Models
Edit `src-tauri/src/ocr/theseus.rs` to:
- Use custom model paths
- Adjust detection/recognition thresholds
- Enable/disable text angle classification

### MangaOCR Custom Configuration
Edit `src-tauri/src/ocr/manga_ocr.rs` to:
- Adjust confidence thresholds
- Use custom model checkpoints
- Enable debug mode

---

## Uninstallation

**Remove all OCR engines:**

```bash
# Tesseract
sudo apt-get remove tesseract-ocr  # Linux
brew uninstall tesseract            # macOS

# PaddleOCR
pip uninstall paddleocr paddlepaddle

# MangaOCR
pip uninstall manga-ocr

# Remove model caches
rm -rf ~/.paddleocr/
rm -rf ~/.cache/huggingface/
rm -rf ~/.cache/manga-ocr/
```

---

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Consult individual engine documentation:
  - [Tesseract](https://github.com/tesseract-ocr/tesseract)
  - [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
  - [MangaOCR](https://github.com/kha-white/manga-ocr)
