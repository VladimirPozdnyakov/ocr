# OCR Desktop Application

A cross-platform desktop OCR application with support for multiple languages and OCR engines.

## Features

- **Multi-language Support**: English, Korean, Japanese, Chinese (Simplified & Traditional), Arabic, Russian, French, German, Spanish
- **Multiple OCR Engines**: Ortheus (Tesseract), Theseus (PaddleOCR), MangaOCR
- **Area Selection**: Draw rectangles on images to OCR specific regions
- **Real-time Results**: See OCR results with confidence scores and processing times
- **Modern UI**: Built with React, TypeScript, and Material-UI
- **Export Results**: Copy to clipboard or export to JSON

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Material-UI (MUI)
- **Backend**: Tauri 2.x (Rust)
- **State Management**: Zustand
- **Canvas**: react-konva (Konva.js)
- **OCR Engines**:
  - **Ortheus**: Tesseract OCR (traditional, reliable)
  - **Theseus**: PaddleOCR (deep learning, excellent for Asian languages)
  - **MangaOCR**: Specialized for manga/comics (Japanese text)

## Project Structure

```
OCR/
├── src/                          # React + TypeScript + Vite
│   ├── components/
│   │   ├── ImageUploader.tsx     # Загрузка изображений
│   │   ├── ImageCanvas.tsx       # Canvas с выделением областей (react-konva)
│   │   ├── OCRControls.tsx       # Панель управления OCR
│   │   ├── ResultsPanel.tsx      # Отображение результатов
│   │   ├── SettingsPanel.tsx     # Настройки приложения
│   │   └── ToastProvider.tsx     # Toast уведомления
│   ├── hooks/
│   │   ├── useOCR.ts             # OCR логика
│   │   └── useTauriIPC.ts        # Tauri IPC коммуникация
│   ├── lib/
│   │   ├── types.ts              # TypeScript типы
│   │   └── constants.ts          # Константы (языки, движки)
│   ├── state/
│   │   └── store.ts              # Zustand store
│   ├── App.tsx
│   ├── main.tsx
│   └── App.css                   # MUI custom styles
├── src-tauri/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   └── ocr.rs            # Tauri команды для OCR
│   │   ├── ocr/
│   │   │   ├── mod.rs
│   │   │   ├── engine.rs         # Trait OCREngine
│   │   │   ├── ortheus.rs        # Tesseract интеграция
│   │   │   ├── theseus.rs        # PaddleOCR интеграция
│   │   │   └── manga_ocr.rs      # MangaOCR интеграция
│   │   ├── utils/
│   │   │   ├── mod.rs
│   │   │   └── image.rs          # Обработка изображений
│   │   └── main.rs               # Tauri entry point
│   ├── Cargo.toml
│   └── tauri.conf.json
├── install-ocr-deps.sh           # Скрипт установки OCR зависимостей
├── OCR_SETUP.md                  # Подробная документация по OCR
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Rust** (latest stable)
- **Python 3.11+** (for Theseus and MangaOCR)
  - **Arch Linux users**: Python 3.12 required for Theseus (see below)
- System dependencies for your platform (see below)

### Installation

#### Step 1: Install Node.js Dependencies

```bash
npm install
```

#### Step 2: Install OCR Dependencies

**Quick Install (Recommended):**

```bash
npm run install:ocr
```

This interactive script will:
- Detect your operating system
- Install Tesseract (system package)
- Set up Python virtual environment
- Install PaddleOCR and/or MangaOCR
- Create wrapper scripts for easy access

**Manual Install (if script fails):**

See [OCR_SETUP.md](OCR_SETUP.md) for detailed manual installation instructions.

#### Step 3: Arch Linux Users - Important!

Arch Linux uses Python 3.14 by default, but **Theseus (PaddleOCR) requires Python 3.7-3.12**.

**Solution 1: Install Python 3.12 (Recommended)**

```bash
# Using yay (AUR helper)
yay -S python312

# Or using paru
paru -S python312

# Then run the installer
npm run install:ocr
```

Python 3.12 will be installed alongside Python 3.14 and used only for PaddleOCR.

**Solution 2: Skip Theseus**

```bash
npm run install:ocr
# Choose option 5 (Custom selection)
# Install only Ortheus (Tesseract) and MangaOCR
```

See [PYTHON_312_ARCH.md](PYTHON_312_ARCH.md) for detailed instructions.

#### Step 4: Run Development Server

```bash
npm run tauri:dev
```

#### Step 5: Build for Production

```bash
npm run tauri:build
```

The built application will be in `src-tauri/target/release/bundle/`

### Platform-Specific Requirements

#### Linux (Ubuntu/Debian)

```bash
# System dependencies
sudo apt-get update
sudo apt-get install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# OCR dependencies (via install script)
npm run install:ocr
```

#### Linux (Arch/Manjaro)

```bash
# System dependencies
sudo pacman -S \
    webkit2gtk-4.1 \
    base-devel \
    curl \
    wget \
    file \
    libxdo \
    openssl \
    appmenu-gtk-module \
    librsvg

