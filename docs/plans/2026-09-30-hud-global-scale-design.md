# Design Document: HUD Global Scale Settings (0.5x, 0.75x, 1.0x, 1.25x, 1.5x)

## 1. Overview
This feature introduces an overall scaling control ("Global Scale") to the Spotify Lyrics Desktop Overlay HUD. Instead of tuning individual elements separately, the user can scale the entire interface proportionally (`0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`), adjusting typography, album art, spacing, and native window geometry synchronously.

## 2. Requirements & Constraints
- **Presets**:
  - `0.5x`: 50% scale (Mini mode: 375 × 138 px)
  - `0.75x`: 75% scale (Compact mode: 563 × 206 px)
  - `1.0x`: 100% scale (Default base: 750 × 275 px)
  - `1.25x`: 125% scale (Large mode: 938 × 344 px)
  - `1.5x`: 150% scale (Extra Large mode: 1125 × 413 px)
- **Scope**: Scale must apply to the entire HUD as a single unit (fonts, icons, padding, borders, album art, scroller).
- **Window Geometry Synchronization**: The native transparent window (Tauri WebviewWindow) must resize alongside the scale factor so that:
  - Hit testing and interactive clicks exactly match the visible HUD area.
  - Transparent borders do not block clicks to background windows when scaled down (0.5x).
  - The HUD does not get clipped when enlarged (1.25x or 1.5x).
  - The window remains dynamically anchored at `bottom-center` of the active monitor's work area.
- **Persistence**: Saved to `localStorage` under `overlay_display_settings` so scale persists across application restarts.

## 3. Architecture & Data Flow

```
┌────────────────────────────────┐
│      SettingsModal.svelte      │ (User selects 0.5x, 0.75x, 1x, 1.25x, 1.5x)
└──────────────┬─────────────────┘
               │ updateDisplaySettings({ scale: '0.75' })
               ▼
┌────────────────────────────────┐
│   displaySettings store (TS)   │ ──► Persisted to localStorage
└──────────────┬─────────────────┘
               │ reactive subscription ($displaySettings.scale)
       ┌───────┴────────────────────────┐
       ▼                                ▼
┌───────────────────────┐   ┌────────────────────────────────┐
│   App.svelte (CSS)    │   │   tauri-bootstrap.ts           │
│   zoom / scale factor │   │   compute targetWidth & height │
└───────────────────────┘   └──────────────┬─────────────────┘
                                           │ engine.setIntent({ placement })
                                           ▼
                            ┌────────────────────────────────┐
                            │    OverlayEngine (Core)        │
                            │    recalculate bottom-center   │
                            └──────────────┬─────────────────┘
                                           │ window.setGeometry(x, y, w, h)
                                           ▼
                            ┌────────────────────────────────┐
                            │   TauriOverlayWindow (Rust)    │
                            │   set_overlay_geometry IPC     │
                            └────────────────────────────────┘
```

## 4. Component Details

### A. `src/ui/src/stores/display-settings.ts`
- Define `ScaleOption = '0.5' | '0.75' | '1' | '1.25' | '1.5'`.
- Add `scale: ScaleOption` to `DisplaySettings` interface.
- Add default value `scale: '1'` to `DEFAULT_DISPLAY_SETTINGS`.

### B. `src/ui/src/components/SettingsModal.svelte`
- Add "Skala Tampilan (Scale)" section to the "Layout & Spasi" tab.
- Render 5 buttons corresponding to the presets (`0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`).
- Active state styled with `border-emerald-400 bg-emerald-500/20 text-emerald-300 font-bold shadow-sm`.

### C. `src/ui/src/App.svelte`
- Apply scale factor directly using standard CSS `zoom` or `transform: scale(factor)`:
  - If using `zoom`: WebKitGTK scales all px, borders, SVG sizes, and layout boxes without blurry rasterization.
  - Scale factor calculation:
    - `'0.5'` $\rightarrow$ `0.5`
    - `'0.75'` $\rightarrow$ `0.75`
    - `'1'` $\rightarrow$ `1.0`
    - `'1.25'` $\rightarrow$ `1.25`
    - `'1.5'` $\rightarrow$ `1.5`

### D. `src/tauri-bootstrap.ts`
- Subscribe to `displaySettings`:
  - When `scale` changes, update the placement in `OverlayEngine`:
    ```ts
    const scaleFactor = parseFloat(s.scale || '1');
    const width = Math.round(750 * scaleFactor);
    const height = Math.round(275 * scaleFactor);
    const currentIntent = engine.getIntent();
    await engine.setIntent({
      ...currentIntent,
      placement: {
        ...currentIntent.placement,
        size: { width, height },
      },
    });
    ```
- Reconciler calculates new position for `bottom-center` and calls `set_overlay_geometry`.

## 5. Verification Plan
- Unit tests in `tests/ui/display-settings.test.ts` for scale serialization, reset, and defaults.
- End-to-end Tauri build and verification with live screenshots across scales (`0.75x`, `1.0x`, `1.25x`).
