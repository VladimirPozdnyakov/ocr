#!/bin/bash
# Koharu Diagnostic Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}Koharu Diagnostic Script${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ $1${NC}: $($1 --version 2>&1 | head -1)"
        return 0
    else
        echo -e "${RED}✗ $1${NC}: NOT FOUND"
        return 1
    fi
}

check_library() {
    if pkg-config --exists "$1" 2>/dev/null; then
        echo -e "${GREEN}✓ $1${NC}: $(pkg-config --modversion $1)"
        return 0
    else
        echo -e "${RED}✗ $1${NC}: NOT FOUND"
        return 1
    fi
}

echo -e "${CYAN}Checking Core Dependencies...${NC}"
check_command cargo || echo "  Install: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
check_command rustc || echo "  Rust compiler not found"
check_command bun || check_command node || echo "  Install Bun: curl -fsSL https://bun.sh/install | bash"
echo ""

echo -e "${CYAN}Checking Build Tools...${NC}"
check_command gcc || echo "  Install: sudo apt-get install build-essential"
check_command make || echo "  Install: sudo apt-get install build-essential"
check_command pkg-config || echo "  Install: sudo apt-get install pkg-config"
echo ""

echo -e "${CYAN}Checking System Libraries...${NC}"
check_library openssl || echo "  Install: sudo apt-get install libssl-dev"
echo ""

echo -e "${CYAN}Checking CUDA (Optional)...${NC}"
if command -v nvcc >/dev/null 2>&1; then
    echo -e "${GREEN}✓ CUDA found:${NC} $(nvcc --version | grep "release" | sed 's/.*release //')"
else
    echo -e "${YELLOW}⚠ CUDA not found (optional for GPU acceleration)${NC}"
fi
echo ""

echo -e "${CYAN}Checking Project State...${NC}"
if [ -d "target/release" ]; then
    echo -e "${GREEN}✓ Build directory exists${NC}"
    echo "  Size: $(du -sh target/release | cut -f1)"
else
    echo -e "${YELLOW}⚠ Build directory not found${NC}"
    echo "  Run: ./scripts/build-and-run.sh"
fi

if [ -d "ui/out" ]; then
    echo -e "${GREEN}✓ UI output exists${NC}"
else
    echo -e "${YELLOW}⚠ UI not built${NC}"
    echo "  Run: bun run --cwd ui build"
fi
echo ""

echo -e "${CYAN}Checking for Compilation Errors...${NC}"
if cargo check 2>&1 | grep -q "error"; then
    echo -e "${RED}✗ Compilation errors found${NC}"
    echo "  Run: cargo check to see errors"
else
    echo -e "${GREEN}✓ No compilation errors${NC}"
fi
echo ""

echo -e "${CYAN}Recommendations:${NC}"
echo ""

MISSING=0

if ! command -v cargo >/dev/null 2>&1; then
    echo -e "${RED}1. Install Rust:${NC} curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    MISSING=1
fi

if ! command -v bun >/dev/null 2>&1 && ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}2. Install Bun:${NC} curl -fsSL https://bun.sh/install | bash"
    MISSING=1
fi

if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}All required dependencies found!${NC}"
    echo ""
    echo -e "${CYAN}To start the application:${NC}"
    echo "  ./scripts/build-and-run.sh    # Build and run"
    echo "  cargo run --release           # Run server only"
    echo "  bun run --cwd ui dev          # Run UI dev server"
else
    echo -e "${RED}Please install missing dependencies first${NC}"
fi
echo ""
