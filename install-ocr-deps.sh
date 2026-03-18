#!/bin/bash

# OCR Desktop Application - Dependency Installation Script
# Supports Linux (multiple distros) and macOS

# Don't exit on error, handle errors manually
set +e

echo "================================================"
echo "OCR Desktop - Dependency Installation Script"
echo "================================================"
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "Detected OS: ${MACHINE}"

# Detect package manager on Linux
if [ "${MACHINE}" = "Linux" ]; then
    if command -v pacman &> /dev/null; then
        PKG_MANAGER="pacman"
        PKG_INSTALL="sudo pacman -S --noconfirm --needed"
        echo "Package manager: Pacman (Arch Linux)"
    elif command -v apt-get &> /dev/null; then
        PKG_MANAGER="apt"
        PKG_INSTALL="sudo apt-get install -y"
        echo "Package manager: APT (Debian/Ubuntu)"
    elif command -v dnf &> /dev/null; then
        PKG_MANAGER="dnf"
        PKG_INSTALL="sudo dnf install -y"
        echo "Package manager: DNF (Fedora)"
    elif command -v zypper &> /dev/null; then
        PKG_MANAGER="zypper"
        PKG_INSTALL="sudo zypper install -y"
        echo "Package manager: Zypper (openSUSE)"
    else
        echo "⚠️  Unable to detect package manager"
        PKG_MANAGER="unknown"
    fi
fi
echo ""

# Function to install Tesseract
install_tesseract() {
    echo "📦 Installing Tesseract OCR..."

    if [ "${MACHINE}" = "Linux" ]; then
        case "${PKG_MANAGER}" in
            pacman)
                echo "Installing via Pacman..."
                sudo pacman -S --noconfirm --needed \
                    tesseract \
                    tesseract-data-eng \
                    tesseract-data-kor \
                    tesseract-data-jpn \
                    tesseract-data-chi_sim \
                    tesseract-data-chi_tra
                ;;
            apt)
                echo "Installing via APT..."
                sudo apt-get update
                sudo apt-get install -y \
                    tesseract-ocr \
                    tesseract-ocr-eng \
                    tesseract-ocr-kor \
                    tesseract-ocr-jpn \
                    tesseract-ocr-chi-sim \
                    tesseract-ocr-chi-tra
                ;;
            dnf)
                echo "Installing via DNF..."
                sudo dnf install -y \
                    tesseract \
                    tesseract-langpack-eng \
                    tesseract-langpack-kor \
                    tesseract-langpack-jpn \
                    tesseract-langpack-chi_sim \
                    tesseract-langpack-chi_tra
                ;;
            zypper)
                echo "Installing via Zypper..."
                sudo zypper install -y \
                    tesseract-ocr \
                    tesseract-ocr-traineddata
                ;;
            *)
                echo "❌ Unknown package manager. Please install Tesseract manually:"
                echo "   - Arch/Manjaro: sudo pacman -S tesseract tesseract-data-eng tesseract-data-jpn tesseract-data-chi_sim"
                echo "   - Fedora: sudo dnf install tesseract tesseract-langpack-*"
                echo "   - Ubuntu/Debian: sudo apt-get install tesseract-ocr tesseract-ocr-eng tesseract-ocr-jpn"
                return 1
                ;;
        esac
    elif [ "${MACHINE}" = "Mac" ]; then
        if ! command -v brew &> /dev/null; then
            echo "❌ Homebrew not found. Please install from https://brew.sh/"
            exit 1
        fi
        brew install tesseract
        brew install tesseract-lang
    else
        echo "⚠️  Please install Tesseract manually for your OS"
        return 1
    fi

    echo "✅ Tesseract installed successfully"
    tesseract --version
    echo ""
}

