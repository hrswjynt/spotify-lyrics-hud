# Desktop Overlay Architecture Assessment: Cross-Platform Native Overlay

## 1. Executive Summary & Context

This document establishes the architecture for a production-grade, cross-platform native desktop overlay application supporting **Linux / Wayland (specifically Hyprland)** and **Windows (Win32 / DWM)**. 

The application is built around the fundamental architectural principle:
> **Shared behavior, native implementation.**

The core application describes **WHAT** the overlay desires (semantic positioning, input policy, z-order, display targeting, and fullscreen behavior). The platform adapters determine **HOW** the native operating system and compositor fulfill that intent.

Platform-specific concepts (such as `HWND`, `WS_EX_TRANSPARENT`, `HWND_TOPMOST`, `zwlr_layer_shell_v1`, `wl_output`, or Hyprland IPC sockets) are strictly contained inside native platform adapters and **never leak into the application core**.

---

## 2. Existing Architecture & Framework Analysis

Standard cross-platform GUI frameworks (such as raw Electron, Qt, or standard Winit/Tao in Tauri) were designed for conventional application windows. When applied to modern desktop overlays (such as Spotify lyrics HUDs, gaming overlays, or streaming widgets), they suffer from severe platform impedance mismatches.

### 2.1 Framework Limitations Analysis

| Feature | Standard Framework Behavior | Linux / Wayland Reality | Windows / Win32 Reality |
|---|---|---|---|
| **Window Positioning** | `window.setPosition(x, y)` | **Explicitly prohibited** by Wayland `xdg-shell`. Arbitrary global coordinates are ignored or rejected by compositors. | Uses `SetWindowPos` in virtual desktop space. Handles negative coordinates for multi-monitor setups. |
| **Always-On-Top** | `window.setAlwaysOnTop(true)` | In `xdg-shell`, top-level windows cannot guarantee rendering above other windows or fullscreen apps. Requires `zwlr_layer_shell_v1` on overlay layer. | Uses `HWND_TOPMOST`, but exclusive fullscreen apps take over unless bypassed or coordinated. |
| **Click-Through** | Often conflated with visual transparency or unsupported. | Requires Wayland input regions (`wl_surface.set_input_region` with empty region). | Requires Win32 extended window styles: `WS_EX_TRANSPARENT \| WS_EX_LAYERED`. |
| **Multi-Monitor** | Often assumes Monitor 0 is `(0,0)` and scales are integers. | Multi-monitor is managed via `wl_output` bindings and compositor-side placement. Supports fractional scaling. | Coordinate space is a virtual screen with potential negative origins, per-monitor DPI awareness. |
| **Fullscreen Detection** | Inconsistent or non-existent in unprivileged sandboxes. | Wayland clients are isolated by security policy; requires compositor IPC (e.g. Hyprland UNIX socket) to detect focused client state. | Requires Win32 foreground window monitoring (`GetForegroundWindow`, window rect checks, or `SHQueryUserNotificationState`). |

### 2.2 Problems Identified in Naive Architectures
1. **Lowest-Common-Denominator Trap**: Attempting to force Wayland to look like Windows `(x, y)` coordinate positioning results in broken windowing, flickering, or dependency on legacy XWayland.
2. **Leakage of Native Types**: Leaking `HWND`, GTK widgets, or Wayland handles into business logic destroys testability and makes porting impossible.
3. **Coupling Input to Opacity**: Treating click-through as CSS `pointer-events: none` inside a webview does not release OS mouse events to underlying windows unless the native OS window itself is input-transparent.
4. **Scattered Platform Conditions**: Spreading `if (isWindows)` or `if (isLinux)` throughout layout and UI code creates brittle spaghetti logic.

---

## 3. Proposed Architecture

We adopt a **Desired State + Reconciliation Architecture**:

