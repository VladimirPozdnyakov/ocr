# AGENTS.md

Context for AI assistants working on the Koharu codebase.

## Project Overview

Koharu is an ML-powered manga translator written in Rust with a Next.js/React frontend.

**Tech Stack:**

- Backend: Rust (Axum HTTP server, Candle for ML inference)
- Frontend: React 19, Next.js 16, Tailwind CSS 4, Zustand
- Build: Bun, Cargo
- Tests: Playwright (E2E), Vitest (UI unit tests), Rust native tests

## Architecture

### Rust Workspace Crates

| Crate             | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `koharu`          | Main application (HTTP server entry point)     |
| `koharu-ml`       | ML models: OCR, detection, inpainting (Candle) |
| `koharu-pipeline` | Processing pipeline orchestration              |
| `koharu-runtime`  | CUDA/runtime library loading                   |
| `koharu-http`     | HTTP utilities                                 |
| `koharu-rpc`      | HTTP API server                                |
| `koharu-types`    | Shared types (TS-RS bindings)                  |
| `koharu-renderer` | Text rendering engine                          |
| `koharu-psd`      | PSD export functionality                       |

### Frontend Structure

```
ui/
├── app/              # Next.js app router pages
├── components/        # React components
│   ├── canvas/       # Canvas/workspace components
│   ├── panels/       # Side panel components
│   └── ui/           # Radix UI primitives
├── lib/
│   ├── stores/       # Zustand stores
│   ├── query/        # TanStack Query hooks
│   └── generated/    # TS types from ts-rs
└── hooks/            # Custom React hooks
```

## Development Commands

```bash
# Install dependencies
bun install

# Build UI
bun run --cwd ui build

# Run server (default: http://127.0.0.1:3000)
cargo run --release

# Run with custom port/host
cargo run --release -- --port 8080 --host 0.0.0.0

# Force CPU mode
cargo run --release -- --cpu

# Download models only
cargo run --release -- --download

# Format UI code
bun run format

# Run E2E tests
bun run test:e2e

# Rust checks
cargo fmt --check
cargo clippy
cargo test -- --skip ignored_tests

# UI checks
bun run --cwd ui typecheck
bun run --cwd ui lint
bun run --cwd ui test
```

## Key Patterns

### Rust

- Use `anyhow::Result` for fallible operations
- `Arc<RwLock<T>>` for shared state
- `tracing` for logging
- GPU device selection: CUDA > Metal > CPU fallback

### TypeScript

- Zustand stores with persist middleware
- TanStack Query for server state
- Radix UI primitives for components
- ts-rs generates types from Rust structs

## Testing

- Rust tests in `koharu-ml/tests/` (many require models, marked `#[ignore]`)
- E2E tests in `e2e/*.spec.ts` (Playwright)
- Unit tests in `ui/**/*.test.ts` (Vitest)
- Run unit tests with `cargo test -- --skip ignored_tests`

## GPU Acceleration

- CUDA 13.1+ for NVIDIA GPUs
- Metal for Apple Silicon
- CPU fallback via `--cpu` flag

## Running

1. Build the UI: `bun run --cwd ui build`
2. Run the server: `cargo run --release`
3. Open browser: `http://127.0.0.1:3000`
