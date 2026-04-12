#!/usr/bin/env pwsh
# Koharu Build and Run Script for Windows

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Info { Write-Host $args -ForegroundColor Cyan }

Write-Info "=========================================="
Write-Info "Koharu Build and Run Script (Windows)"
Write-Info "=========================================="
Write-Host ""

function Test-CommandExists {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Test-CudaInstalled {
    Write-Info "Checking CUDA installation..."
    $cudaPaths = @(
        "C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA",
        "C:\CUDA"
    )

    foreach ($path in $cudaPaths) {
        if (Test-Path $path) {
            $versions = Get-ChildItem $path -Directory | Where-Object { $_.Name -like "v*" }
            foreach ($version in $versions) {
                $nvccPath = Join-Path $version.FullName "bin\nvcc.exe"
                if (Test-Path $nvccPath) {
                    Write-Success "✓ CUDA found at: $($version.FullName)"
                    return $true
                }
            }
        }
    }

    Write-Warning "⚠ CUDA not found. CPU-only mode will be used."
    Write-Warning "  For GPU acceleration, install CUDA from: https://developer.nvidia.com/cuda-downloads"
    return $false
}

Write-Info "Step 1: Checking dependencies..."
Write-Host ""

if (-not (Test-CommandExists "cargo")) {
    Write-Error "✗ Rust/Cargo not found!"
    Write-Error "  Install from: https://rustup.rs/"
    exit 1
}
Write-Success "✓ Rust/Cargo found: $(cargo --version)"

if (Test-CommandExists "bun") {
    Write-Success "✓ Bun found: $(bun --version)"
}
elseif (Test-CommandExists "node") {
    Write-Success "✓ Node.js found: $(node --version)"
    Write-Warning "  Bun is recommended. Install from: https://bun.sh/"
}
else {
    Write-Error "✗ Node.js or Bun not found!"
    Write-Error "  Install Bun from: https://bun.sh/"
    exit 1
}

Test-CudaInstalled | Out-Null
Write-Host ""

Write-Info "Step 2: Installing frontend dependencies..."
bun install
Write-Success "✓ Frontend dependencies installed"
Write-Host ""

Write-Info "Step 3: Building UI..."
bun run --cwd ui build
Write-Success "✓ UI build complete"
Write-Host ""

Write-Info "Step 4: Building Rust server..."
Write-Warning "This may take several minutes on first build..."
Write-Host ""

cargo build --release
Write-Success "✓ Server build complete"
Write-Host ""

Write-Info "Step 5: Starting application..."
Write-Host ""
Write-Success "Starting Rust server on http://127.0.0.1:3000"
Write-Warning "Press Ctrl+C to stop"
Write-Host ""

& ".\target\release\koharu.exe"
