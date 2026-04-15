use std::{io::Cursor, path::PathBuf};

use image::{ImageFormat, RgbaImage};
use koharu_types::{Document, SerializableDynamicImage};
use rayon::iter::{IntoParallelIterator, ParallelIterator};

pub(crate) fn encode_image(image: &SerializableDynamicImage, ext: &str) -> anyhow::Result<Vec<u8>> {
    let mut buf = Vec::new();
    let mut cursor = Cursor::new(&mut buf);
    let format = ImageFormat::from_extension(ext).unwrap_or(ImageFormat::Jpeg);
    image.0.write_to(&mut cursor, format)?;
    Ok(buf)
}

pub(crate) fn mime_from_ext(ext: &str) -> &'static str {
    match ext {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        _ => "application/octet-stream",
    }
}

#[allow(dead_code)]
pub(crate) fn blank_rgba(
    width: u32,
    height: u32,
    color: image::Rgba<u8>,
) -> SerializableDynamicImage {
    let blank = RgbaImage::from_pixel(width, height, color);
    image::DynamicImage::ImageRgba8(blank).into()
}

pub fn load_documents(inputs: Vec<(PathBuf, Vec<u8>)>) -> anyhow::Result<Vec<Document>> {
    if inputs.is_empty() {
        return Ok(vec![]);
    }

    let results: Vec<Result<Vec<Document>, (String, anyhow::Error)>> = inputs
        .into_par_iter()
        .map(|(path, bytes)| {
            let name = path.to_string_lossy().to_string();
            Document::from_bytes(path, bytes).map_err(|err| (name, err))
        })
        .collect();

    let mut documents = Vec::new();
    let mut errors = Vec::new();

    for result in results {
        match result {
            Ok(docs) => documents.extend(docs),
            Err((name, err)) => {
                tracing::warn!(?err, "Failed to parse document");
                errors.push(format!("{name}: {err:#}"));
            }
        }
    }

    documents.sort_by_key(|doc| doc.name.clone());

    if documents.is_empty() && !errors.is_empty() {
        anyhow::bail!(
            "All {} file(s) failed to load:\n{}",
            errors.len(),
            errors.join("\n")
        );
    }

    if !errors.is_empty() {
        tracing::warn!(
            "Loaded {} document(s), {} failed: {}",
            documents.len(),
            errors.len(),
            errors.join("; ")
        );
    }

    Ok(documents)
}
