# Koharu

Форк для команды [Lilith Team](https://t.me/+yq6z7BZcZ84xODJi)

OCR-приложение для манги, написанное на **Rust**.

Koharu использует возможности машинного обучения для автоматизации распознавания текста в манге. Он объединяет возможности обнаружения объектов и OCR для извлечения текста из изображений.

Под капотом Koharu использует [candle](https://github.com/huggingface/candle) для высокопроизводительного инференса. Все компоненты написаны на Rust, что обеспечивает безопасность и скорость.

> [!NOTE]
> Koharu запускает свои визуальные модели **локально** на вашем компьютере. Koharu не собирает пользовательские данные.

---

![screenshot](assets/koharu-screenshot-en.png)

> [!NOTE]
> Для помощи и поддержки присоединяйтесь к нашему [Telegram-каналу (переходник со всеми ссылками)](https://t.me/+yq6z7BZcZ84xODJi).

## Возможности

- Автоматическое обнаружение и сегментация облачков речи
- OCR для распознавания текста манги
- Вертикальная раскладка текста для CJK-языков
- Экспорт результатов OCR в текстовый файл
- MCP-сервер для AI-агентов

## Запуск

Koharu работает как веб-приложение с серверной частью на Rust.

### Быстрый старт

```bash
# Установка зависимостей
bun install

# Сборка UI
bun run --cwd ui build

# Запуск сервера
cargo run --release
```

Откройте http://127.0.0.1:3000 в браузере.

### Параметры командной строки

```bash
# Справка
cargo run --release -- --help

# Свой порт
cargo run --release -- --port 8080

# Доступ из сети
cargo run --release -- --host 0.0.0.0 --port 8080

# Только CPU
cargo run --release -- --cpu

# Только загрузка моделей
cargo run --release -- --download
```

### Режим разработки

Запускайте UI и сервер отдельно для горячего обновления:

**Терминал 1:**

```bash
bun run --cwd ui dev
```

**Терминал 2:**

```bash
cargo run --release
```

## Использование

### Горячие клавиши

- <kbd>Ctrl</kbd> + Колесо мыши: Масштабирование
- <kbd>Ctrl</kbd> + Перетаскивание: Перемещение холста
- <kbd>СКМ</kbd> + Перетаскивание: Перемещение холста ("рука")
- <kbd>Стрелки</kbd>: Навигация по изображению
- <kbd>Del</kbd>: Удалить выбранный текстовый блок

### Экспорт

Koharu экспортирует результаты OCR в текстовый файл.

### MCP-сервер

Koharu имеет встроенный MCP-сервер для интеграции с AI-агентами.

```bash
cargo run --release -- --port 9999
```

Введите `http://localhost:9999/mcp` в поле URL MCP-сервера в вашем AI-агенте.

## GPU-ускорение

CUDA и Metal поддерживаются для GPU-ускорения, что значительно улучшает производительность на поддерживаемом оборудовании.

### CUDA

Koharu собирается с поддержкой CUDA, что позволяет использовать мощность GPU NVIDIA для более быстрой обработки.

Koharu включает CUDA toolkit 13.1 и cuDNN 9.19, динамические библиотеки будут автоматически извлечены в каталог данных приложения при первом запуске.

> [!NOTE]
> Убедитесь, что в вашей системе установлены последние драйверы NVIDIA. Вы можете скачать последние драйверы через [NVIDIA App](https://www.nvidia.com/en-us/software/nvidia-app/).

#### Поддерживаемые GPU NVIDIA

Koharu поддерживает GPU NVIDIA с compute capability 7.5 или выше.

Убедитесь, что ваш GPU поддерживается, проверив [CUDA GPU Compute Capability](https://developer.nvidia.com/cuda-gpus) и [cuDNN Support Matrix](https://docs.nvidia.com/deeplearning/cudnn/backend/latest/reference/support-matrix.html).

### Metal

Koharu поддерживает Metal для GPU-ускорения на macOS с Apple Silicon (M1, M2 и т.д.). Это позволяет Koharu эффективно работать на широком спектре устройств Apple.

### CPU-режим

Вы всегда можете заставить Koharu использовать CPU для инференса:

```bash
cargo run --release -- --cpu
```

## ML-модели

Koharu использует набор моделей компьютерного зрения для выполнения своих задач.

### Модели компьютерного зрения

Koharu использует несколько предобученных моделей для разных задач:

- [PP-DocLayoutV3](https://huggingface.co/PaddlePaddle/PP-DocLayoutV3_safetensors) для обнаружения текста и анализа макета
- [comic-text-detector](https://huggingface.co/mayocream/comic-text-detector) для сегментации текста
- [PaddleOCR-VL-1.5](https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.5) для распознавания текста OCR
- [YuzuMarker.FontDetection](https://huggingface.co/fffonion/yuzumarker-font-detection) для определения шрифта и цвета

Модели будут автоматически загружены при первом запуске Koharu.

Мы конвертируем оригинальные модели в формат safetensors для лучшей производительности и совместимости с Rust. Конвертированные модели размещены на [Hugging Face](https://huggingface.co/mayocream).

## Установка

Вы можете скачать последний релиз Koharu со [страницы релизов](https://github.com/VladimirPozdnyakov/ocr/releases/latest).

Мы предоставляем предсобранные бинарники для Windows, macOS и Linux. Для других платформ может потребоваться сборка из исходников.

## Разработка

Для сборки Koharu из исходников:

### Требования

- [Rust](https://www.rust-lang.org/tools/install) (1.92 или новее)
- [Bun](https://bun.sh/) (1.0 или новее)

### Сборка

```bash
# Установка зависимостей
bun install

# Сборка UI
bun run --cwd ui build

# Сборка сервера
cargo build --release
```

Собранный бинарник будет находиться в `target/release/koharu` (или `koharu.exe` на Windows).

### Скрипты

```bash
# Linux/macOS - полная сборка и запуск
./scripts/build-and-run.sh

# Windows (PowerShell)
./scripts/build-and-run.ps1

# Диагностика системы
./scripts/diagnose.sh
```

## Репозитории

- [Репозиторий форка](https://github.com/VladimirPozdnyakov/ocr)
- [Репозиторий оригинала](https://github.com/mayocream/koharu)

## Лицензия

Koharu лицензирован под [GNU General Public License v3.0](LICENSE).