# Function to install PaddleOCR
install_paddleocr() {
    echo "📦 Installing PaddleOCR (Theseus engine)..."

    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 not found. Please install Python 3.11 or later"
        return 1
    fi

    # Check Python version (PaddlePaddle requires 3.7-3.12)
    PYTHON_VERSION=$(python3 --version | awk '{print $2}')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

    echo "Detected Python version: $PYTHON_VERSION"

    # Try to find Python 3.12 or older
    PYTHON_CMD=""
    if [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -le 12 ]; then
        PYTHON_CMD="python3"
    else
        # Look for alternative Python versions
        for alt_ver in "3.12" "3.11" "3.10" "3.9" "3.8" "3.7"; do
            if command -v python$alt_ver &> /dev/null; then
                PYTHON_CMD="python$alt_ver"
                echo "✅ Found compatible Python: $PYTHON_CMD ($(python$alt_ver --version))"
                break
            fi
        done

        if [ -z "$PYTHON_CMD" ]; then
            echo ""
            echo "❌ ERROR: PaddlePaddle requires Python 3.7-3.12, but you have Python $PYTHON_VERSION"
            echo ""
            echo "To install Python 3.12 on Arch Linux:"
            echo "  yay -S python312"
            echo "  # or"
            echo "  paru -S python312"
            echo ""
            echo "Or skip Theseus (PaddleOCR) and use Ortheus (Tesseract) instead."
            echo ""
            return 1
        fi
    fi

    # Set up virtual environment for Arch/externally managed environments
    if [ "${PKG_MANAGER}" = "pacman" ] || pip3 install --version 2>&1 | grep -q "externally-managed-environment"; then
        echo "🔧 Detected externally managed Python environment"
        echo "📦 Creating virtual environment in ~/.local/share/ocr-desktop..."

        VENV_DIR="$HOME/.local/share/ocr-desktop/venv"

        # Remove old venv if it exists and was created with wrong Python version
        if [ -d "$VENV_DIR" ] && [ "$PYTHON_CMD" != "python3" ]; then
            echo "🔄 Recreating virtual environment with Python $PYTHON_CMD..."
            rm -rf "$VENV_DIR"
        fi

        # Create virtual environment if it doesn't exist
        if [ ! -d "$VENV_DIR" ]; then
            $PYTHON_CMD -m venv "$VENV_DIR"
            echo "✅ Virtual environment created with Python $PYTHON_CMD"
        else
            echo "✅ Virtual environment already exists"
        fi

        # Activate virtual environment
        source "$VENV_DIR/bin/activate"
        echo "✅ Virtual environment activated"

        echo "Installing PaddlePaddle and PaddleOCR..."
        pip install --upgrade pip

        # Try GPU version first, fallback to CPU
        echo "Attempting to install PaddlePaddle with GPU support..."
        if pip install paddlepaddle-gpu 2>/dev/null; then
            echo "✅ PaddlePaddle (GPU) installed"
        else
            echo "⚠️  GPU version not available, installing CPU version..."
            if ! pip install paddlepaddle; then
                echo "❌ Failed to install PaddlePaddle. Skipping Theseus engine."
                deactivate
                return 1
            fi
        fi

        pip install paddleocr opencv-python

        # Create wrapper scripts
        mkdir -p "$HOME/.local/bin"
        cat > "$HOME/.local/bin/paddleocr" << 'EOF'
#!/bin/bash
source "$HOME/.local/share/ocr-desktop/venv/bin/activate"
paddleocr "$@"
EOF
        chmod +x "$HOME/.local/bin/paddleocr"

        echo ""
        echo "✅ PaddleOCR installed successfully in virtual environment"
        echo "Note: Models will be downloaded on first use (~200MB)"
        echo ""

        # Deactivate virtual environment
        deactivate
    else
        echo "Installing PaddlePaddle and PaddleOCR..."
        pip3 install --upgrade pip

        # Try GPU version first, fallback to CPU
        echo "Attempting to install PaddlePaddle with GPU support..."
        if pip3 install paddlepaddle-gpu 2>/dev/null; then
            echo "✅ PaddlePaddle (GPU) installed"
        else
            echo "⚠️  GPU version not available, installing CPU version..."
            if ! pip3 install paddlepaddle; then
                echo "❌ Failed to install PaddlePaddle. Skipping Theseus engine."
                return 1
            fi
        fi

        pip3 install paddleocr opencv-python

        echo "✅ PaddleOCR installed successfully"
        echo "Note: Models will be downloaded on first use (~200MB)"
        echo ""
    fi
}