```text
                         ┌────────────────────────────────────────┐
                         │            Core Application            │
                         │                                        │
                         │ • Application State (Spotify, Lyrics)  │
                         │ • Semantic Overlay Intent              │
                         │ • Layout Engine (Anchored Positioning) │
                         │ • Input Policy Engine                  │
                         │ • Fullscreen Policy Engine             │
                         │ • Desired State Store                  │
                         └───────────────────┬────────────────────┘
                                             │
                                   Platform Abstraction
                                     (Platform API)
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │   State Reconciler  │
                                  └──────────┬──────────┘
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     │                                               │
             ┌───────▼────────┐                             ┌────────▼────────┐
             │ Linux Adapter  │                             │ Windows Adapter │
             │                │                             │                 │
             │ • Wayland Core │                             │ • Win32 Window  │
             │ • Layer-Shell  │                             │ • HWND / Styles │
             │ • wl_output    │                             │ • DWM Backdrop  │
             │ • Hyprland IPC │                             │ • EnumMonitors  │
             └────────────────┘                             └─────────────────┘
```

### 3.1 Core Responsibilities
- **Application State**: Manages domain logic (e.g. track metadata, synced lyrics, user display settings).
- **Overlay Intent**: High-level semantic specification of what the overlay wants.
- **Layout Engine**: Computes geometry based on anchors, margins, offsets, and target monitor work area.
- **Policies**: Pure functions determining input transparency, z-order, and visibility based on platform state.
- **State Reconciler**: Compares `DesiredState` with `ActualState` and applies minimal mutating native calls.

---

## 4. Platform Abstraction Strategy

All platform operations are exposed via four clean, decoupled interfaces:

### 4.1 Core Interfaces
1. **`OverlayWindow`**:
   - Manages window lifecycle, native surface creation, visibility, input mode (`interactive` vs `passthrough`), z-order (`normal`, `topmost`, `overlay`), geometry, and display assignment.
2. **`DisplayProvider`**:
   - Enumerates connected displays, tracks display additions/removals, reports bounds, work areas, scale factors, and identifies primary or active displays.
3. **`FullscreenDetector`**:
   - Detects whether any foreground window or target application is in fullscreen mode, reporting structured state: `windowed`, `fullscreen(displayId, appId)`, or `unknown`.
4. **`PlatformCapabilities`**:
   - Explicitly advertises what the host OS/compositor supports (e.g. `layerShell: true`, `clickThrough: true`, `fullscreenDetection: true`). Allows graceful fallbacks without guessing.

---

## 5. Linux / Wayland & Hyprland Strategy

### 5.1 Pure Wayland Implementation
- Wayland applications cannot position themselves arbitrarily via `xdg-shell`. We use the **`zwlr_layer_shell_v1` protocol** (via `gtk-layer-shell` / native layer-shell bindings).
- **Z-Order**: Mapped to `ZWLR_LAYER_SHELL_V1_LAYER_OVERLAY` for true overlay HUD behavior, rendering above normal and fullscreen surfaces.
- **Positioning**: Layer-shell native anchors (`TOP`, `BOTTOM`, `LEFT`, `RIGHT`) and margins are configured to match semantic placements (e.g. `bottom-center` binds to `BOTTOM` anchor with computed margins).
- **Display Binding**: Bound directly to the chosen `wl_output`.
- **Click-Through**: Uses Wayland input regions (`wl_compositor_create_region`). For `passthrough`, an empty region is committed to `wl_surface_set_input_region`, letting all pointer events pass through to windows beneath. For `interactive`, the full surface region is assigned.

### 5.2 Hyprland Integration Layer
- Kept strictly isolated as an optional compositor integration (`platform/linux/hyprland`).
- Hyprland exposes a fast UNIX domain socket at `$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE/.socket2.sock`.
- We stream real-time events:
  - `fullscreen`: Detects when any window enters or exits fullscreen mode.
  - `focusedmon`: Detects active monitor changes instantly.
  - `workspace`: Monitors active workspace switches.
- If Hyprland is not detected, generic Wayland fallbacks are used (`fullscreen: unknown`, active display falls back to primary display).

---

## 6. Windows / Win32 Strategy

### 6.1 Native Win32 Adapter
- Created under `platform/windows/`.
- **Window Management**: Uses raw `HWND` with custom window styles:
  - `WS_POPUP` (borderless)
  - `WS_EX_TOOLWINDOW` (prevents showing in Alt-Tab and taskbar)
  - `WS_EX_TOPMOST` (for always-on-top / overlay z-order)
  - `WS_EX_LAYERED` (enables per-pixel alpha transparency and click-through)
