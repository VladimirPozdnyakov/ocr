# Koharu

[日本語](./docs/README.ja.md) | [简体中文](./docs/README.zh-CN.md) | [Русский](./docs/README.ru.md)

ML-powered manga translator, written in **Rust**.

Koharu introduces a new workflow for manga translation, utilizing the power of ML to automate the process. It combines the capabilities of object detection, OCR, inpainting, and LLMs to create a seamless translation experience.

Under the hood, Koharu uses [candle](https://github.com/huggingface/candle) for high-performance inference. All components are written in Rust, ensuring safety and speed.

> [!NOTE]
> Koharu runs its vision models and local LLMs **locally** on your machine by default. If you choose a remote LLM provider, Koharu sends translation text only to the provider you configured. Koharu itself does not collect user data.

---

![screenshot](assets/koharu-screenshot-en.png)

> [!NOTE]
> For help and support, please join our [Discord server](https://discord.gg/mHvHkxGnUY).

## Features

- Automatic speech bubble detection and segmentation
- OCR for manga text recognition
- Inpainting to remove original text from images
- LLM-powered translation
- Vertical text layout for CJK languages
- Export to layered PSD with editable text
- MCP server for AI agents

## Running

Koharu runs as a web application with a Rust backend server.

### Quick Start

```bash
# Install dependencies
bun install

# Build UI
bun run --cwd ui build

# Run server
cargo run --release
```

Open http://127.0.0.1:3000 in your browser.

### Command Line Options

```bash
# Show help
cargo run --release -- --help

# Custom port
cargo run --release -- --port 8080

# Access from network
cargo run --release -- --host 0.0.0.0 --port 8080

# CPU-only mode
cargo run --release -- --cpu

# Download models only
cargo run --release -- --download
```

### Development Mode

Run UI and server separately for hot reload:

**Terminal 1:**

```bash
bun run --cwd ui dev
```

**Terminal 2:**

```bash
cargo run --release
```

## Usage

### Hot keys

- <kbd>Ctrl</kbd> + Mouse Wheel: Zoom in/out
- <kbd>Ctrl</kbd> + Drag: Pan the canvas
- <kbd>Del</kbd>: Delete selected text block

### Export

Koharu can export the current page as a rendered image or as a layered Photoshop PSD. PSD export preserves helper layers and writes translated text as editable text layers for further cleanup in Photoshop.

### MCP Server

Koharu has a built-in MCP server that can be used to integrate with AI agents.

```bash
cargo run --release -- --port 9999
```

Input `http://localhost:9999/mcp` into the MCP server URL field in your AI agent.

## GPU acceleration

CUDA and Metal are supported for GPU acceleration, significantly improving performance on supported hardware.

### CUDA

Koharu is built with CUDA support, allowing it to leverage the power of NVIDIA GPUs for faster processing.

Koharu bundles CUDA toolkit 13.1 and cuDNN 9.19, dylibs will be automatically extracted to the application data directory on first run.

> [!NOTE]
> Please ensure that your system has the latest NVIDIA drivers installed. You can download the latest drivers via [NVIDIA App](https://www.nvidia.com/en-us/software/nvidia-app/).

#### Supported NVIDIA GPUs

Koharu supports NVIDIA GPUs with compute capability 7.5 or higher.

Please make sure your GPU is supported by checking the [CUDA GPU Compute Capability](https://developer.nvidia.com/cuda-gpus) and the [cuDNN Support Matrix](https://docs.nvidia.com/deeplearning/cudnn/backend/latest/reference/support-matrix.html).

### Metal

Koharu supports Metal for GPU acceleration on macOS with Apple Silicon (M1, M2, etc.). This allows Koharu to run efficiently on a wide range of Apple devices.

### CPU fallback

You can always force Koharu to use CPU for inference:

```bash
cargo run --release -- --cpu
```

## ML Models

Koharu relies on a mixin of computer vision and natural language processing models to perform its tasks.

### Computer Vision Models

Koharu uses several pre-trained models for different tasks:

- [PP-DocLayoutV3](https://huggingface.co/PaddlePaddle/PP-DocLayoutV3_safetensors) for text detection and layout analysis
- [comic-text-detector](https://huggingface.co/mayocream/comic-text-detector) for text segmentation
- [PaddleOCR-VL-1.5](https://huggingface.co/PaddlePaddle/PaddleOCR-VL-1.5) for OCR text recognition
- [lama-manga](https://huggingface.co/mayocream/lama-manga) for inpainting
- [YuzuMarker.FontDetection](https://huggingface.co/fffonion/yuzumarker-font-detection) for font and color detection

The models will be automatically downloaded when you run Koharu for the first time.

We convert the original models to safetensors format for better performance and compatibility with Rust. The converted models are hosted on [Hugging Face](https://huggingface.co/mayocream).

### Large Language Models

Koharu supports both local and remote LLM backends, and preselects a model based on your system locale when possible.

#### Local LLMs

Koharu supports various quantized LLMs in GGUF format via [candle](https://github.com/huggingface/candle). These models run on your machine and are downloaded on demand when you select them in Settings.

#### Remote LLMs

Koharu can also translate through remote or self-hosted API providers. Supported remote providers:

- OpenAI
- Gemini
- Claude
- DeepSeek
- OpenAI Compatible (LM Studio, OpenRouter, etc.)

Remote providers are configured in **Settings > API Keys**.

## Installation

You can download the latest release of Koharu from the [releases page](https://github.com/mayocream/koharu/releases/latest).

We provide pre-built binaries for Windows, macOS, and Linux. For other platforms, you may need to build from source.

## Development

To build Koharu from source:

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (1.92 or later)
- [Bun](https://bun.sh/) (1.0 or later)

### Build

```bash
# Install dependencies
bun install

# Build UI
bun run --cwd ui build

# Build server
cargo build --release
```

The built binary will be located at `target/release/koharu` (or `koharu.exe` on Windows).

### Scripts

```bash
# Full build and run
./scripts/build-and-run.sh

# Diagnose system
./scripts/diagnose.sh
```

## Sponsorship

If you find Koharu useful, consider sponsoring the project to support its development!

- [GitHub Sponsors](https://github.com/sponsors/mayocream)
- [Patreon](https://www.patreon.com/mayocream)

## Contributors

<a href="https://github.com/mayocream/koharu/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mayocream/koharu" />
</a>

## License

Koharu is licensed under the [GNU General Public License v3.0](LICENSE).
