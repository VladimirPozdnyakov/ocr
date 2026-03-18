use async_trait::async_trait;
use image::DynamicImage;
use std::io::Cursor;
use std::process::Command;
use std::time::Instant;

use super::engine::{OCREngine, OCRConfig, OCRResult};

pub struct TheseusEngine;

#[async_trait]
impl OCREngine for TheseusEngine {
    async fn process_image(
        &self,
        image: &DynamicImage,
        config: &OCRConfig,
    ) -> Result<OCRResult, anyhow::Error> {
        let start = Instant::now();

        // Save image to temporary file
        let temp_dir = std::env::temp_dir();
        let temp_input = temp_dir.join(format!("theseus_input_{}.png", uuid::Uuid::new_v4()));

        // Convert and save image
        let mut bytes = Vec::new();
        image.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png)?;
        tokio::fs::write(&temp_input, &bytes).await
            .map_err(|e| anyhow::anyhow!("Failed to write temp image: {}", e))?;

        // Run PaddleOCR command
        // Theseus uses PaddleOCR which provides better accuracy for Asian languages

        // Try to use wrapper script from virtual environment first
        let paddleocr_cmd = if let Ok(home) = std::env::var("HOME") {
            let wrapper_path = format!("{}/.local/bin/paddleocr", home);
            if std::path::Path::new(&wrapper_path).exists() {
                wrapper_path
            } else {
                "paddleocr".to_string()
            }
        } else {
            "paddleocr".to_string()
        };

        let output = Command::new(&paddleocr_cmd)
            .arg("--lang")
            .arg(map_language_code(&config.language))
            .arg("--image_dir")
            .arg(&temp_input)
            .arg("--use_angle_cls")
            .arg("true")
            .output()
            .map_err(|e| anyhow::anyhow!("Failed to execute PaddleOCR ({}): {}. Make sure PaddleOCR is installed (npm run install:ocr).", paddleocr_cmd, e))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("PaddleOCR failed: {}. Make sure PaddleOCR and dependencies are properly installed.", error_msg);
        }

        // Parse the output
        let stdout = String::from_utf8_lossy(&output.stdout);
        let text = parse_paddleocr_output(&stdout);

        // Clean up temporary file
        let _ = tokio::fs::remove_file(&temp_input).await;

        let processing_time_ms = start.elapsed().as_millis() as u64;

        if text.trim().is_empty() {
            anyhow::bail!("No text detected in the image. Try adjusting the image quality or selection area.");
        }

        let confidence = calculate_confidence(&text);

        Ok(OCRResult {
            text: text.trim().to_string(),
            confidence,
            engine: self.engine_name().to_string(),
            language: config.language.clone(),
            processing_time_ms,
        })
    }

    fn engine_name(&self) -> &str {
        "PaddleOCR (Theseus)"
    }

    fn supported_languages(&self) -> Vec<String> {
        vec![
            "eng".to_string(),    // English
            "kor".to_string(),    // Korean
            "jpn".to_string(),    // Japanese
            "chi_sim".to_string(), // Chinese Simplified
            "chi_tra".to_string(), // Chinese Traditional
            "ar".to_string(),     // Arabic
            "ru".to_string(),     // Russian
            "fr".to_string(),     // French
            "ger".to_string(),    // German
            "spa".to_string(),    // Spanish
        ]
    }

    fn is_available(&self) -> bool {
        // Check if PaddleOCR is available
        // Try wrapper script first (from virtual environment)
        if let Ok(home) = std::env::var("HOME") {
            let wrapper_path = format!("{}/.local/bin/paddleocr", home);
            if std::path::Path::new(&wrapper_path).exists() {
                return Command::new(&wrapper_path)
                    .arg("--help")
                    .output()
                    .map(|output| output.status.success())
                    .unwrap_or(false);
            }
        }

        // Fallback to system paddleocr
        Command::new("paddleocr")
            .arg("--help")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }
}

/// Map our language codes to PaddleOCR language codes
fn map_language_code(lang: &str) -> &str {
    match lang {
        "eng" => "en",
        "chi_sim" => "ch",
        "chi_tra" => "chinese_cht",
        "kor" => "korean",
        "jpn" => "japan",
        "ar" => "ar",
        "ru" => "ru",
        "fr" => "french",
        "ger" => "german",
        "spa" => "span",
        _ => "en", // Default to English
    }
}

/// Parse PaddleOCR output to extract text
/// PaddleOCR outputs in format: [[[[x1,y1],[x2,y2],[x3,y3],[x4,y4]], ('text', confidence)], ...]
fn parse_paddleocr_output(output: &str) -> String {
    let mut text_lines = Vec::new();

    // PaddleOCR outputs text lines with their bounding boxes
    // We need to extract just the text part
    for line in output.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('[') {
            continue;
        }

        // Extract text between quotes if present
        if let Some(start) = trimmed.find('\'') {
            if let Some(end) = trimmed.rfind('\'') {
                if start < end {
                    let text = &trimmed[start + 1..end];
                    if !text.is_empty() && text.len() > 1 {
                        text_lines.push(text.to_string());
                    }
                }
            }
        } else if !trimmed.starts_with('{') && !trimmed.starts_with('[') {
            // If no quotes, just take the line as-is if it looks like text
            let cleaned = trimmed
                .replace(['[', ']', ',', '(', ')'], " ")
                .split_whitespace()
                .collect::<Vec<_>>()
                .join(" ");

            if !cleaned.is_empty() && cleaned.len() > 2 {
                text_lines.push(cleaned);
            }
        }
    }

    // If no text extracted, try to extract from the raw output
    if text_lines.is_empty() {
        // Look for text patterns in the output
        // Use raw string with different quote chars to avoid escaping issues
        let re = regex::Regex::new(r#"\(\s*['"]([^'"]+)['"]\s*,\s*[0-9.]+\s*\)"#).unwrap();
        for caps in re.captures_iter(output) {
            if let Some(text) = caps.get(1) {
                let text_str = text.as_str().trim();
                if !text_str.is_empty() {
                    text_lines.push(text_str.to_string());
                }
            }
        }
    }

    text_lines.join(" ")
}

/// Calculate confidence based on text quality metrics
fn calculate_confidence(text: &str) -> f64 {
    if text.trim().is_empty() {
        return 0.0;
    }

    let total_chars = text.chars().count();
    if total_chars == 0 {
        return 0.0;
    }

    // Calculate ratio of printable/meaningful characters
    let meaningful_chars = text
        .chars()
        .filter(|c| c.is_alphanumeric() || c.is_whitespace() || c.is_ascii_punctuation())
        .count();

    let meaningful_ratio = meaningful_chars as f64 / total_chars as f64;

    // Penalize very short texts
    let length_factor = if total_chars < 10 {
        0.5
    } else if total_chars < 50 {
        0.8
    } else {
        1.0
    };

    // Base confidence with adjustments (PaddleOCR is generally accurate)
    let base_confidence = 0.90;
    let confidence = base_confidence * meaningful_ratio * length_factor;

    confidence.clamp(0.0, 1.0)
}
