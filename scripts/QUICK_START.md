# 🚀 Быстрый старт Koharu

## Архитектура

Koharu — веб-приложение:

- **Rust сервер** — HTTP API + статика UI
- **Next.js UI** — собирается в статические файлы

## 📋 Быстрый запуск

### Linux/macOS

```bash
# Из корня проекта
./scripts/build-and-run.sh
```

### Windows (PowerShell)

```powershell
.\scripts\build-and-run.ps1
```

## 🔧 Альтернативный запуск

### Раздельный режим (для разработки)

**Терминал 1 — UI:**

```bash
bun run --cwd ui dev
# UI доступен на http://localhost:3000
```

**Терминал 2 — Rust сервер:**

```bash
cargo run --release
# API на http://127.0.0.1:3000
```

### Только сервер (UI уже собран)

```bash
cargo run --release
```

## 🌐 Доступ к приложению

После запуска:

- **Основной URL**: http://127.0.0.1:3000
- **Кастомный порт**: `cargo run --release -- --port 8080`

## ⚙️ Опции сервера

```bash
# Показать справку
cargo run --release -- --help

# Кастомный порт и хост
cargo run --release -- --port 8080 --host 0.0.0.0

# CPU-only режим (без GPU)
cargo run --release -- --cpu

# Скачать модели и выйти
cargo run --release -- --download
```

## ✅ Требования

- **Rust**: https://rustup.rs/
- **Bun**: https://bun.sh/ (или Node.js 18+)
- **Build tools**: gcc, make, pkg-config

## ❌ Частые проблемы

### 1. "cargo not found"

```bash
source ~/.cargo/env
# Или добавьте в ~/.bashrc:
echo 'source ~/.cargo/env' >> ~/.bashrc
```

### 2. "bun not found"

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

### 3. OpenSSL ошибки

```bash
# Ubuntu/Debian
sudo apt-get install libssl-dev pkg-config

# Arch
sudo pacman -S openssl
```

### 4. Port занят

```bash
# Найти процесс
lsof -ti:3000 | xargs kill -9
# Или использовать другой порт
cargo run --release -- --port 8080
```

## 🔍 Диагностика

```bash
./scripts/diagnose.sh
```
