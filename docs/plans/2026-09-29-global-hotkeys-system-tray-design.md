# Global Hotkeys & System Tray Controller Design

## 1. Overview
This specification details the OS-level system integration layer for the desktop overlay.
It provides global keyboard shortcuts (`Ctrl+Shift+X` for click-through toggle, `Ctrl+Shift+H` for visibility toggle, `Ctrl+Shift+M` for display cycling) and a dynamic system tray menu (StatusNotifierItem on Linux, Shell_NotifyIcon on Windows) to control overlay placement, interactivity, and Spotify playback.

---

## 2. Architecture & Directory Structure

```text
src/system/
├── types.ts                    # Contracts: HotkeyBinding, TrayMenuItem, HotkeyAction
├── hotkeys/
│   ├── hotkey-manager.ts       # Central manager registering and dispatching hotkeys
│   ├── linux-shortcuts.ts      # Linux Wayland / Hyprland portal & IPC dispatcher
│   └── win32-shortcuts.ts      # Windows RegisterHotKey adapter
├── tray/
│   ├── tray-manager.ts         # System tray controller & event dispatcher
│   └── menu-items.ts           # Dynamic menu builder (monitors, controls, modes)
└── index.ts                    # Public exports
```

---

## 3. Global Hotkeys

### 3.1 Actions Supported
- `toggle_click_through`: Switches pointer mode between `passthrough` and `interactive`.
- `toggle_visibility`: Hides or shows the overlay HUD.
- `cycle_monitor`: Cycles through connected displays (`Display[]`) in round-robin order.
- `play_pause`: Toggles Spotify audio playback.
- `next_track` / `prev_track`: Skips track.

### 3.2 Platform Implementation Strategy
- **Linux (Wayland / Hyprland)**:
  - Supported via `xdg-desktop-portal` `GlobalShortcuts` portal / Hyprland IPC `bind` commands.
  - Emits events when hotkey triggers.
- **Windows (Win32)**:
  - Uses `RegisterHotKey(hwnd, id, modifiers, key)` and processes `WM_HOTKEY` events.

---

## 4. System Tray Architecture

### 4.1 Menu Structure
- **Mode & Interactivity**:
  - `Toggle Click-Through` (Checkbox item)
  - `Toggle Visibility` (Checkbox item)
- **Display Selection**:
  - Submenu dynamically populated with detected displays (e.g. `eDP-1`, `HDMI-A-1`). Selecting an item sets `OverlayIntent.display = { type: 'id', id }`.
- **Position Anchors**:
  - Submenu with semantic anchors (`bottom-center`, `top-center`, `top-right`, etc.).
- **Spotify Controls**:
  - `Play / Pause`
  - `Next Track`
  - `Previous Track`
- **Quit Application**

---

## 5. Integration with Core OverlayEngine & SpotifyService

```text
               Global Hotkeys / System Tray
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
         OverlayEngine             SpotifyService
   • Toggle click-through       • Play / Pause
   • Toggle visibility          • Next track
   • Switch monitor             • Previous track
   • Change anchor position
```

---

## 6. Testing Strategy
- Unit tests for `HotkeyManager` registering, unregistering, and executing action handlers.
- Unit tests for `TrayManager` building dynamic menus from connected displays and overlay state.
- Unit tests for display cycling round-robin logic.
- Integration test demonstrating shortcut execution mutating `OverlayEngine` state.
