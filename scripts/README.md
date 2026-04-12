# Build and Run Scripts

Эти скрипты автоматизируют процесс проверки зависимостей, сборки и запуска приложения Koharu.

## Архитектура

Koharu работает как веб-приложение:

- **Rust сервер** — HTTP API на порту 3000
- **Next.js UI** — статический экспорт, отдается Rust сервером

## Скрипты

### Полная сборка и запуск

#### Linux/macOS

```bash
./scripts/build-and-run.sh
```

#### Windows (PowerShell)

```powershell
.\scripts\build-and-run.ps1
```

**Что делает скрипт:**

1. Проверяет установленные зависимости (Rust, Bun/Node, CUDA)
2. Устанавливает фронтенд зависимости
3. Собирает UI (`bun run --cwd ui build`)
4. Собирает Rust сервер (`cargo build --release`)
5. Запускает сервер на http://127.0.0.1:3000

### Диагностика

```bash
./scripts/diagnose.sh
```

Проверяет все зависимости и показывает рекомендации.

## Требования

### Обязательные

- **Rust** и **Cargo**: https://rustup.rs/
- **Bun**: https://bun.sh/ (рекомендуется) или Node.js 18+
- **Build tools**:
  - Linux: `build-essential`, `pkg-config`
  - Windows: Visual Studio Build Tools

### Опциональные

- **CUDA** (для GPU ускорения): https://developer.nvidia.com/cuda-downloads

## Установка зависимостей

### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y build-essential pkg-config libssl-dev curl

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Bun
curl -fsSL https://bun.sh/install | bash
```

### Arch Linux

```bash
sudo pacman -S base-devel pkgconfig openssl curl

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Bun
curl -fsSL https://bun.sh/install | bash
```

### Windows

1. **Visual Studio Build Tools**: https://visualstudio.microsoft.com/downloads/
   - Установить "Desktop development with C++"
2. **Rust**: https://rustup.rs/
3. **Bun**: https://bun.sh/

## Ручной запуск

```bash
# Сборка UI
bun install
bun run --cwd ui build

# Сборка и запуск сервера
cargo run --release

# Открыть в браузере
http://127.0.0.1:3000
```

## Опции командной строки

```bash
# Кастомный порт
cargo run --release -- --port 8080

# Кастомный хост (для доступа из сети)
cargo run --release -- --host 0.0.0.0 --port 8080

# CPU-only режим
cargo run --release -- --cpu

# Только скачать модели
cargo run --release -- --download
```

## Troubleshooting

### Rust не найден

```bash
export PATH="$HOME/.cargo/bin:$PATH"
# Добавить в ~/.bashrc или ~/.zshrc
```

### CUDA не найдена (но установлена)

```bash
export PATH="/usr/local/cuda/bin:$PATH"
export LD_LIBRARY_PATH="/usr/local/cuda/lib64:$LD_LIBRARY_PATH"
```

### Ошибка `openssl` не найдена

```bash
# Ubuntu/Debian
sudo apt-get install libssl-dev pkg-config

# Arch
sudo pacman -S openssl
```
