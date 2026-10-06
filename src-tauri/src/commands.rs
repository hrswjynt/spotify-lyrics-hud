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
    pub album_art_url: Option<String>,
    pub duration_ms: u64,
    pub position_ms: u64,
    pub track_id: Option<String>,
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
    eprintln!("[set_overlay_geometry] x={}, y={}, w={}, h={}", x, y, width, height);

    // 1. Position update (native on Windows/X11, ignored/error on Wayland)
    let _ = window.set_position(Position::Physical(PhysicalPosition::new(x, y)));

    // 2. Size update (Tauri webview window size)
    let _ = window.set_size(Size::Physical(PhysicalSize::new(width, height)));

    // 3. If on Hyprland, dispatch resize and move directly to compositor
    if std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok() {
        let script = format!(
            r#"local wins = hl.get_windows(); for _, w in ipairs(wins) do if w.class == "spotify-lyrics-hud" or w.class == "desktop-overlay" then hl.dispatch(hl.dsp.window.resize({{ window = w, x = {}, y = {}, relative = false }})); hl.dispatch(hl.dsp.window.move({{ window = w, x = {}, y = {}, relative = false }})) end end"#,
            width, height, x, y
        );
        let _ = Command::new("hyprctl")
            .args(["repl", &script])
            .output();
    }

    Ok(())
}

#[tauri::command]
pub fn set_overlay_size(
    window: WebviewWindow,
    width: u32,
    height: u32,
) -> Result<(), String> {
    eprintln!("[set_overlay_size] w={}, h={}", width, height);

    // 1. Size update (Tauri webview window size)
    let _ = window.set_size(Size::Physical(PhysicalSize::new(width, height)));

    // 2. If on Windows, resize while preserving the current center position
    #[cfg(target_os = "windows")]
    {
        if let (Ok(pos), Ok(size)) = (window.outer_position(), window.outer_size()) {
            let cx = pos.x + (size.width as i32) / 2;
            let cy = pos.y + (size.height as i32) / 2;
            let nx = cx - (width as i32) / 2;
            let ny = cy - (height as i32) / 2;
            let _ = window.set_position(Position::Physical(PhysicalPosition::new(nx, ny)));
        }
    }

    // 3. If on Hyprland, resize while preserving the current center position
    if std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok() {
        let script = format!(
            r#"local wins = hl.get_windows(); for _, w in ipairs(wins) do if w.class == "spotify-lyrics-hud" or w.class == "desktop-overlay" then local cx = w.at.x + w.size.x / 2; local cy = w.at.y + w.size.y / 2; local nx = math.floor(cx - {} / 2); local ny = math.floor(cy - {} / 2); hl.dispatch(hl.dsp.window.resize({{ window = w, x = {}, y = {}, relative = false }})); hl.dispatch(hl.dsp.window.move({{ window = w, x = nx, y = ny, relative = false }})) end end"#,
            width, height, width, height
        );
        let _ = Command::new("hyprctl")
            .args(["repl", &script])
            .output();
    }

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

#[cfg(target_os = "windows")]
fn query_spotify_windows() -> Result<Option<NativeSpotifyStatus>, String> {
    use windows_sys::Win32::Foundation::{BOOL, HWND, LPARAM};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowTextW, GetWindowThreadProcessId, IsWindowVisible,
    };
    use windows_sys::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows_sys::Win32::System::ProcessStatus::GetProcessImageFileNameW;

    struct Context {
        status: Option<NativeSpotifyStatus>,
    }

    unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let ctx = &mut *(lparam as *mut Context);
        if IsWindowVisible(hwnd) == 0 {
            return 1;
        }

        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        if pid == 0 {
            return 1;
        }

        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if handle.is_null() {
            return 1;
        }

        let mut img_buf = [0u16; 512];
        let len = GetProcessImageFileNameW(handle, img_buf.as_mut_ptr(), 512);
        let _ = windows_sys::Win32::Foundation::CloseHandle(handle);

        if len == 0 {
            return 1;
        }

        let img_name = String::from_utf16_lossy(&img_buf[..len as usize]);
        if !img_name.to_lowercase().ends_with("spotify.exe") {
            return 1;
        }

        let mut title_buf = [0u16; 512];
        let title_len = GetWindowTextW(hwnd, title_buf.as_mut_ptr(), 512);
        if title_len == 0 {
            return 1;
        }

        let title_str = String::from_utf16_lossy(&title_buf[..title_len as usize]).trim().to_string();
        if title_str.is_empty() {
            return 1;
        }

        if title_str == "Spotify" || title_str == "Spotify Free" || title_str == "Spotify Premium" || title_str == "Advertisement" {
            ctx.status = Some(NativeSpotifyStatus {
                status: "Paused".into(),
                title: "".into(),
                artist: "".into(),
                album: "".into(),
                album_art_url: None,
                duration_ms: 0,
                position_ms: 0,
                track_id: None,
            });
            return 0;
        }

        if let Some((artist, track)) = title_str.split_once(" - ") {
            ctx.status = Some(NativeSpotifyStatus {
                status: "Playing".into(),
                title: track.trim().to_string(),
                artist: artist.trim().to_string(),
                album: "".into(),
                album_art_url: None,
                duration_ms: 0,
                position_ms: 0,
                track_id: None,
            });
            return 0;
        }

        1
    }

    let mut ctx = Context { status: None };
    unsafe {
        EnumWindows(Some(enum_proc), &mut ctx as *mut _ as LPARAM);
    }

    Ok(ctx.status)
}

