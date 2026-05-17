pub mod commands;
pub mod events;
pub mod parse;
pub mod protocol;
pub mod views;

mod effect;
mod font;
mod image;

pub use commands::*;
pub use effect::TextShaderEffect;
pub use events::*;
pub use font::{FontPrediction, NamedFontPrediction, TextDirection};
pub use image::SerializableDynamicImage;
pub use protocol::*;

use std::{path::PathBuf, sync::Arc};

use ::image::GenericImageView;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;
use ts_rs::TS;
use uuid::Uuid;

/// Maximum allowed image dimension (width or height) in pixels.
const MAX_IMAGE_DIMENSION: u32 = 16384;
/// Minimum allowed image dimension in pixels.
const MIN_IMAGE_DIMENSION: u32 = 1;
/// Maximum allowed image file size in bytes (500 MB).
const MAX_IMAGE_FILE_SIZE: usize = 500 * 1024 * 1024;
/// Minimum file size in bytes to be considered a valid image (arbitrary lower bound
/// that rejects empty or near-empty payloads).
const MIN_IMAGE_FILE_SIZE: usize = 16;

/// Supported image file extensions for import.
pub const SUPPORTED_EXTENSIONS: &[&str] = &[
    "png", "jpg", "jpeg", "webp", "bmp", "tiff", "tif", "gif", "ico", "avif",
];

/// Validate that raw bytes look like a plausible image file before passing them
/// to the `image` crate for full decoding.
///
/// Checks: non-empty, below size limit, magic bytes match a known format.
pub fn validate_image_bytes(bytes: &[u8]) -> anyhow::Result<()> {
    if bytes.len() < MIN_IMAGE_FILE_SIZE {
        anyhow::bail!(
            "File too small ({} bytes), minimum is {} bytes",
            bytes.len(),
            MIN_IMAGE_FILE_SIZE
        );
    }
    if bytes.len() > MAX_IMAGE_FILE_SIZE {
        anyhow::bail!(
            "File too large ({} bytes), maximum is {} bytes",
            bytes.len(),
            MAX_IMAGE_FILE_SIZE
        );
    }

    if !magic_bytes::is_supported_format(bytes) {
        anyhow::bail!(
            "Unrecognized image format (magic bytes: {:02x?})",
            &bytes[..bytes.len().min(8)]
        );
    }
    Ok(())
}

/// Magic bytes for image format detection
mod magic_bytes {
    /// Check if bytes represent a JPEG image.
    pub fn is_jpeg(bytes: &[u8]) -> bool {
        bytes.len() >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF
    }