- **Positioning**: Uses `SetWindowPos(hwnd, HWND_TOPMOST, x, y, width, height, SWP_NOACTIVATE | SWP_SHOWWINDOW)` mapped to virtual desktop coordinates.
- **Click-Through**:
  - `passthrough`: `SetWindowLongPtr(hwnd, GWL_EXSTYLE, currentExStyle | WS_EX_TRANSPARENT)`
  - `interactive`: `SetWindowLongPtr(hwnd, GWL_EXSTYLE, currentExStyle & ~WS_EX_TRANSPARENT)`
- **Multi-Monitor**: Uses `EnumDisplayMonitors`, `GetMonitorInfoW`, and `GetDpiForMonitor` to properly translate bounds and work areas into virtual desktop coordinates, correctly handling negative monitor coordinates.
- **Fullscreen Detection**: Monitored via a background polling/event thread checking `GetForegroundWindow()`, comparing window bounds with monitor bounds, or using `SHQueryUserNotificationState`.

---

## 7. Multi-Monitor & Positioning Strategy

### 7.1 Coordinate Systems
- The core never assumes `(0, 0)` is the primary display origin.
- Multi-monitor setups can place secondary monitors to the left (`x < 0`) or above (`y < 0`) the primary monitor.
- Semantic positioning specifies:
  - `Anchor`: `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right`.
  - `Offset`: `(dx, dy)` in logical pixels.
  - `Target Area`: Relative to `display.bounds` (full screen) or `display.workArea` (excluding taskbars/panels).
- The Layout Engine calculates absolute bounds for platforms requiring it (Win32), and layer-shell anchors/margins for Wayland.

---

## 8. Fullscreen Policy

The core defines fullscreen response behavior independently of platform:
- `always-show`: Overlay remains visible even over fullscreen windows.
- `always-hide`: Overlay is hidden when any window is fullscreen.
- `hide-on-exclusive-fullscreen`: Hides only if an exclusive/game fullscreen application is detected on the overlay's display.
- `hide-on-any-fullscreen`: Hides if any display has a fullscreen window.

---

## 9. Rendering vs Window Management Separation

```text
┌─────────────────────────────────┐
│     Core State / UI Content     │ (e.g. Spotify Lyrics, Progress, Album Art)
└────────────────┬────────────────┘
                 │ Webview / Canvas Rendering (Pure Visuals)
                 ▼
┌─────────────────────────────────┐
│       Transparent Surface       │ (Hardware-accelerated WebKitGTK / WebView2)
└────────────────┬────────────────┘
                 │ Native Window Hooks
                 ▼
┌─────────────────────────────────┐
│      Native Window Manager      │ (Win32 HWND / Wayland zwlr_layer_shell_v1)
└─────────────────────────────────┘
```
- The rendering layer has **zero knowledge** of window positioning, click-through, or fullscreen rules.
- The window manager has **zero knowledge** of lyrics, tracks, or UI components.

---

## 10. Trade-Offs & Known Platform Limitations

1. **Wayland Global Coordinates**: Wayland by design does not expose absolute mouse cursor coordinates to background windows. Monitor selection based on "display containing cursor" requires compositor IPC (Hyprland `hyprctl cursorpos`) on Linux.
2. **Wayland Fullscreen Detection**: Generic Wayland cannot inspect other clients. On generic Wayland compositors (without Hyprland IPC or ext-foreign-toplevel protocol), fullscreen state reports `unknown`, gracefully falling back to `always-show`.
3. **Windows Exclusive Fullscreen (Legacy Direct3D)**: Legacy exclusive fullscreen games bypass DWM composition. Overlays cannot render over exclusive D3D11/D3D12 hardware flips without graphics hooking (which anti-cheat engines prohibit). The `hide-on-exclusive-fullscreen` policy cleanly avoids conflicting with such games.

---

## 11. Conclusion & Next Steps

This architecture provides clean, maintainable separation of concerns, high testability, and true native behavior across both modern Linux Wayland (Hyprland) and Windows. We proceed to Phase 2: Defining the Platform-Neutral Interfaces and State Model.
