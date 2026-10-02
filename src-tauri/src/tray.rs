use serde::{Deserialize, Serialize};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Emitter, Runtime,
};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TrayItemPayload {
    pub id: String,
    pub label: String,
    pub item_type: Option<String>,
    pub checked: Option<bool>,
    pub enabled: Option<bool>,
    pub shortcut: Option<String>,
    pub children: Option<Vec<TrayItemPayload>>,
}

pub fn create_tray<R: Runtime>(app: &AppHandle<R>) -> Result<TrayIcon<R>, Box<dyn std::error::Error>> {
    let icon = app.default_window_icon().cloned().ok_or("No default window icon found")?;

    let menu = Menu::default(app)?;
    let title = MenuItem::with_id(app, "title", "Spotify Lyrics HUD", false, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Overlay", true, None::<&str>)?;

    menu.append(&title)?;
    menu.append(&sep)?;
    menu.append(&quit)?;

    let tray = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .tooltip("Spotify Lyrics HUD")
        .menu(&menu)
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();
            if id == "quit" {
                app.exit(0);
            } else {
                let _ = app.emit("tray-menu-action", id);
            }
        })
        .build(app)?;

    Ok(tray)
}

pub fn build_menu_from_items<R: Runtime>(
    app: &AppHandle<R>,
    items: &[TrayItemPayload],
) -> Result<Menu<R>, Box<dyn std::error::Error>> {
    let menu = Menu::default(app)?;

    for item in items {
        match item.item_type.as_deref() {
            Some("separator") => {
                let sep = PredefinedMenuItem::separator(app)?;
                menu.append(&sep)?;
            }
            Some("checkbox") => {
                let check = CheckMenuItem::with_id(
                    app,
                    &item.id,
                    &item.label,
                    item.enabled.unwrap_or(true),
                    item.checked.unwrap_or(false),
                    item.shortcut.as_deref(),
                )?;
                menu.append(&check)?;
            }
            Some("submenu") => {
                let sub = Submenu::new(app, &item.label, item.enabled.unwrap_or(true))?;
                if let Some(ref children) = item.children {
                    for child in children {
                        if child.item_type.as_deref() == Some("checkbox") {
                            let check = CheckMenuItem::with_id(
                                app,
                                &child.id,
                                &child.label,
                                child.enabled.unwrap_or(true),
                                child.checked.unwrap_or(false),
                                child.shortcut.as_deref(),
                            )?;
                            sub.append(&check)?;
                        } else {
                            let m = MenuItem::with_id(
                                app,
                                &child.id,
                                &child.label,
                                child.enabled.unwrap_or(true),
                                child.shortcut.as_deref(),
                            )?;
                            sub.append(&m)?;
                        }
                    }
                }
                menu.append(&sub)?;
            }
            _ => {
                let m = MenuItem::with_id(
                    app,
                    &item.id,
                    &item.label,
                    item.enabled.unwrap_or(true),
                    item.shortcut.as_deref(),
                )?;
                menu.append(&m)?;
            }
        }
    }

    Ok(menu)
}