    /// Check if bytes represent a PNG image.
    pub fn is_png(bytes: &[u8]) -> bool {
        bytes.len() >= 8 && bytes[..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
    }

    /// Check if bytes represent a GIF image.
    pub fn is_gif(bytes: &[u8]) -> bool {
        bytes.len() >= 6 && (bytes[..6] == *b"GIF87a" || bytes[..6] == *b"GIF89a")
    }

    /// Check if bytes represent a BMP image.
    pub fn is_bmp(bytes: &[u8]) -> bool {
        bytes.len() >= 2 && bytes[0] == 0x42 && bytes[1] == 0x4D
    }

    /// Check if bytes represent a WebP image.
    pub fn is_webp(bytes: &[u8]) -> bool {
        bytes.len() >= 12 && bytes[8..12] == *b"WEBP" && bytes[..4] == [0x52, 0x49, 0x46, 0x46]
    }

    /// Check if bytes represent a little-endian TIFF image.
    pub fn is_tiff_le(bytes: &[u8]) -> bool {
        bytes.len() >= 4
            && bytes[0] == 0x49
            && bytes[1] == 0x49
            && bytes[2] == 0x2A
            && bytes[3] == 0x00
    }

    /// Check if bytes represent a big-endian TIFF image.
    pub fn is_tiff_be(bytes: &[u8]) -> bool {
        bytes.len() >= 4
            && bytes[0] == 0x4D
            && bytes[1] == 0x4D
            && bytes[2] == 0x00
            && bytes[3] == 0x2A
    }

    /// Check if bytes represent an AVIF/HEIF image.
    pub fn is_avif_heif(bytes: &[u8]) -> bool {
        if bytes.len() < 12 || bytes[4..8] != *b"ftyp" {
            return false;
        }
        let brand = &bytes[8..12];
        matches!(brand, b"avif" | b"avis" | b"heic" | b"mif1")
    }

    /// Check if bytes represent an ICO image.
    pub fn is_ico(bytes: &[u8]) -> bool {
        bytes.len() >= 4
            && bytes[0] == 0x00
            && bytes[1] == 0x00
            && (bytes[2] == 0x01 || bytes[2] == 0x02)
            && bytes[3] == 0x00
    }

    /// Check if bytes represent a supported image format.
    pub fn is_supported_format(bytes: &[u8]) -> bool {
        let header = &bytes[..bytes.len().min(12)];
        is_jpeg(header)
            || is_png(header)
            || is_gif(header)
            || is_bmp(header)
            || is_webp(header)
            || is_tiff_le(header)
            || is_tiff_be(header)
            || is_avif_heif(header)
            || is_ico(header)
    }
}

/// Validate that a file extension is a supported image format.
pub fn is_supported_image_extension(ext: &str) -> bool {
    let ext_lower = ext.to_ascii_lowercase();
    SUPPORTED_EXTENSIONS.contains(&ext_lower.as_str())
}

/// Validate that the dimensions of a decoded image are within acceptable bounds.
pub fn validate_image_dimensions(width: u32, height: u32) -> anyhow::Result<()> {
    if width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION {
        anyhow::bail!(
            "Image dimensions too small: {width}x{height}, minimum is {MIN_IMAGE_DIMENSION}x{MIN_IMAGE_DIMENSION}"
        );
    }
    if width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION {
        anyhow::bail!(
            "Image dimensions too large: {width}x{height}, maximum is {MAX_IMAGE_DIMENSION}x{MAX_IMAGE_DIMENSION}"
        );
    }
    Ok(())
}

/// Validate geometry values for text block creation/patching.
/// Rejects NaN, Infinity, negative values, and zero-size dimensions.
pub fn validate_text_block_geometry(x: f32, y: f32, width: f32, height: f32) -> anyhow::Result<()> {
    if !x.is_finite() || !y.is_finite() || !width.is_finite() || !height.is_finite() {
        anyhow::bail!(
            "Text block geometry contains non-finite values: x={x}, y={y}, width={width}, height={height}"
        );
    }
    if x < 0.0 || y < 0.0 {
        anyhow::bail!("Text block position cannot be negative: x={x}, y={y}");
    }
    if width <= 0.0 || height <= 0.0 {
        anyhow::bail!("Text block dimensions must be positive: width={width}, height={height}");
    }
    Ok(())
}

fn new_text_block_id() -> String {
    Uuid::new_v4().to_string()
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextBlock {
    #[serde(default = "new_text_block_id")]
    pub id: String,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
    pub confidence: f32,
    pub line_polygons: Option<Vec<[[f32; 2]; 4]>>,
    pub source_direction: Option<TextDirection>,
    pub rendered_direction: Option<TextDirection>,
    pub rotation_deg: Option<f32>,
    pub detected_font_size_px: Option<f32>,
    pub detector: Option<String>,
    pub text: Option<String>,
    pub style: Option<TextStyle>,
    pub font_prediction: Option<FontPrediction>,
    pub rendered: Option<SerializableDynamicImage>,
    #[serde(skip)]
    pub lock_layout_box: bool,
    #[serde(skip)]
    pub layout_seed_x: Option<f32>,
    #[serde(skip)]
    pub layout_seed_y: Option<f32>,
    #[serde(skip)]
    pub layout_seed_width: Option<f32>,
    #[serde(skip)]
    pub layout_seed_height: Option<f32>,
}

impl TextBlock {
    pub fn ensure_id(&mut self) {
        if self.id.trim().is_empty() {
            self.id = new_text_block_id();
        }
    }

    pub fn set_layout_seed(&mut self, x: f32, y: f32, width: f32, height: f32) {
        self.layout_seed_x = Some(x);
        self.layout_seed_y = Some(y);
        self.layout_seed_width = Some(width.max(1.0));
        self.layout_seed_height = Some(height.max(1.0));
    }

    pub fn seed_layout_box(&mut self) -> (f32, f32, f32, f32) {
        match (
            self.layout_seed_x,
            self.layout_seed_y,
            self.layout_seed_width,
            self.layout_seed_height,
        ) {
            (Some(x), Some(y), Some(width), Some(height))
                if width.is_finite() && height.is_finite() && width > 0.0 && height > 0.0 =>
            {
                (x, y, width, height)
            }
            _ => {
                self.set_layout_seed(self.x, self.y, self.width, self.height);
                (self.x, self.y, self.width.max(1.0), self.height.max(1.0))
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, JsonSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct TextStrokeStyle {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_stroke_color")]
    pub color: [u8; 4],
    #[serde(default)]
    pub width_px: Option<f32>,
}

impl Default for TextStrokeStyle {
    fn default() -> Self {
        Self {
            enabled: true,
            color: [255, 255, 255, 255],
            width_px: None,
        }
    }
}

const fn default_true() -> bool {
    true
}

const fn default_stroke_color() -> [u8; 4] {
    [255, 255, 255, 255]
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default, TS, JsonSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub enum TextAlign {
    #[default]
    Left,
    Center,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, JsonSchema)]
#[serde(rename_all = "camelCase")]
#[ts(export)]
pub struct TextStyle {
    pub font_families: Vec<String>,
    pub font_size: Option<f32>,
    pub color: [u8; 4],
    pub effect: Option<TextShaderEffect>,
    pub stroke: Option<TextStrokeStyle>,
    #[serde(default)]
    pub text_align: Option<TextAlign>,
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Document {
    pub id: String,
    pub path: PathBuf,
    pub name: String,
    pub image: SerializableDynamicImage,
    pub width: u32,
    pub height: u32,
    #[serde(default)]
    pub revision: u64,
    pub text_blocks: Vec<TextBlock>,
    pub segment: Option<SerializableDynamicImage>,
}

impl Document {
    pub fn open(path: PathBuf) -> anyhow::Result<Self> {
        if !path.exists() {
            anyhow::bail!("File not found: {}", path.display());
        }

        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !ext.is_empty() && !is_supported_image_extension(ext) {
            anyhow::bail!(
                "Unsupported image format: .{ext}. Supported: {}",
                SUPPORTED_EXTENSIONS.join(", ")
            );
        }

        let bytes = std::fs::read(&path)?;

        let documents = Self::from_bytes(path, bytes)?;
        documents
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("No document found in file"))
    }

    pub fn from_bytes(path: impl Into<PathBuf>, bytes: Vec<u8>) -> anyhow::Result<Vec<Self>> {
        let path = path.into();

        // Validate file extension if present.
        if let Some(ext) = path.extension().and_then(|e| e.to_str())
            && !ext.is_empty()
            && !is_supported_image_extension(ext)
        {
            anyhow::bail!(
                "Unsupported image format: .{ext}. Supported: {}",
                SUPPORTED_EXTENSIONS.join(", ")
            );
        }

        // Validate raw bytes before expensive decode.
        validate_image_bytes(&bytes)?;

        Ok(vec![Self::image(path, bytes)?])
    }

    fn image(path: PathBuf, bytes: Vec<u8>) -> anyhow::Result<Self> {
        let img = ::image::load_from_memory(&bytes)?;
        let (width, height) = img.dimensions();
        validate_image_dimensions(width, height)?;
        let id = blake3::hash(&bytes).to_hex().to_string();
        let name = path
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        Ok(Document {
            id,
            path,
            name,
            image: SerializableDynamicImage(img),
            width,
            height,
            ..Default::default()
        })
    }

    pub fn ensure_text_block_ids(&mut self) {
        for block in &mut self.text_blocks {
            block.ensure_id();
        }
    }

    pub fn bump_revision(&mut self) {
        self.revision = self.revision.saturating_add(1);
    }

    pub fn prepare_for_store(&mut self) {
        self.ensure_text_block_ids();
    }
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct State {
    pub documents: Vec<Document>,
}

pub type AppState = Arc<RwLock<State>>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seed_layout_box_stays_stable_until_explicit_reset() {
        let mut block = TextBlock {
            x: 10.0,
            y: 20.0,
            width: 30.0,
            height: 40.0,
            ..Default::default()
        };

        let first = block.seed_layout_box();
        assert_eq!(first, (10.0, 20.0, 30.0, 40.0));

        block.x = 100.0;
        block.y = 200.0;
        block.width = 300.0;
        block.height = 400.0;

        let second = block.seed_layout_box();
        assert_eq!(second, first);

        block.set_layout_seed(block.x, block.y, block.width, block.height);
        let third = block.seed_layout_box();
        assert_eq!(third, (100.0, 200.0, 300.0, 400.0));
    }

    // --- validate_image_bytes tests ---

    #[test]
    fn validate_image_bytes_rejects_empty() {
        let result = validate_image_bytes(&[]);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("too small"));
    }

    #[test]
    fn validate_image_bytes_rejects_too_small() {
        let result = validate_image_bytes(&[0xFF; 8]);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("too small"));
    }

    #[test]
    fn validate_image_bytes_rejects_unrecognized_magic() {
        let data = vec![
            0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE, 0xBA, 0xBE, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00,
        ];
        let result = validate_image_bytes(&data);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Unrecognized"));
    }

    #[test]
    fn validate_image_bytes_accepts_jpeg_magic() {
        let mut data = vec![0xFF, 0xD8, 0xFF, 0xE0];
        data.extend_from_slice(&[0x00; 20]); // pad above MIN_IMAGE_FILE_SIZE
        assert!(validate_image_bytes(&data).is_ok());
    }

    #[test]
    fn validate_image_bytes_accepts_png_magic() {
        let mut data = vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        data.extend_from_slice(&[0x00; 20]);
        assert!(validate_image_bytes(&data).is_ok());
    }

    #[test]
    fn validate_image_bytes_accepts_webp_magic() {
        let mut data = vec![
            0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        ];
        data.extend_from_slice(&[0x00; 20]);
        assert!(validate_image_bytes(&data).is_ok());
    }

    #[test]
    fn validate_image_bytes_accepts_gif_magic() {
        let mut data = b"GIF89a".to_vec();
        data.extend_from_slice(&[0x00; 20]);
        assert!(validate_image_bytes(&data).is_ok());
    }

    #[test]
    fn validate_image_bytes_accepts_bmp_magic() {
        let mut data = b"BM".to_vec();
        data.extend_from_slice(&[0x00; 20]);
        assert!(validate_image_bytes(&data).is_ok());
    }

    // --- validate_image_dimensions tests ---

    #[test]
    fn validate_image_dimensions_accepts_normal() {
        assert!(validate_image_dimensions(1920, 1080).is_ok());
        assert!(validate_image_dimensions(1, 1).is_ok());
    }

    #[test]
    fn validate_image_dimensions_rejects_zero() {
        assert!(validate_image_dimensions(0, 100).is_err());
        assert!(validate_image_dimensions(100, 0).is_err());
    }

    #[test]
    fn validate_image_dimensions_rejects_oversized() {
        assert!(validate_image_dimensions(20000, 100).is_err());
        assert!(validate_image_dimensions(100, 20000).is_err());
    }

    // --- validate_text_block_geometry tests ---

    #[test]
    fn validate_text_block_geometry_accepts_valid() {
        assert!(validate_text_block_geometry(10.0, 20.0, 100.0, 50.0).is_ok());
    }

    #[test]
    fn validate_text_block_geometry_rejects_nan() {
        assert!(validate_text_block_geometry(f32::NAN, 0.0, 10.0, 10.0).is_err());
        assert!(validate_text_block_geometry(0.0, f32::NAN, 10.0, 10.0).is_err());
        assert!(validate_text_block_geometry(0.0, 0.0, f32::NAN, 10.0).is_err());
        assert!(validate_text_block_geometry(0.0, 0.0, 10.0, f32::NAN).is_err());
    }

    #[test]
    fn validate_text_block_geometry_rejects_infinity() {
        assert!(validate_text_block_geometry(f32::INFINITY, 0.0, 10.0, 10.0).is_err());
        assert!(validate_text_block_geometry(0.0, 0.0, 10.0, f32::INFINITY).is_err());
    }

    #[test]
    fn validate_text_block_geometry_rejects_negative_position() {
        assert!(validate_text_block_geometry(-1.0, 0.0, 10.0, 10.0).is_err());
        assert!(validate_text_block_geometry(0.0, -1.0, 10.0, 10.0).is_err());
    }

    #[test]
    fn validate_text_block_geometry_rejects_zero_or_negative_size() {
        assert!(validate_text_block_geometry(0.0, 0.0, 0.0, 10.0).is_err());
        assert!(validate_text_block_geometry(0.0, 0.0, 10.0, 0.0).is_err());
        assert!(validate_text_block_geometry(0.0, 0.0, -5.0, 10.0).is_err());
        assert!(validate_text_block_geometry(0.0, 0.0, 10.0, -5.0).is_err());
    }

    // --- is_supported_image_extension tests ---

    #[test]
    fn supported_extensions() {
        assert!(is_supported_image_extension("png"));
        assert!(is_supported_image_extension("jpg"));
        assert!(is_supported_image_extension("jpeg"));
        assert!(is_supported_image_extension("webp"));
        assert!(is_supported_image_extension("bmp"));
        assert!(is_supported_image_extension("tiff"));
        assert!(is_supported_image_extension("tif"));
        assert!(is_supported_image_extension("gif"));
        assert!(is_supported_image_extension("PNG")); // case insensitive
        assert!(!is_supported_image_extension("pdf"));
        assert!(!is_supported_image_extension("txt"));
        assert!(!is_supported_image_extension("exe"));
    }

    // --- from_bytes extension validation tests ---

    #[test]
    fn from_bytes_rejects_unsupported_extension() {
        let data = vec![0xFF, 0xD8, 0xFF, 0xE0];
        let result = Document::from_bytes("test.pdf", data);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Unsupported"));
    }

    #[test]
    fn from_bytes_rejects_too_small_file() {
        let result = Document::from_bytes("test.png", vec![0x89, 0x50]);
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("too small"));
    }
}
