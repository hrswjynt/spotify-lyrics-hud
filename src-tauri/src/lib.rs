pub mod commands;
pub mod tray;

use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let _ = app.emit("global-shortcut-pressed", shortcut.to_string());
                    }
                })
                .build(),
        )
        .setup(|app| {
            let _tray = tray::create_tray(app.handle())?;
            for sc_str in [
                "Ctrl+Shift+X",
                "Ctrl+Shift+H",
                "Ctrl+Shift+M",
                "Ctrl+Shift+Space",
                "Ctrl+Shift+K",
            ] {
                if let Ok(sc) = sc_str.parse::<Shortcut>() {
                    let _ = app.global_shortcut().register(sc);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::set_click_through,
            commands::set_overlay_geometry,
            commands::set_overlay_size,
            commands::set_overlay_visibility,
            commands::set_overlay_z_order,
            commands::get_native_monitors,
            commands::query_spotify_mpris,
            commands::control_spotify_mpris,
            commands::update_native_tray_menu,
            commands::log_from_js,
            commands::fetch_lyrics_lrclib
        ])


        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
