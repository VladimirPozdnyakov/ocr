use tauri::State;

use crate::ocr::engine::{OCREngine, OCREngineType, OCRConfig, OCRResult};
use crate::ocr::ortheus::OrtheusEngine;
use crate::ocr::theseus::TheseusEngine;
use crate::ocr::manga_ocr::MangaOCREngine;
use crate::utils::image as img_utils;

// Engine registry
pub struct EngineRegistry {
    ortheus: OrtheusEngine,
    theseus: TheseusEngine,
    manga_ocr: MangaOCREngine,
}

impl EngineRegistry {
    pub fn new() -> Self {
        Self {
            ortheus: OrtheusEngine,
            theseus: TheseusEngine,
            manga_ocr: MangaOCREngine,
        }
    }

    fn get_engine(&self, engine_type: &OCREngineType) -> Option<&dyn OCREngine> {
        match engine_type {
            OCREngineType::Ortheus => Some(&self.ortheus),
            OCREngineType::Theseus => Some(&self.theseus),
            OCREngineType::MangaOCR => Some(&self.manga_ocr),
        }
    }
}

#[tauri::command]
pub async fn perform_ocr(
    imagePath: String,
    engineType: OCREngineType,
    language: String,
    area: Option<(u32, u32, u32, u32)>, // (x, y, width, height)
    registry: State<'_, EngineRegistry>,
) -> Result<OCRResult, String> {
    // Load the image
    let image = img_utils::load_image_from_path(&imagePath)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    // Crop if area is specified
    let processed_image = if let Some((x, y, width, height)) = area {
        img_utils::crop_image(&image, x, y, width, height)
            .map_err(|e| format!("Failed to crop image: {}", e))?
    } else {
        image
    };

    // Create OCR config
    let config = OCRConfig {
        engine: engineType.clone(),
        language,
        confidence_threshold: 0.7,
    };

    // Get the appropriate engine
    let engine = registry
        .get_engine(&engineType)
        .ok_or_else(|| format!("Engine {:?} not available", engineType))?;

    // Perform OCR
    let result = engine
        .process_image(&processed_image, &config)
        .await
        .map_err(|e| format!("OCR processing failed: {}", e))?;

    Ok(result)
}

#[tauri::command]
pub async fn get_available_engines(
    registry: State<'_, EngineRegistry>,
) -> Result<Vec<OCREngineType>, String> {
    let mut engines = Vec::new();

    if registry.ortheus.is_available() {
        engines.push(OCREngineType::Ortheus);
    }
    if registry.theseus.is_available() {
        engines.push(OCREngineType::Theseus);
    }
    if registry.manga_ocr.is_available() {
        engines.push(OCREngineType::MangaOCR);
    }

    Ok(engines)
}

#[tauri::command]
pub async fn get_supported_languages(
    engine: OCREngineType,
    registry: State<'_, EngineRegistry>,
) -> Result<Vec<String>, String> {
    let engine = registry
        .get_engine(&engine)
        .ok_or_else(|| format!("Engine {:?} not available", engine))?;

    Ok(engine.supported_languages())
}
