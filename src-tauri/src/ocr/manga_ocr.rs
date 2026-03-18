use async_trait::async_trait;
use image::DynamicImage;
use std::io::Cursor;
use std::process::Command;
use std::time::Instant;

use super::engine::{OCREngine, OCRConfig, OCRResult};

pub struct MangaOCREngine;

#[async_trait]
impl OCREngine for MangaOCREngine {
    async fn process_image(
        &self,
        image: &DynamicImage,
        config: &OCRConfig,
    ) -> Result<OCRResult, anyhow::Error> {
        let start = Instant::now();

        // Save image to temporary file
        let temp_dir = std::env::temp_dir();
        let temp_input = temp_dir.join(format!("manga_ocr_input_{}.png", uuid::Uuid::new_v4()));

        // Convert and save image
        let mut bytes = Vec::new();
        image.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png)?;
        tokio::fs::write(&temp_input, &bytes).await
            .map_err(|e| anyhow::anyhow!("Failed to write temp image: {}", e))?;

        // Run MangaOCR via Python subprocess
        // MangaOCR is specialized for manga/comics with excellent Japanese text recognition

        // Try to use virtual environment Python if it exists
        let python_bin = if let Ok(home) = std::env::var("HOME") {
            let venv_python = format!("{}/.local/share/ocr-desktop/venv/bin/python", home);
            if std::path::Path::new(&venv_python).exists() {
                venv_python
            } else {
                "python3".to_string()
            }
        } else {
            "python3".to_string()
        };

        let output = Command::new(&python_bin)
            .arg("-c")
            .arg(format!(
                r#"
import sys
try:
    from manga_ocr import MangaOcr
    mocr = MangaOcr()
    result = mocr("{}")
    print(result)
except ImportError:
    print("ERROR: manga-ocr not installed. Run: npm run install:ocr", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"ERROR: {{e}}", file=sys.stderr)
    sys.exit(1)
"#,
                temp_input.display()
            ))
            .output()
            .map_err(|e| anyhow::anyhow!("Failed to execute Python ({}). Make sure Python 3 is installed: {}", python_bin, e))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("MangaOCR failed: {}. Make sure manga-ocr is installed (pip install manga-ocr).", error_msg);
        }

        // Parse the output
        let stdout = String::from_utf8_lossy(&output.stdout);
        let text = stdout.trim().to_string();

        // Clean up temporary file
        let _ = tokio::fs::remove_file(&temp_input).await;

        let processing_time_ms = start.elapsed().as_millis() as u64;

        if text.trim().is_empty() || text.contains("ERROR:") {
            anyhow::bail!("No text detected in the image. Make sure the image contains Japanese manga text.");
        }

        let confidence = calculate_manga_confidence(&text);

        Ok(OCRResult {
            text,
            confidence,
            engine: self.engine_name().to_string(),
            language: config.language.clone(),
            processing_time_ms,
        })
    }

    fn engine_name(&self) -> &str {
        "MangaOCR"
    }

    fn supported_languages(&self) -> Vec<String> {
        vec![
            "jpn".to_string(), // Primary language - Japanese
            "eng".to_string(), // English manga
        ]
    }

    fn is_available(&self) -> bool {
        // Try to use virtual environment Python if it exists
        let python_bin = if let Ok(home) = std::env::var("HOME") {
            let venv_python = format!("{}/.local/share/ocr-desktop/venv/bin/python", home);
            if std::path::Path::new(&venv_python).exists() {
                venv_python
            } else {
                "python3".to_string()
            }
        } else {
            "python3".to_string()
        };

        // Check if Python and manga-ocr are available
        let python_check = Command::new(&python_bin)
            .arg("--version")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false);

        if !python_check {
            return false;
        }

        // Check if manga-ocr is installed
        Command::new(&python_bin)
            .arg("-c")
            .arg("import manga_ocr")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }
}

/// Calculate confidence for manga OCR results
/// MangaOCR generally has high accuracy for manga text
fn calculate_manga_confidence(text: &str) -> f64 {
    if text.trim().is_empty() {
        return 0.0;
    }

    let total_chars = text.chars().count();
    if total_chars == 0 {
        return 0.0;
    }

    // Check for Japanese characters (Hiragana, Katakana, Kanji)
    let has_japanese = text.chars().any(|c| {
        matches!(c as u32,
            0x3040..=0x309F | // Hiragana
            0x30A0..=0x30FF | // Katakana
            0x4E00..=0x9FFF   // Kanji (CJK Unified Ideographs)
        )
    });

    // Calculate ratio of meaningful characters
    let meaningful_chars = text
        .chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace() || c.is_ascii_punctuation())
        .count();

    let meaningful_ratio = meaningful_chars as f64 / total_chars as f64;

    // Base confidence is higher for MangaOCR as it's specialized
    let base_confidence = if has_japanese {
        0.92 // Higher confidence for Japanese text
    } else {
        0.85 // Slightly lower for non-Japanese
    };

    // Penalize very short texts
    let length_factor = if total_chars < 5 {
        0.6
    } else if total_chars < 20 {
        0.8
    } else {
        1.0
    };

    let confidence = base_confidence * meaningful_ratio * length_factor;
    confidence.clamp(0.0, 1.0)
}
