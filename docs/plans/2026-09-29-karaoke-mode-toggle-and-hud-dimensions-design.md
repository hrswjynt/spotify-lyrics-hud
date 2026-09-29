# Design Document: Karaoke Mode Toggle & HUD Dimensions Optimization

**Date:** 2026-09-29  
**Status:** Approved  
**Topic:** Karaoke Wipe ON/OFF Toggle & Bottom Footer Clipping Fix

---

## 1. Problem Statement & Motivation
1. **Footer Clipping:** In the Tauri desktop overlay HUD on Hyprland, the default window height of `220px` is too short for the combined vertical stack (*TrackHeader* ~75px + *LyricsScroller* ~120px + *Status Footer* ~35px + padding/borders). Consequently, the bottom footer (`CLICK-THROUGH ON` badge, display ID, and shortcut hint) gets clipped off by the bottom window boundary.
2. **Karaoke Wipe Animation Preference:** The current HUD always animates a left-to-right color wipe gradient on the active lyric line. The user requested the ability to turn ON/OFF this karaoke gradient wipe. When OFF, the active line should be cleanly highlighted with a solid vibrant color (similar to the standard Spotify desktop app) without any left-to-right wiping. When ON, the smooth left-to-right wipe runs on the single active line.

---

## 2. Architecture & Components

```
+-------------------------------------------------------------+
| System Controller / Tray / Hotkey Manager (Ctrl+Shift+K)   |
+-------------------------------------------------------------+
                              |
                     toggles state
                              v
+-------------------------------------------------------------+
| Svelte Reactive Store: karaokeMode (localStorage persisted) |
+-------------------------------------------------------------+
          |                                       |
          v                                       v
+------------------------+              +---------------------+
| TrackHeader.svelte     |              | LyricsLine.svelte   |
| [Mic/Karaoke Button]   |              | - ON: Gradient Wipe |
| (Live active indicator)|              | - OFF: Solid Glow   |
+------------------------+              +---------------------+
```

### 2.1 State Management (`src/ui/src/stores/playback.ts`)
- Add `karaokeMode = writable<boolean>(initialValue)` where `initialValue` reads from `localStorage.getItem('overlay_karaoke_mode') !== 'false'` (defaults to `true`).
- Add `toggleKaraokeMode(): boolean` which updates the store and persists the new boolean value to `localStorage`.
- In Tauri runtime, register listener to synchronize hotkey action `toggle-karaoke` and tray menu action `toggle-karaoke` to call `toggleKaraokeMode()`.

### 2.2 UI Rendering & Styles
- **`LyricsLine.svelte`:**
  - Reads or receives `karaokeMode`.
  - If `isActive && $karaokeMode`:
    - Renders `<p>` with dynamic linear gradient background-clip wipe (`#34d399` to `#38bdf8` up to `fillPercent`, then `#ffffff` for remaining).
  - If `isActive && !$karaokeMode`:
    - Renders `<p>` with solid glowing text (e.g. `text-emerald-400 font-bold drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]`).
  - Inactive/past lines remain styled consistently with appropriate dimming (`opacity-35` for past, `opacity-55` for upcoming).
- **`TrackHeader.svelte`:**
  - Adds a sleek Karaoke Toggle button next to Play/Pause with an SVG microphone icon and active glow state.
  - Clicking this button toggles `karaokeMode`.

### 2.3 Window Dimensions & Layout Fix
- Increase HUD height from `220px` to **`275px`** across:
  - `src-tauri/tauri.conf.json`: `"width": 750, "height": 275`
  - `src/platform/tauri/tauri-window.ts`: `geometry: { x: 0, y: 0, width: 750, height: 275 }`
  - `src/tauri-bootstrap.ts`: `initialIntent: { placement: { size: { width: 750, height: 275 } } }`
  - `~/.config/hypr/rules.lua`: `size = "750 275", move = "monitor_w/2-375 monitor_h-315"`
- Ensure `LyricsHUD.svelte` footer has `shrink-0` and sufficient margin so all badges are completely visible and never clipped.

### 2.4 Hotkey & Tray Integration
- In `src/system/types.ts`:
  - Add `'toggle-karaoke'` to `HotkeyAction`.
- In `src/system/hotkey-manager.ts`:
  - Add default binding `Ctrl+Shift+K` -> `'toggle-karaoke'`.
- In `src/system/tray-manager.ts`:
  - Add menu item for Karaoke Mode with dynamic label (`🎤 Karaoke Wipe: [ON/OFF]`).
- In `src/system/system-controller.ts`:
  - Handle `'toggle-karaoke'` action by notifying listeners and updating tray menu.

---

## 3. Verification Criteria
1. Automated tests in `tests/ui/` and `tests/system/` pass 100%.
2. Svelte store preserves `karaokeMode` in `localStorage`.
3. Toggling via button, `Ctrl+Shift+K`, and tray menu all toggle the state synchronously.
4. When OFF, active lyric line is solid bright text with no horizontal color wipe.
5. When ON, active lyric line has smooth left-to-right gradient wipe.
6. The entire bottom footer (*CLICK-THROUGH ON*, display badge, hint text) is fully visible without clipping in screenshots.