#[cfg(target_os = "windows")]
fn control_spotify_windows(action: &str) -> Result<bool, String> {
    use windows_sys::Win32::Foundation::{BOOL, HWND, LPARAM};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowThreadProcessId, SendMessageW, WM_APPCOMMAND,
    };
    use windows_sys::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows_sys::Win32::System::ProcessStatus::GetProcessImageFileNameW;

    const APPCOMMAND_MEDIA_NEXTTRACK: u32 = 11;
    const APPCOMMAND_MEDIA_PREVIOUSTRACK: u32 = 12;
    const APPCOMMAND_MEDIA_STOP: u32 = 13;
    const APPCOMMAND_MEDIA_PLAY_PAUSE: u32 = 14;

    let cmd = match action {
        "play-pause" | "play" | "pause" => APPCOMMAND_MEDIA_PLAY_PAUSE,
        "next" => APPCOMMAND_MEDIA_NEXTTRACK,
        "previous" => APPCOMMAND_MEDIA_PREVIOUSTRACK,
        "stop" => APPCOMMAND_MEDIA_STOP,
        _ => return Err("Invalid Spotify action".into()),
    };

    struct FindCtx {
        target_hwnd: Option<HWND>,
    }

    unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let ctx = &mut *(lparam as *mut FindCtx);
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        if pid == 0 {
            return 1;
        }

        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if handle.is_null() {
            return 1;
        }

        let mut img_buf = [0u16; 512];
        let len = GetProcessImageFileNameW(handle, img_buf.as_mut_ptr(), 512);
        let _ = windows_sys::Win32::Foundation::CloseHandle(handle);

        if len > 0 {
            let img_name = String::from_utf16_lossy(&img_buf[..len as usize]);
            if img_name.to_lowercase().ends_with("spotify.exe") {
                ctx.target_hwnd = Some(hwnd);
                return 0;
            }
        }
        1
    }

    let mut ctx = FindCtx { target_hwnd: None };
    unsafe {
        EnumWindows(Some(enum_proc), &mut ctx as *mut _ as LPARAM);
        if let Some(hwnd) = ctx.target_hwnd {
            SendMessageW(hwnd, WM_APPCOMMAND, 0, (cmd << 16) as LPARAM);
            return Ok(true);
        }
    }

    Ok(false)
}

#[tauri::command]
pub fn query_spotify_mpris() -> Result<Option<NativeSpotifyStatus>, String> {
    #[cfg(target_os = "linux")]
    {
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
                "{{title}}:::{{artist}}:::{{album}}:::{{mpris:length}}:::{{position}}:::{{mpris:artUrl}}:::{{mpris:trackid}}",
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
        let album_art_url = if parts.len() >= 6 && !parts[5].is_empty() {
            Some(parts[5].to_string())
        } else {
            None
        };
        let track_id = if parts.len() >= 7 && !parts[6].is_empty() {
            let clean = crate::enrichment::sanitize_track_id(parts[6]);
            if !clean.is_empty() {
                Some(clean)
            } else {
                None
            }
        } else {
            None
        };

        Ok(Some(NativeSpotifyStatus {
            status: status_str,
            title,
            artist,
            album,
            album_art_url,
            duration_ms: length_us / 1000,
            position_ms: position_us / 1000,
            track_id,
        }))
    }

    #[cfg(target_os = "windows")]
    {
        query_spotify_windows()
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        Ok(None)
    }
}

#[tauri::command]
pub fn control_spotify_mpris(action: String) -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    {
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

    #[cfg(target_os = "windows")]
    {
        control_spotify_windows(&action)
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        Err("Unsupported platform for Spotify control".to_string())
    }
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

#[tauri::command]
pub fn log_from_js(level: String, msg: String) {
    eprintln!("[JS {}] {}", level, msg);
}

#[tauri::command]
pub fn fetch_lyrics_lrclib(
    track_name: String,
    artist_name: String,
    album_name: Option<String>,
    duration_secs: Option<u64>,
) -> Result<Option<String>, String> {
    // 1. Try exact query
    let mut cmd = Command::new("curl");
    cmd.args(["-s", "--max-time", "5", "-G", "https://lrclib.net/api/get"]);
    cmd.args(["--data-urlencode", &format!("track_name={}", track_name)]);
    cmd.args(["--data-urlencode", &format!("artist_name={}", artist_name)]);

    if let Some(album) = album_name {
        if !album.is_empty() {
            cmd.args(["--data-urlencode", &format!("album_name={}", album)]);
        }
    }

    if let Some(dur) = duration_secs {
        if dur > 0 {
            cmd.args(["--data-urlencode", &format!("duration={}", dur)]);
        }
    }

    if let Ok(output) = cmd.output() {
        if output.status.success() {
            let text = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if text.starts_with('{') && !text.contains("\"error\":") {
                return Ok(Some(text));
            }
        }
    }

    // 2. Fallback: query without album and duration
    let mut fallback_cmd = Command::new("curl");
    fallback_cmd.args(["-s", "--max-time", "5", "-G", "https://lrclib.net/api/get"]);
    fallback_cmd.args(["--data-urlencode", &format!("track_name={}", track_name)]);
    fallback_cmd.args(["--data-urlencode", &format!("artist_name={}", artist_name)]);

    if let Ok(fb_output) = fallback_cmd.output() {
        if fb_output.status.success() {
            let text = String::from_utf8_lossy(&fb_output.stdout).trim().to_string();
            if text.starts_with('{') && !text.contains("\"error\":") {
                return Ok(Some(text));
            }
        }
    }

    Ok(None)
}

#[tauri::command]
pub fn convert_lyrics_to_romaji(lines: Vec<String>) -> Result<Vec<Option<String>>, String> {
    Ok(crate::romaji::transliterate_lines(&lines))
}

#[tauri::command]
pub fn enrich_track_metadata(track_id: String) -> Result<Option<String>, String> {
    Ok(crate::enrichment::fetch_and_enrich(&track_id))
}



