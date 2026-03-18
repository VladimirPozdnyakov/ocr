use async_trait::async_trait;
use image::DynamicImage;
use std::time::Instant;
use std::io::Cursor;
use std::process::Command;

use super::engine::{OCREngine, OCRConfig, OCRResult};

pub struct OrtheusEngine;

#[async_trait]
impl OCREngine for OrtheusEngine {
    async fn process_image(
        &self,
        image: &DynamicImage,
        config: &OCRConfig,
    ) -> Result<OCRResult, anyhow::Error> {
        let start = Instant::now();

        // Save image to temporary file
        let temp_dir = std::env::temp_dir();
        let temp_input = temp_dir.join(format!("ocr_input_{}.png", uuid::Uuid::new_v4().to_string()));
        let temp_output = temp_dir.join(format!("ocr_output_{}", uuid::Uuid::new_v4().to_string()));

        // Convert and save image
        let mut bytes = Vec::new();
        image.write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png)?;
        tokio::fs::write(&temp_input, &bytes).await
            .map_err(|e| anyhow::anyhow!("Failed to write temp image: {}", e))?;

        // Run Tesseract command
        let output = Command::new("tesseract")
            .arg(&temp_input)
            .arg(&temp_output)
            .arg("-l")
            .arg(&config.language)
            .arg("--psm")
            .arg("6")  // Assume a single uniform block of text
            .output()
            .map_err(|e| anyhow::anyhow!("Failed to execute Tesseract: {}. Make sure Tesseract OCR is installed.", e))?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("Tesseract failed: {}. Make sure language data for '{}' is installed.", error_msg, config.language);
        }

        // Read the result
        let txt_path = temp_output.with_extension("txt");
        let text = tokio::fs::read_to_string(&txt_path).await
            .map_err(|e| anyhow::anyhow!("Failed to read Tesseract output: {}", e))?;

        // Clean up temporary files
        let _ = tokio::fs::remove_file(&temp_input).await;
        let _ = tokio::fs::remove_file(&txt_path).await;

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
        "Tesseract OCR"
    }

    fn supported_languages(&self) -> Vec<String> {
        vec![
            "eng".to_string(),    // English
            "kor".to_string(),    // Korean
            "jpn".to_string(),    // Japanese
            "chi_sim".to_string(), // Chinese Simplified
            "chi_tra".to_string(), // Chinese Traditional
        ]
    }

    fn is_available(&self) -> bool {
        // Check if Tesseract is available by running it
        Command::new("tesseract")
            .arg("--version")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }
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
        .filter(|c| c.is_alphanumeric() || c.is_whitespace())
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

    // Base confidence with adjustments
    let base_confidence = 0.85;
    let confidence = base_confidence * meaningful_ratio * length_factor;

    confidence.clamp(0.0, 1.0)
}
