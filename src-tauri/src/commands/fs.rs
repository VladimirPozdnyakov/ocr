use tauri::command;
use std::fs;
use std::path::Path;
use base64::Engine;

#[command]
pub async fn read_image_file(file_path: String) -> Result<String, String> {
    // Check if file exists
    if !Path::new(&file_path).exists() {
        return Err("File does not exist".to_string());
    }

    // Read file as binary
    let file_content = fs::read(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Get file extension to determine MIME type
    let extension = Path::new(&file_path)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("png");

    let mime_type = match extension {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "webp" => "image/webp",
        _ => "image/png",
    };

    // Convert to base64 using new API
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&file_content);

    // Return data URL
    Ok(format!("data:{};base64,{}", mime_type, base64_string))
}
