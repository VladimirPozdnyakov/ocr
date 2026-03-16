use image::{DynamicImage, ImageFormat, GenericImageView, ImageReader};
use std::io::Cursor;
use anyhow::Result;
use base64::Engine;

/// Load an image from a file path or data URL
pub fn load_image_from_path(path: &str) -> Result<DynamicImage> {
    // For data URLs, we need to decode them
    if path.starts_with("data:image") {
        return load_image_from_data_url(path);
    }

    // For file paths
    ImageReader::open(path)?
        .with_guessed_format()?
        .decode()
        .map_err(Into::into)
}

/// Load an image from a base64 data URL
pub fn load_image_from_data_url(data_url: &str) -> Result<DynamicImage> {
    // Parse data URL format: data:image/<format>;base64,<data>
    let parts: Vec<&str> = data_url.split(',').collect();
    if parts.len() != 2 {
        return Err(anyhow::anyhow!("Invalid data URL format"));
    }

    let data = parts[1];

    // Decode base64
    let decoded_bytes = base64::engine::general_purpose::STANDARD.decode(data)?;

    // Load image from bytes
    let img = image::load_from_memory(&decoded_bytes)?;

    Ok(img)
}

/// Crop an image to the specified area
pub fn crop_image(
    image: &DynamicImage,
    x: u32,
    y: u32,
    width: u32,
    height: u32,
) -> Result<DynamicImage> {
    let x = x.min(image.width() - 1);
    let y = y.min(image.height() - 1);
    let width = width.min(image.width() - x);
    let height = height.min(image.height() - y);

    Ok(image.crop_imm(x, y, width, height))
}

/// Resize an image while maintaining aspect ratio
#[allow(dead_code)]
pub fn resize_image(
    image: &DynamicImage,
    max_width: u32,
    max_height: u32,
) -> DynamicImage {
    let (width, height) = image.dimensions();

    if width <= max_width && height <= max_height {
        return image.clone();
    }

    let scale = (max_width as f32 / width as f32).min(max_height as f32 / height as f32);
    let new_width = (width as f32 * scale).round() as u32;
    let new_height = (height as f32 * scale).round() as u32;

    image.resize(new_width, new_height, image::imageops::FilterType::Lanczos3)
}

/// Convert image to grayscale for OCR preprocessing
#[allow(dead_code)]
pub fn to_grayscale(image: &DynamicImage) -> DynamicImage {
    image.to_luma8().into()
}

/// Save image to bytes
#[allow(dead_code)]
pub fn image_to_bytes(image: &DynamicImage, format: ImageFormat) -> Result<Vec<u8>> {
    let mut bytes = Vec::new();
    image.write_to(&mut Cursor::new(&mut bytes), format)?;
    Ok(bytes)
}
