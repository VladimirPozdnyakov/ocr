# AGENTS.md

Koharu (Lilith Edition) — ML-powered manga translator. Fork of [mayocream/koharu](https://github.com/mayocream/koharu).

## Build & Run

```bash
bun install
bun run --cwd ui build          # must run before cargo, generates static export to ui/out/
cargo run --release              # serves UI + API on http://127.0.0.1:3000
```

Dev mode (hot reload): run `bun run --cwd ui dev` and `cargo run --release` in separate terminals.

CLI flags: `--port PORT`, `--host 0.0.0.0`, `--cpu` (force CPU inference), `--download` (fetch models only).

## Verification (run in this order)

Rust:

```bash
cargo fmt --all --check         # CI uses --all
cargo clippy -- -D warnings     # CI enforces -D warnings
cargo test -- --skip ignored_tests  # ML tests needing models are #[ignore]
```

UI:

```bash
bun run --cwd ui typecheck
bun run --cwd ui lint
bun run --cwd ui test           # Vitest, jsdom, setup in ui/test/setup.ts
```

E2E (requires running server):

```bash
bun run test:e2e                # Playwright, sequential (workers: 1), 120s timeout
```

## Architecture

**Rust workspace** (9 crates, edition 2024, resolver 3, `default-members = ["koharu"]`):

- `koharu` — entry point, CLI, wires all crates together
- `koharu-rpc` — Axum HTTP + WebSocket API (multipart, ws)
- `koharu-ml` — ML models via Candle (features: `cuda`, `metal`; standalone bins in `koharu-ml/bin/`)
- `koharu-pipeline` — processing orchestration
- `koharu-types` — shared types with `#[ts(export)]` → generates `ui/lib/generated/protocol/*.ts`
- `koharu-renderer` — text rendering engine
- `koharu-psd` — PSD export
- `koharu-runtime` — CUDA/Metal runtime loading
- `koharu-http` — HTTP utilities

**Frontend** (`ui/`): Next.js 16 static export (`output: 'export'`), React 19 + React Compiler, Tailwind CSS 4, Zustand 5, TanStack Query, Radix UI, i18next. Path alias `@/*` → `ui/`.

## Critical Details

- **Patched Candle**: workspace patches `candle-core/nn/transformers` and `ug/ug-cuda` to a custom fork (`cuda-dynamic-loading` branch). Do not upgrade these without checking the patch section in `Cargo.toml`.
- **ts-rs codegen**: `koharu-types` structs annotated `#[ts(export)]` auto-generate TS types into `ui/lib/generated/protocol/`. These are committed but ESLint ignores `lib/generated/`. If you change `koharu-types` Rust structs, rebuild to regenerate TS bindings.
- **Static export**: UI builds to `ui/out/` (not `.next/`). The Rust server serves these as static files.
- **CUDA dynamic loading**: CUDA toolkit 13.1 + cuDNN libs are extracted at runtime to the app data dir. `koharu-runtime` handles this. `--cpu` bypasses GPU entirely.
- **Rust edition 2024**: uses newer edition features.
- **dev opt-level overrides**: `image` and `imageproc` are built with `opt-level = 3` even in dev profile.

## Testing Quirks

- ML tests in `koharu-ml/tests/` that need downloaded models are `#[ignore]`. Always use `--skip ignored_tests` unless you've run `--download` first.
- `comic_text_detector.rs` and `manga_text_segmentation_2025.rs` tests are NOT ignored but still need models — they may fail without prior model download.
- E2E tests use `playwright.config.ts` webServer: `bun run dev -- --headless`, checking `http://127.0.0.1:9999/api/v1/meta` for readiness.
- E2E tests run sequentially (1 worker), 120s timeout per test.

## Style Conventions

- Rust: `anyhow::Result`, `Arc<RwLock<T>>` for shared state, `tracing` crate for logging
- TS: unused vars prefixed with `_` (ESLint `varsIgnorePattern: '^_'`), `no-explicit-any: warn`
- UI formatting: `bun run format` (Prettier with `prettier-plugin-tailwindcss`)
