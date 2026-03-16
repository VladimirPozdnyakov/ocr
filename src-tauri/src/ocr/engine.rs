use async_trait::async_trait;
use image::DynamicImage;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OCREngineType {
    Ortheus,
    Theseus,
    MangaOCR,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OCRConfig {
    pub engine: OCREngineType,
    pub language: String,
    pub confidence_threshold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OCRResult {
    pub text: String,
    pub confidence: f64,
    pub engine: String,
    pub language: String,
    pub processing_time_ms: u64,
}

#[async_trait]
pub trait OCREngine: Send + Sync {
    async fn process_image(
        &self,
        image: &DynamicImage,
        config: &OCRConfig,
    ) -> Result<OCRResult, anyhow::Error>;

    fn engine_name(&self) -> &str;

    fn supported_languages(&self) -> Vec<String> {
        vec!["eng".to_string(), "kor".to_string(), "jpn".to_string()]
    }

    fn is_available(&self) -> bool {
        true
    }
}
