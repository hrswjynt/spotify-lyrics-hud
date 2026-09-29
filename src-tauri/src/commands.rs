use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::{AppHandle, PhysicalPosition, PhysicalSize, Position, Size, WebviewWindow};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct NativeBounds {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NativeMonitorInfo {
    pub id: String,
    pub name: String,
    pub bounds: NativeBounds,
    pub work_area: NativeBounds,
    pub scale_factor: f64,
    pub primary: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NativeSpotifyStatus {
    pub status: String, // "Playing", "Paused", "Stopped"
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_ms: u64,
    pub position_ms: u64,
}

#[tauri::command]
pub fn set_click_through(window: WebviewWindow, passthrough: bool) -> Result<(), String> {
    window
        .set_ignore_cursor_events(passthrough)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_overlay_geometry(
    window: WebviewWindow,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<(), String> {
    window
        .set_position(Position::Physical(PhysicalPosition::new(x, y)))
        .map_err(|e| e.to_string())?;

    window
        .set_size(Size::Physical(PhysicalSize::new(width, height)))
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn set_overlay_visibility(window: WebviewWindow, visible: bool) -> Result<(), String> {
    if visible {
        window.show().map_err(|e| e.to_string())
    } else {
        window.hide().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn set_overlay_z_order(window: WebviewWindow, topmost: bool) -> Result<(), String> {
    window
        .set_always_on_top(topmost)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_native_monitors(app: AppHandle) -> Result<Vec<NativeMonitorInfo>, String> {
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let primary = app.primary_monitor().ok().flatten();

    let mut result = Vec::new();
    for (idx, mon) in monitors.into_iter().enumerate() {
        let name = mon.name().cloned().unwrap_or_else(|| format!("Display-{}", idx));
        let pos = mon.position();
        let size = mon.size();
        let scale = mon.scale_factor();

        let is_primary = if let Some(ref p) = primary {
            p.name() == mon.name() && p.position() == mon.position()
        } else {
            idx == 0
        };

        let bounds = NativeBounds {
            x: pos.x,
            y: pos.y,
            width: size.width,
            height: size.height,
        };

        // For work_area, fall back to bounds if OS-specific work area is not separately provided
        let work_area = bounds.clone();

        result.push(NativeMonitorInfo {
            id: name.clone(),
            name,
            bounds,
            work_area,
            scale_factor: scale,
            primary: is_primary,
        });
    }

    Ok(result)
}

#[tauri::command]
pub fn query_spotify_mpris() -> Result<Option<NativeSpotifyStatus>, String> {
    // Check if playerctl is installed and Spotify is running
    let status_output = Command::new("playerctl")
        .args(["-p", "spotify", "status"])
        .output();

    let status_str = match status_output {
        Ok(out) if out.status.success() => String::from_utf8_lossy(&out.stdout).trim().to_string(),
        _ => return Ok(None),
    };

    let meta_output = Command::new("playerctl")
        .args([
            "-p",
            "spotify",
            "metadata",
            "--format",
            "{{title}}:::{{artist}}:::{{album}}:::{{mpris:length}}:::{{position}}",
        ])
        .output();

    let meta_str = match meta_output {
        Ok(out) if out.status.success() => String::from_utf8_lossy(&out.stdout).trim().to_string(),
        _ => return Ok(None),
    };

    let parts: Vec<&str> = meta_str.split(":::").collect();
    if parts.len() < 5 {
        return Ok(None);
    }

    let title = parts[0].to_string();
    let artist = parts[1].to_string();
    let album = parts[2].to_string();

    let length_us: u64 = parts[3].parse().unwrap_or(0);
    let position_us: u64 = parts[4].parse().unwrap_or(0);

    Ok(Some(NativeSpotifyStatus {
        status: status_str,
        title,
        artist,
        album,
        duration_ms: length_us / 1000,
        position_ms: position_us / 1000,
    }))
}

#[tauri::command]
pub fn control_spotify_mpris(action: String) -> Result<bool, String> {
    let subcmd = match action.as_str() {
        "play-pause" => "play-pause",
        "next" => "next",
        "previous" => "previous",
        "play" => "play",
        "pause" => "pause",
        _ => return Err("Invalid Spotify action".to_string()),
    };

    let output = Command::new("playerctl")
        .args(["-p", "spotify", subcmd])
        .output()
        .map_err(|e| e.to_string())?;

    Ok(output.status.success())
}

#[tauri::command]
pub fn update_native_tray_menu(
    app: AppHandle,
    items: Vec<crate::tray::TrayItemPayload>,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let menu = crate::tray::build_menu_from_items(&app, &items)
            .map_err(|e| e.to_string())?;
        tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

