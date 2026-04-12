use std::{env, fs, path::Path, path::PathBuf, sync::Arc};

use koharu_rpc::server::{Asset, SharedAssetResolver};

static UI_DIST_DIR: &str = "ui/out";

fn find_ui_dist() -> PathBuf {
    if let Ok(manifest_dir) = env::var("CARGO_MANIFEST_DIR")
        && let Some(path) = PathBuf::from(&manifest_dir)
            .parent()
            .map(|p| p.join(UI_DIST_DIR))
        && path.exists()
    {
        return path;
    }

    let current_dir = env::current_dir().unwrap_or_default();
    let path = current_dir.join(UI_DIST_DIR);
    if path.exists() {
        return path;
    }

    PathBuf::from(UI_DIST_DIR)
}

fn mime_type(path: &str) -> String {
    let path_lower = path.to_lowercase();

    if path_lower.ends_with(".html") || path_lower.ends_with(".htm") {
        return "text/html; charset=utf-8".to_string();
    }
    if path_lower.ends_with(".css") {
        return "text/css; charset=utf-8".to_string();
    }
    if path_lower.ends_with(".js") || path_lower.ends_with(".mjs") {
        return "application/javascript; charset=utf-8".to_string();
    }
    if path_lower.ends_with(".json") {
        return "application/json; charset=utf-8".to_string();
    }
    if path_lower.ends_with(".png") {
        return "image/png".to_string();
    }
    if path_lower.ends_with(".jpg") || path_lower.ends_with(".jpeg") {
        return "image/jpeg".to_string();
    }
    if path_lower.ends_with(".gif") {
        return "image/gif".to_string();
    }
    if path_lower.ends_with(".svg") {
        return "image/svg+xml".to_string();
    }
    if path_lower.ends_with(".ico") {
        return "image/x-icon".to_string();
    }
    if path_lower.ends_with(".woff") || path_lower.ends_with(".woff2") {
        return "font/woff2".to_string();
    }
    if path_lower.ends_with(".ttf") {
        return "font/ttf".to_string();
    }
    if path_lower.ends_with(".webp") {
        return "image/webp".to_string();
    }
    if path_lower.ends_with(".wasm") {
        return "application/wasm".to_string();
    }

    "application/octet-stream".to_string()
}

fn resolve_file(base: &Path, path: &str) -> Option<Asset> {
    let path = path.trim_start_matches('/');

    let candidates = [
        path.to_string(),
        format!("{path}.html"),
        format!("{path}/index.html"),
    ];

    for candidate in candidates {
        let full_path = base.join(&candidate);
        if full_path.exists()
            && full_path.is_file()
            && let Ok(bytes) = fs::read(&full_path)
        {
            return Some(Asset {
                bytes,
                mime_type: mime_type(&candidate),
            });
        }
    }

    None
}

pub fn filesystem_resolver() -> SharedAssetResolver {
    let base = find_ui_dist();
    tracing::info!("Serving static files from {}", base.display());

    Arc::new(move |path: &str| resolve_file(&base, path))
}
