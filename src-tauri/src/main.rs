// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod ocr;
mod utils;

use commands::ocr::EngineRegistry;

fn main() {
    // Create the engine registry
    let engine_registry = EngineRegistry::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(engine_registry)
        .invoke_handler(tauri::generate_handler![
            commands::ocr::perform_ocr,
            commands::ocr::get_available_engines,
            commands::ocr::get_supported_languages,
            commands::fs::read_image_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
