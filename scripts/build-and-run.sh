#!/bin/bash
# Koharu Build and Run Script for Linux
# This script checks dependencies, builds the project, and runs it

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=========================================="
echo -e "${CYAN}Koharu Build and Run Script (Linux)${NC}"
echo "=========================================="
echo ""

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_cuda() {
    echo -e "${CYAN}Checking CUDA installation...${NC}"

    if command_exists nvcc; then
        local cuda_version=$(nvcc --version | grep "release" | sed 's/.*release //' | sed 's/,.*//')
        echo -e "${GREEN}✓ CUDA found: version $cuda_version${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ CUDA not found. CPU-only mode will be used.${NC}"
        echo -e "${YELLOW}  For GPU acceleration, install CUDA from: https://developer.nvidia.com/cuda-downloads${NC}"
        return 1
    fi
}

echo -e "${CYAN}Step 1: Checking dependencies...${NC}"
echo ""

if ! command_exists cargo; then
    echo -e "${RED}✗ Rust/Cargo not found!${NC}"
    echo -e "${RED}  Install from: https://rustup.rs/${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Rust/Cargo found: $(cargo --version)${NC}"

if command_exists bun; then
    echo -e "${GREEN}✓ Bun found: $(bun --version)${NC}"
elif command_exists node; then
    echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
    echo -e "${YELLOW}  Bun is recommended. Install from: https://bun.sh/${NC}"
else
    echo -e "${RED}✗ Node.js or Bun not found!${NC}"
    echo -e "${RED}  Install Bun from: https://bun.sh/${NC}"
    exit 1
fi

check_cuda || true
echo ""

echo -e "${CYAN}Step 2: Installing frontend dependencies...${NC}"
bun install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo -e "${CYAN}Step 3: Building UI...${NC}"
bun run --cwd ui build
echo -e "${GREEN}✓ UI build complete${NC}"
echo ""

echo -e "${CYAN}Step 4: Building Rust server...${NC}"
echo -e "${YELLOW}This may take several minutes on first build...${NC}"
cargo build --release
echo -e "${GREEN}✓ Server build complete${NC}"
echo ""

echo -e "${CYAN}Step 5: Starting application...${NC}"
echo ""
echo -e "${GREEN}Starting Rust server on http://127.0.0.1:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

./target/release/koharu
