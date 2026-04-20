#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod tray;
mod commands;
mod pet;
mod database;

use database::Database;

fn main() {
    let db = Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(db)
        .invoke_handler(tauri::generate_handler![
            commands::get_pet_state,
            commands::set_pet_name,
            commands::save_position,
            commands::get_mouse_position,
        ])
        .setup(|app| {
            tray::create_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