# Function to install MangaOCR
install_mangaocr() {
    echo "📦 Installing MangaOCR..."

    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 not found. Please install Python 3.11 or later"
        return 1
    fi

    # Set up virtual environment for Arch/externally managed environments
    if [ "${PKG_MANAGER}" = "pacman" ] || pip3 install --version 2>&1 | grep -q "externally-managed-environment"; then
        echo "🔧 Detected externally managed Python environment"
        echo "📦 Using virtual environment in ~/.local/share/ocr-desktop..."

        VENV_DIR="$HOME/.local/share/ocr-desktop/venv"

        # Create virtual environment if it doesn't exist
        if [ ! -d "$VENV_DIR" ]; then
            python3 -m venv "$VENV_DIR"
            echo "✅ Virtual environment created"
        else
            echo "✅ Virtual environment already exists"
        fi

        # Activate virtual environment
        source "$VENV_DIR/bin/activate"
        echo "✅ Virtual environment activated"

        echo "Installing PyTorch and MangaOCR..."

        # Detect if we should install GPU or CPU version
        if command -v nvidia-smi &> /dev/null; then
            echo "NVIDIA GPU detected, installing CUDA version of PyTorch..."
            pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
        else
            echo "No NVIDIA GPU detected, installing CPU version of PyTorch..."
            pip install torch torchvision
        fi

        pip install manga-ocr

        echo ""
        echo "✅ MangaOCR installed successfully in virtual environment"
        echo "Note: Models will be downloaded on first use (~500MB)"
        echo ""

        # Deactivate virtual environment
        deactivate
    else
        echo "Installing PyTorch and MangaOCR..."

        # Detect if we should install GPU or CPU version
        if command -v nvidia-smi &> /dev/null; then
            echo "NVIDIA GPU detected, installing CUDA version of PyTorch..."
            pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118
        else
            echo "No NVIDIA GPU detected, installing CPU version of PyTorch..."
            pip3 install torch torchvision
        fi

        pip3 install manga-ocr

        echo "✅ MangaOCR installed successfully"
        echo "Note: Models will be downloaded on first use (~500MB)"
        echo ""
    fi
}

# Interactive menu
echo "Select OCR engines to install:"
echo "1) All engines (recommended)"
echo "2) Ortheus (Tesseract) only - Fast, basic support"
echo "3) Theseus (PaddleOCR) only - Best for Asian languages"
echo "4) MangaOCR only - Specialized for manga"
echo "5) Custom selection"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "Installing all OCR engines..."
        install_tesseract || echo "⚠️  Tesseract installation had issues"

        echo ""
        install_paddleocr || echo "⚠️  Theseus (PaddleOCR) installation failed - skipping this engine"

        echo ""
        install_mangaocr || echo "⚠️  MangaOCR installation had issues"
        ;;
    2)
        install_tesseract || echo "⚠️  Tesseract installation had issues"
        ;;
    3)
        install_paddleocr || echo "⚠️  Theseus (PaddleOCR) installation failed"
        ;;
    4)
        install_mangaocr || echo "⚠️  MangaOCR installation had issues"
        ;;
    5)
        echo ""
        read -p "Install Ortheus (Tesseract)? (y/n): " t
        read -p "Install Theseus (PaddleOCR)? (y/n): " p
        read -p "Install MangaOCR? (y/n): " m

        [[ "$t" =~ ^[Yy]$ ]] && install_tesseract || true
        [[ "$p" =~ ^[Yy]$ ]] && install_paddleocr || echo "⚠️  Theseus (PaddleOCR) installation failed"
        [[ "$m" =~ ^[Yy]$ ]] && install_mangaocr || true
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "✅ Installation complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Launch the application: npm run tauri dev"
echo "2. Upload an image"
echo "3. Select your preferred OCR engine in Settings"
echo "4. Process and enjoy!"
echo ""
echo "For detailed documentation, see OCR_SETUP.md"
echo ""
