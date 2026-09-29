# Windowing & Layer Architecture

## 1. Overview & Architectural Boundaries

In modern desktop overlay applications (such as a Spotify lyrics HUD or gaming widget), window management must be strictly separated from application content and rendering.

```text
┌──────────────────────────────────────────────┐
│             Core Application                 │
│  (Lyrics state, track metadata, user intent) │
└──────────────────────┬───────────────────────┘
                       │ Desired Overlay State
                       ▼
┌──────────────────────────────────────────────┐
│              Window Reconciler               │
│  (Diffs desired state vs actual native state)│
└──────────────────────┬───────────────────────┘
                       │ High-level Platform API
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│ Linux / Wayland  │       │  Windows / Win32 │
│ (zwlr_layer_shell│       │  (HWND, DWM,     │
│  v1 protocol)    │       │   Extended Styles│
└──────────────────┘       └──────────────────┘
```

### What Belongs in Core
- **Positioning Intent**: Anchors (`bottom-center`, `top-right`), offsets, and sizes.
- **Input Policy**: Declaring whether the overlay should receive pointer events (`interactive`) or allow clicks to pass to the desktop/game beneath (`passthrough`).
- **Z-Order Intent**: Declaring relative visual layer (`overlay`, `topmost`, `normal`).
- **Desired State Store**: Current intended state.

### What Belongs in Platform Adapters
- Native window handles (`HWND`, `wl_surface`, `zwlr_layer_surface_v1`).
- Window styling, extended styles, message loops.
- Native hit-testing and input region clipping.
- Direct compositor/OS system calls.

---

## 2. Why Wayland Uses Layer-Shell (and Not XDG-Shell)

In Wayland's security and design architecture:
1. **No Global Coordinates**: Under `xdg-shell` (standard desktop windows), a client cannot specify where on the screen it should appear. Calling `setPosition(x, y)` is impossible or ignored.
2. **No Unilateral Z-Order**: An `xdg-shell` window cannot force itself to stay above fullscreen surfaces or other applications.
3. **The Solution**: The `zwlr_layer_shell_v1` protocol was specifically designed for desktop components (panels, docks, notification popups, and overlays).
   - We set layer to `ZWLR_LAYER_SHELL_V1_LAYER_OVERLAY` (3), which compositors guarantee to render on top of both normal windows and fullscreen surfaces.
   - We set native layer-shell anchors (e.g. `BOTTOM`) and margins (e.g. `marginBottom = 48`) to anchor the surface natively to the compositor's layout engine.

---

## 3. Why Windows Uses Win32 HWND & DWM

On Windows:
1. There is no direct layer-shell equivalent. Instead, the desktop operates in a unified virtual coordinate space managed by the Desktop Window Manager (DWM).
2. The overlay window is created with:
   - `WS_POPUP`: Borderless, captionless window.
   - `WS_EX_TOOLWINDOW`: Prevents the overlay from appearing in the Alt+Tab task switcher and taskbar.
   - `WS_EX_LAYERED`: Enables hardware-accelerated transparency and alpha blending.
   - `WS_EX_TOPMOST`: Keeps the window above normal applications.
   - `WS_EX_NOACTIVATE`: Prevents the overlay from stealing focus from games or active typing.

---

## 4. Input Transparency & Dynamic Click-Through

Click-through is fundamentally an **input routing policy**, not visual transparency.

### Linux / Wayland
Wayland handles input hit-testing through input regions:
- **Passthrough (Click-through)**: The adapter creates an empty `wl_region` and commits it to `wl_surface_set_input_region(surface, empty_region)`. The compositor routes all pointer, touch, and scroll events straight through to the windows below.
- **Interactive**: The adapter sets the input region to match the surface bounds, allowing users to click buttons, drag sliders, or interact with lyrics.

### Windows / Win32
Windows uses extended window styles:
- **Passthrough (Click-through)**: The adapter applies `WS_EX_TRANSPARENT` to `GWL_EXSTYLE`. The Win32 hit-test subsystem automatically passes mouse messages to the underlying window.
- **Interactive**: The adapter removes `WS_EX_TRANSPARENT` from `GWL_EXSTYLE`.

In both implementations, visual opacity remains completely decoupled from input handling.

---

## 5. Adding Another Platform (e.g. macOS / Darwin)

To add macOS support in the future:
1. Implement `OverlayWindow`:
   - Use `NSWindow` with `NSWindowStyleMaskBorderless`.
   - Set `level = .floating` or `.screenSaver` for overlay z-order.
   - Set `ignoresMouseEvents = true` for passthrough click-through.
2. Implement `DisplayProvider`:
   - Query `NSScreen.screens`.
3. Implement `FullscreenDetector`:
   - Observe `NSWorkspace.activeSpaceDidChangeNotification` or query `CGWindowListCopyWindowInfo`.
4. Register the new adapter in `src/platform/factory.ts`.
5. **The core remains 100% untouched.**
