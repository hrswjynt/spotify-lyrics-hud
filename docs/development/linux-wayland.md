# Linux / Wayland & Hyprland Development Guide

## 1. Native Architecture on Wayland

This project treats Linux as a first-class Wayland platform. It does not rely on X11 emulation or legacy XWayland quirks.

### Core Protocols Used
- **`zwlr_layer_shell_v1`**: The industry-standard protocol for desktop overlays, panels, and docks.
  - Layer: `ZWLR_LAYER_SHELL_V1_LAYER_OVERLAY` (value `3`). Guarantees rendering above normal windows and fullscreen applications.
  - Anchors: `TOP`, `BOTTOM`, `LEFT`, `RIGHT` bitmask flags.
  - Margins: Pixel offsets from the anchored edges.
- **`wl_compositor` & Input Regions**:
  - `wl_surface_set_input_region` with an empty region provides zero-latency, OS-level click-through.
- **`wl_output`**:
  - Surfaces bind directly to the target output handle for multi-monitor targeting.

---

## 2. Hyprland Integration Details

Hyprland provides high-performance IPC sockets in `$XDG_RUNTIME_DIR/hypr/$HYPRLAND_INSTANCE_SIGNATURE`:

1. **Command Socket (`.socket.sock`)**:
   - `j/monitors`: Returns detailed JSON array of connected displays, resolutions, positions, scales, and reserved space for waybar/panels.
   - `j/activewindow`: Returns the currently focused window, class, title, and whether it is in fullscreen mode.
   - `j/cursorpos`: Returns current cursor `(x, y)` coordinates.
2. **Event Socket (`.socket2.sock`)**:
   - Streams line-delimited events:
     - `fullscreen>>1` / `fullscreen>>0`
     - `focusedmon>>name,workspace`
     - `monitoradded>>name` / `monitorremoved>>name`

The adapter listens to these events asynchronously without CPU polling.

---

## 3. Building & Testing on Linux

### Prerequisites
- Node.js >= 18 (installed: v24.18.1)
- Rust toolchain (optional for Tauri native shell, installed: 1.98.1)
- Libraries: `gtk4-layer-shell` or `gtk-layer-shell`, `wayland-client`

### Running Automated Tests
```bash
# Run all unit tests and live integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Manual Verification on Hyprland
1. Launch the overlay in interactive mode:
   - Verify you can hover or click elements.
2. Switch input mode to passthrough:
   - Click through the overlay. Notice that clicks activate the terminal, editor, or browser directly behind it.
3. Open a game or fullscreen video on Monitor 1:
   - Verify that under `hide-on-exclusive-fullscreen`, the overlay hides if on Monitor 1, but remains visible if assigned to Monitor 2.
4. Move cursor between monitors:
   - If selector is set to `cursor`, verify the overlay smoothly switches to the monitor containing the mouse.