# Python 3.12 for Theseus (see above)
yay -S python312  # or paru -S python312

# OCR dependencies (via install script)
npm run install:ocr
```

#### Linux (Fedora)

```bash
# System dependencies
sudo dnf install \
    webkit2gtk4.1-devel \
    openssl-devel \
    curl \
    wget \
    file \
    libxdo-devel \
    openssl-devel \
    appmenu-gtk-module \
    librsvg2-devel

# OCR dependencies (via install script)
npm run install:ocr
```

#### macOS

```bash
# System dependencies
brew install cmake

# OCR dependencies (via install script)
npm run install:ocr
```

#### Windows

1. **Install Microsoft C++ Build Tools**
   - Download from [visualstudio.microsoft.com](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Install "Desktop development with C++"

2. **Install WebView2**
   - Download from [developer.microsoft.com](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

3. **Install Rust**
   - Download from [rustup.rs](https://rustup.rs/)

4. **Install Python 3.11+**
   - Download from [python.org](https://www.python.org/)
   - Check "Add Python to PATH"

5. **Install OCR dependencies**
   ```bash
   npm run install:ocr:windows
   ```

### Verify Installation

Check if all OCR engines are installed:

```bash
# Ortheus (Tesseract)
tesseract --version
# Should show: tesseract 5.x.x

# Theseus (PaddleOCR)
~/.local/bin/paddleocr --help
# Should show help message

# MangaOCR
source ~/.local/share/ocr-desktop/venv/bin/activate
python3 -c "import manga_ocr; print('MangaOCR installed')"
# Should show: MangaOCR installed
```

## OCR Engines

### Ortheus (Tesseract OCR)
- **Technology**: Traditional OCR with LSTM neural networks
- **Languages**: English, Korean, Japanese, Chinese (Simplified & Traditional)
- **Best For**: General documents, printed text, fast processing
- **Installation**: Usually pre-installed on most systems

### Theseus (PaddleOCR)
- **Technology**: Deep learning (PaddlePaddle framework)
- **Languages**: English, Korean, Japanese, Chinese (Simplified & Traditional), Arabic, Russian, French, German, Spanish
- **Best For**: Asian languages, mixed layouts, complex text
- **Requirements**: Python 3.11+, PaddlePaddle, ~200MB models
- **Performance**: Slower but more accurate for CJK languages

### MangaOCR
- **Technology**: Specialized manga OCR (Python)
- **Languages**: Japanese (primary), English
- **Best For**: Manga, comics, anime screenshots
- **Requirements**: Python 3.11+, PyTorch, ~500MB models
- **Performance**: Excellent for Japanese manga text

## Usage

1. **Upload an Image**: Click the "Choose File" button or drag & drop
2. **Draw Selection Areas**: Click and drag on the image to create OCR regions
3. **Configure OCR**: Select the OCR engine and language in Settings
4. **Process**: Click "Process Areas" to OCR the selected regions
5. **View Results**: Results appear in the panel below with confidence scores
6. **Export**: Copy individual results or export all to JSON

## Keyboard Shortcuts

- **ESC** - Deselect all areas
- **Double-click** - Delete an area

## Development

### Frontend Development

```bash
npm run dev
```

### Backend Development

```bash
cd src-tauri
cargo build
cargo test
```

### Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run tauri:dev` - Start Tauri development
- `npm run tauri:build` - Build Tauri application
- `npm run install:ocr` - Install OCR dependencies
- `npm run clean` - Clean build artifacts

## Troubleshooting

### OCR Engines Not Working

**1. Check if OCR tools are installed:**

```bash
# Ortheus (Tesseract)
tesseract --version

# Theseus (PaddleOCR)
~/.local/bin/paddleocr --help
# or just: paddleocr --help (if installed system-wide)

# MangaOCR
source ~/.local/share/ocr-desktop/venv/bin/activate
python3 -c "import manga_ocr; print('OK')"
```

**2. Reinstall OCR dependencies:**

```bash
npm run install:ocr
```

**3. Common Issues:**

| Issue | Solution |
|-------|----------|
| **"paddleocr not found"** | Run `npm run install:ocr` to install wrapper script |
| **"No matching distribution for paddlepaddle"** | Install Python 3.12 (see Arch Linux section above) |
| **"externally-managed-environment"** | Script handles this automatically with virtual environment |
| **Tesseract not found** | Install via package manager (see Platform-Specific Requirements) |
| **MangaOCR import error** | Ensure virtual environment is activated when checking |

