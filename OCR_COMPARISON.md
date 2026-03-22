# OCR Engine Selection Guide

Quick guide to help you choose the right OCR engine for your needs.

## Quick Decision Tree

```
Start
 │
 ├─ Is it manga/comics?
 │   └─ YES → Use **MangaOCR** 🎌
 │   └─ NO  → Continue
 │
 ├─ Text contains Asian characters (CJK)?
 │   └─ YES → Use **Theseus (PaddleOCR)** 🌏
 │   └─ NO  → Continue
 │
 ├─ Need speed over accuracy?
 │   └─ YES → Use **Ortheus (Tesseract)** ⚡
 │   └─ NO  → Use **Theseus (PaddleOCR)** 🎯
 │
 └─ Default: **Ortheus (Tesseract)** - Most compatible
```

## Detailed Comparison

| Aspect | Ortheus (Tesseract) | Theseus (PaddleOCR) | MangaOCR |
|--------|---------------------|---------------------|----------|
| **Speed** | ⭐⭐⭐⭐⭐ (Very Fast) | ⭐⭐⭐ (Medium) | ⭐⭐ (Slow) |
| **Accuracy (Latin)** | ⭐⭐⭐⭐ (Good) | ⭐⭐⭐⭐⭐ (Excellent) | ⭐⭐⭐ (Good) |
| **Accuracy (CJK)** | ⭐⭐⭐ (Fair) | ⭐⭐⭐⭐⭐ (Excellent) | ⭐⭐⭐⭐⭐ (Excellent for JP) |
| **Setup Difficulty** | ⭐ (Easy) | ⭐⭐ (Medium) | ⭐⭐⭐ (Harder) |
| **Setup Size** | ~50 MB | ~250 MB | ~600 MB |
| **GPU Support** | No | Yes (Optional) | Yes (Optional) |
| **Offline** | Yes | Yes | Yes |

## Language Support Matrix

| Language | Ortheus | Theseus | MangaOCR |
|----------|---------|---------|----------|
| **English** | ✅ Excellent | ✅ Excellent | ✅ Good |
| **Japanese** | ⚠️ Fair | ✅ Excellent | ✅ Excellent |
| **Korean** | ⚠️ Fair | ✅ Excellent | ❌ Limited |
| **Chinese (Simplified)** | ⚠️ Fair | ✅ Excellent | ❌ Limited |
| **Chinese (Traditional)** | ⚠️ Fair | ✅ Excellent | ❌ Limited |
| **Arabic** | ❌ No | ✅ Good | ❌ No |
| **Russian** | ❌ No | ✅ Good | ❌ No |
| **French** | ❌ No | ✅ Good | ❌ No |
| **German** | ❌ No | ✅ Good | ❌ No |
| **Spanish** | ❌ No | ✅ Good | ❌ No |

Legend:
- ✅ Excellent/Good - Works well
- ⚠️ Fair - Works but with limitations
- ❌ No/Limited - Not supported

## Use Case Examples

### 1. Scanning Document (English)
```
Best: Ortheus (Tesseract)
Why: Fast, accurate for Latin text, lightweight
Alternative: Theseus (PaddleOCR) if you need higher accuracy
```

### 2. Manga/Comic Page (Japanese)
```
Best: MangaOCR
Why: Specifically trained on manga, handles sound effects, vertical text
Alternative: Theseus (PaddleOCR) for better accuracy on clean text
```

### 3. Screenshot of Korean Game
```
Best: Theseus (PaddleOCR)
Why: Excellent CJK support, handles game UI well
Alternative: Ortheus if speed is critical
```

### 4. Mixed Layout (English + Chinese)
```
Best: Theseus (PaddleOCR)
Why: Best multi-language support, handles mixed scripts
```

### 5. Printed Book Page (Latin)
```
Best: Ortheus (Tesseract)
Why: Fast, accurate, no need for heavy models
Alternative: Theseus for slightly better accuracy
```

### 6. Anime Screenshot with Subtitles
```
Best: MangaOCR
Why: Optimized for anime-style text and backgrounds
Alternative: Theseus for cleaner results
```

## Performance Benchmarks

Approximate processing times for 1920x1080 image:

| Engine | Single Area | Full Image | Memory Usage |
|--------|-------------|------------|--------------|
| Ortheus | 0.5-2s | 3-10s | ~100 MB |
| Theseus | 2-5s | 10-30s | ~500 MB |
| MangaOCR | 5-15s | 30-90s | ~1.2 GB |

*Note: Times vary based on hardware, image complexity, and selected regions*

## Installation Requirements

### Ortheus (Tesseract)
```
OS: Linux/macOS/Windows
Install: System package manager
Size: ~50 MB
Dependencies: None (standalone)
```

### Theseus (PaddleOCR)
```
OS: Linux/macOS/Windows
Install: pip install paddleocr
Size: ~250 MB
Dependencies: Python 3.11+, PaddlePaddle, OpenCV
```

### MangaOCR
```
OS: Linux/macOS/Windows
Install: pip install manga-ocr
Size: ~600 MB
Dependencies: Python 3.11+, PyTorch
```

## When to Switch Engines

### Switch from Ortheus to Theseus when:
- Asian characters are not recognized correctly
- Accuracy is more important than speed
- You need languages beyond basic CJK
- Text has complex layouts or backgrounds

### Switch from Theseus to Ortheus when:
- Processing speed is critical
- You only need Latin text recognition
- Memory is limited
- Quick results are needed

### Use MangaOCR when:
- Processing manga/comics
- Text is in Japanese bubbles
- Anime screenshots with stylized text
- Vertical text layouts

## Troubleshooting

### Ortheus Issues
- **Problem**: Poor accuracy
- **Solution**: Increase image resolution, preprocess image (contrast, denoise)

### Theseus Issues
- **Problem**: Slow processing
- **Solution**: Use GPU version, reduce image size, select smaller areas

### MangaOCR Issues
- **Problem**: Not working
- **Solution**: Ensure PyTorch is properly installed, check Python version

## Tips for Best Results

1. **Image Quality**: Higher resolution = better accuracy
2. **Text Clarity**: Clean, high-contrast text works best
3. **Area Selection**: Smaller areas = faster processing
4. **Language Matching**: Select correct language for best results
5. **Preprocessing**: Crop to text region when possible
6. **Lighting**: Even lighting without shadows

## System Requirements

### Minimum (Ortheus only)
- CPU: Dual-core 2.0 GHz
- RAM: 2 GB
- Storage: 100 MB

### Recommended (All engines)
- CPU: Quad-core 3.0+ GHz
- RAM: 8 GB
- GPU: NVIDIA GPU with 4GB+ VRAM (for Theseus/MangaOCR)
- Storage: 2 GB

## Conclusion

**Default Choice**: Start with **Ortheus (Tesseract)**
- Most compatible, fastest, easiest to install

**Best Accuracy**: Use **Theseus (PaddleOCR)**
- Especially for Asian languages

**Manga/Comics**: Use **MangaOCR**
- Specifically designed for this use case

Remember: You can try all three engines and compare results! Each has its strengths.
