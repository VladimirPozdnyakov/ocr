# Koharu Build and Run Scripts

## Overview

Скрипты для автоматизации сборки и запуска веб-приложения Koharu.

## Архитектура

Koharu работает как веб-приложение:

- **Rust сервер (Axum)** — HTTP API + раздача статики
- **Next.js UI** — статический экспорт в `ui/out`

## 📁 Файлы скриптов

### build-and-run.sh / build-and-run.ps1

Полная сборка и запуск:

- Проверка зависимостей
- Сборка UI (`bun run --cwd ui build`)
- Сборка Rust сервера (`cargo build --release`)
- Запуск на http://127.0.0.1:3000

### diagnose.sh

Диагностика системы:

- Проверка Rust, Bun/Node
- Проверка системных библиотек
- Проверка CUDA
- Рекомендации по установке

## 🚀 Использование

### Linux/macOS

```bash
chmod +x scripts/build-and-run.sh
./scripts/build-and-run.sh
```

### Windows (PowerShell)

```powershell
.\scripts\build-and-run.ps1
```

## 📋 Требования

### Обязательные

- **Rust** и **Cargo**: https://rustup.rs/
- **Bun** (рекомендуется) или Node.js 18+
- **Build tools**: gcc, make, pkg-config

### Опциональные

- **CUDA** для GPU ускорения ML

## 🔧 Установка зависимостей

### Ubuntu/Debian

```bash
sudo apt-get install -y build-essential pkg-config libssl-dev curl
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl -fsSL https://bun.sh/install | bash
```

### Arch Linux

```bash
sudo pacman -S base-devel pkgconfig openssl curl
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl -fsSL https://bun.sh/install | bash
```

### Windows

1. Visual Studio Build Tools (Desktop development with C++)
2. Rust: https://rustup.rs/
3. Bun: https://bun.sh/

## 🌐 Доступ

После запуска: **http://127.0.0.1:3000**

## ⚙️ Опции сервера

```bash
cargo run --release -- --help

# Кастомный порт
cargo run --release -- --port 8080

# Доступ из сети
cargo run --release -- --host 0.0.0.0 --port 8080

# CPU-only
cargo run --release -- --cpu
```

## 🔧 Разработка

### Режим горячей перезагрузки UI

**Терминал 1:**

```bash
bun run --cwd ui dev
```

**Терминал 2:**

```bash
cargo run --release
```

UI будет на http://localhost:3000 (Next.js dev), API на http://127.0.0.1:3000.

## ⚠️ Troubleshooting

### Rust не найден

```bash
export PATH="$HOME/.cargo/bin:$PATH"
```

### OpenSSL не найден

```bash
sudo apt-get install libssl-dev pkg-config  # Ubuntu/Debian
sudo pacman -S openssl                       # Arch
```

### CUDA не найдена

```bash
export PATH="/usr/local/cuda/bin:$PATH"
export LD_LIBRARY_PATH="/usr/local/cuda/lib64:$LD_LIBRARY_PATH"
```