**4. Manual virtual environment setup (if script fails):**

```bash
# Create virtual environment
python3 -m venv ~/.local/share/ocr-desktop/venv

# Activate it
source ~/.local/share/ocr-desktop/venv/bin/activate

# Install packages
pip install paddleocr paddlepaddle opencv-python  # For Theseus
pip install manga-ocr torch torchvision              # For MangaOCR
```

### Build Errors

**"cargo not found" or "rustc not found"**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

**"webkit2gtk not found"**

```bash
# Ubuntu/Debian
sudo apt-get install libwebkit2gtk-4.1-dev

# Arch/Manjaro
sudo pacman -S webkit2gtk-4.1

# Fedora
sudo dnf install webkit2gtk4.1-devel
```

**General build issues**

```bash
# Clean and rebuild
npm run clean
npm install
npm run tauri:dev
```

### Python Issues

**"Python 3.14 not supported"**

PaddlePaddle requires Python 3.7-3.12. On Arch Linux:

```bash
# Install Python 3.12
yay -S python312

# Reinstall OCR dependencies
rm -rf ~/.local/share/ocr-desktop/venv
npm run install:ocr
```

**"pip not found"**

```bash
# Ubuntu/Debian
sudo apt-get install python3-pip

# Arch/Manjaro
sudo pacman -S python-pip

# Fedora
sudo dnf install python3-pip
```

### Performance Issues

**OCR is too slow:**

1. Use **Ortheus (Tesseract)** for faster processing
2. Reduce image resolution before uploading
3. Draw smaller selection areas
4. Close other applications to free up memory

**OCR is not accurate:**

1. Use **Theseus (PaddleOCR)** for better accuracy
2. Ensure correct language is selected
3. Improve image quality (better lighting, higher resolution)
4. Preprocess image (increase contrast, denoise)

### Application Won't Start

**"Cannot find module" errors**

```bash
npm install
```

**"Tauri CLI not found"**

```bash
npm install -g @tauri-apps/cli@latest
```

**White screen or blank window**

```bash
# Check browser console for errors
# Usually indicates a frontend build issue
npm run build
npm run tauri:dev
```

## Performance Tips

1. **Use Ortheus** for fast processing of Latin text
2. **Use Theseus** for best accuracy with Asian languages
3. **Use MangaOCR** specifically for manga/comics
4. **Smaller selection areas** = faster processing
5. **Lower resolution images** process faster but may reduce accuracy

## System Requirements

### Minimum Requirements

- **CPU**: Dual-core 2.0 GHz
- **RAM**: 4 GB
- **Storage**: 2 GB free space
- **OS**: Linux kernel 5.+, macOS 11+, or Windows 10+

### Recommended Requirements

- **CPU**: Quad-core 3.0+ GHz
- **RAM**: 8 GB
- **GPU**: NVIDIA GPU with 4GB+ VRAM (for Theseus/MangaOCR with CUDA)
- **Storage**: 5 GB free space
- **OS**: Latest stable release of your OS

### OCR Engine Requirements

| Engine | RAM | Storage | GPU | Notes |
|--------|-----|---------|-----|-------|
| **Ortheus** | 100 MB | 50 MB | No | Runs on CPU only |
| **Theseus** | 500 MB | 250 MB | Optional | GPU recommended |
| **MangaOCR** | 1.2 GB | 500 MB | Optional | GPU recommended |

## Documentation

- **[OCR_SETUP.md](OCR_SETUP.md)** - Comprehensive OCR installation guide
- **[OCR_COMPARISON.md](OCR_COMPARISON.md)** - Engine selection and performance comparison
- **[ARCH_LINUX_SETUP.md](ARCH_LINUX_SETUP.md)** - Arch Linux specific instructions
- **[PYTHON_312_ARCH.md](PYTHON_312_ARCH.md)** - Python 3.12 setup for Arch Linux
- **[OCR_IMPLEMENTATION_SUMMARY.md](OCR_IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

## Additional Resources

### Tauri Documentation
- [Tauri Docs](https://tauri.app/v1/guides/)
- [Tauri GitHub](https://github.com/tauri-apps/tauri)

### OCR Engine Documentation
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR)
- [MangaOCR](https://github.com/kha-white/manga-ocr)

### Frontend Frameworks
- [React](https://react.dev/)
- [Material-UI](https://mui.com/)
- [React-Konva](https://konvajs.org/)
- [Zustand](https://github.com/pmndrs/zustand)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) - Open source OCR engine
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) - Awesome OCR toolkit based on PaddlePaddle
- [MangaOCR](https://github.com/kha-white/manga-ocr) - OCR for manga
- [Tauri](https://tauri.app/) - Build desktop apps with web technologies
- [React](https://react.dev/) - React framework
- [Material-UI](https://mui.com/) - React components library
