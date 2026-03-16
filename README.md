# OCR Desktop Application

A cross-platform desktop OCR application with support for multiple languages and OCR engines.

## Features

- **Multi-language Support**: English, Korean, Japanese, Chinese (Simplified & Traditional)
- **Multiple OCR Engines**: Ortheus, Theseus, MangaOCR
- **Area Selection**: Draw rectangles on images to OCR specific regions
- **Real-time Results**: See OCR results with confidence scores and processing times
- **Modern UI**: Built with React, TypeScript, and Material-UI

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Material-UI (MUI)
- **Backend**: Tauri 2.x (Rust)
- **State Management**: Zustand
- **Canvas**: react-konva (Konva.js)

## Project Structure

```
OCR/
├── src/                          # React + TypeScript + Vite
│   ├── components/
│   │   ├── ImageUploader.tsx     # Загрузка изображений
│   │   ├── ImageCanvas.tsx       # Canvas с выделением областей (react-konva)
│   │   ├── OCRControls.tsx       # Панель управления OCR
│   │   ├── ResultsPanel.tsx      # Отображение результатов
│   │   └── EngineSelector.tsx    # Выбор OCR движка
│   ├── hooks/
│   │   ├── useOCR.ts             # OCR логика
│   │   └── useTauriIPC.ts        # Tauri IPC коммуникация
│   ├── lib/
│   │   ├── types.ts              # TypeScript типы
│   │   └── constants.ts          # Константы (языки, движки)
│   ├── state/
│   │   └── store.ts              # Zustand store
│   ├── App.tsx
│   ├── main.tsx
│   └── App.css                   # MUI custom styles
├── src-tauri/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   └── ocr.rs            # Tauri команды для OCR
│   │   ├── ocr/
│   │   │   ├── mod.rs
│   │   │   ├── engine.rs         # Trait OCREngine
│   │   │   ├── ortheus.rs        # Ortheus интеграция
│   │   │   ├── theseus.rs        # Theseus интеграция
│   │   │   └── manga_ocr.rs      # MangaOCR интеграция
│   │   ├── utils/
│   │   │   ├── mod.rs
│   │   │   └── image.rs          # Обработка изображений
│   │   └── main.rs               # Tauri entry point
│   ├── Cargo.toml
│   └── tauri.conf.json
├── models/                        # OCR модели (gitignored)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Rust (latest stable)
- Tauri CLI

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run tauri:dev
```

3. Build for production:

```bash
npm run tauri:build
```

## Usage

1. **Upload an Image**: Click the "Choose File" button to select an image
2. **Draw Selection Areas**: Click and drag on the image to create OCR regions
3. **Configure OCR**: Select the OCR engine and language
4. **Process**: Click "Process Areas" to OCR the selected regions
5. **View Results**: Results appear in the panel below with confidence scores

## OCR Engines

### Ortheus
- Supports: English, Korean, Japanese, Chinese (Simplified & Traditional)
- High accuracy for general text

### Theseus
- Supports: English, Korean, Japanese, Chinese (Simplified)
- Optimized for printed text

### MangaOCR
- Supports: Japanese, English
- Specialized for manga and comics

## Development

### Frontend Development

```bash
npm run dev
```

### Backend Development

```bash
cd src-tauri
cargo build
```

## License

MIT
