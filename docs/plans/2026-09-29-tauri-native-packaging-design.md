# Architecture Design: Tauri Native Packaging & Desktop Runner

## 1. Overview
The goal is to package the Cross-Platform Desktop Overlay application into a production-ready, native desktop binary using **Tauri v2** (`src-tauri/`).
The application combines:
- **Rust Backend (`src-tauri/`)**: Native window management, transparency, click-through toggles, OS tray icon, global shortcuts, and MPRIS query commands.
- **TypeScript Core (`src/core/`)**: Platform-neutral layout engine, anchored positioning, desired-state reconciliation, and fullscreen awareness.
- **Frontend UI (`src/ui/`)**: Svelte 5 + Tailwind CSS v4 glassmorphic HUD compiled into `dist-ui/`.
- **System Controller (`src/system/`)**: Synchronizing hotkeys, tray menus, and Spotify playback.

## 2. Architectural Principle: "Shared Behavior, Native Implementation"
In accordance with our core architecture:
- The TypeScript Core Engine (`OverlayEngine`) continues to define **WHAT** the overlay wants (`OverlayIntent`).
- A new adapter `TauriPlatformAdapter` (`src/platform/tauri/`) implements `PlatformAdapter`, translating high-level intent into Tauri IPC calls (`@tauri-apps/api/core` invoke).
- The Rust backend executes the OS-specific primitives (`WebviewWindow::set_ignore_cursor_events`, `set_position`, `set_size`, `TrayIconBuilder`, etc.).

```text
 ┌────────────────────────────────────────────────────────┐
 │                   Svelte 5 HUD UI                      │
 └──────────────────────────┬─────────────────────────────┘
                            │
 ┌──────────────────────────▼─────────────────────────────┐
 │                TypeScript Core Layer                   │
 │   - OverlayEngine                                      │
 │   - LayoutEngine (Anchored Positioning)                │
 │   - SystemController (Hotkeys + Dynamic Tray)          │
 │   - SpotifyService (MPRIS + LRCLIB)                    │
 └──────────────────────────┬─────────────────────────────┘
                            │
 ┌──────────────────────────▼─────────────────────────────┐
 │               TauriPlatformAdapter                     │
 │   - TauriOverlayWindow (implements OverlayWindow)      │
 │   - TauriDisplayProvider (implements DisplayProvider)  │
 │   - TauriFullscreenDetector                            │
 └──────────────────────────┬─────────────────────────────┘
                            │ (Tauri IPC invoke / events)
 ┌──────────────────────────▼─────────────────────────────┐
 │                   Rust Native Core                     │
 │   - WebviewWindow (transparent, frameless, topmost)    │
 │   - set_ignore_cursor_events (click-through toggle)    │
 │   - tauri::tray::TrayIcon (OS tray menu integration)   │
 │   - tauri-plugin-global-shortcut (system-wide hotkeys) │
 └────────────────────────────────────────────────────────┘
```

## 3. Window Configuration (`tauri.conf.json`)
- **Transparent**: `true`
- **Decorations**: `false` (frameless)
- **AlwaysOnTop**: `true`
- **SkipTaskbar**: `true`
- **Resizable**: `false`
- **Shadow**: `false`
- **Default Size**: `750x120`
- **Initial Pointer Mode**: Passthrough via `set_ignore_cursor_events(true)`

## 4. Rust Native IPC Commands
1. `set_click_through(window: WebviewWindow, passthrough: bool) -> Result<(), String>`:
   Calls `window.set_ignore_cursor_events(passthrough)`.
2. `set_overlay_geometry(window: WebviewWindow, x: i32, y: i32, width: u32, height: u32) -> Result<(), String>`:
   Calls `window.set_position` and `window.set_size`.
3. `set_overlay_visibility(window: WebviewWindow, visible: bool) -> Result<(), String>`:
   Calls `window.show()` or `window.hide()`.
4. `get_native_monitors(app: AppHandle) -> Result<Vec<NativeMonitor>, String>`:
   Enumerates `app.available_monitors()` and maps to our `Display` interface.
5. `update_tray_menu(app: AppHandle, menu_data: TrayMenuData) -> Result<(), String>`:
   Dynamically rebuilds the OS panel tray menu items and checkmarks.

## 5. Security & Isolation
- Tauri v2 capability system: Explicitly configure `core:default`, `tray`, and `global-shortcut` permissions in `src-tauri/capabilities/default.json`.
- Zero raw shell commands executed on arbitrary inputs.
- Safe graceful fallback when running in browser dev mode vs native Tauri runtime.
