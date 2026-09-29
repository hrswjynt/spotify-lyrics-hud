pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::set_click_through,
            commands::set_overlay_geometry,
            commands::set_overlay_visibility,
            commands::set_overlay_z_order,
            commands::get_native_monitors,
            commands::query_spotify_mpris,
            commands::control_spotify_mpris
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
