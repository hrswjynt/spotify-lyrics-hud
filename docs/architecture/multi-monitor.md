# Multi-Monitor & Coordinate System Architecture

## 1. Principles of Multi-Monitor Systems

Multi-monitor systems introduce complexity that naive window positioning models fail to handle:
1. **Never Assume `(0, 0)` is the Primary Origin**: Secondary monitors can be placed to the left (`x < 0`) or above (`y < 0`) the primary monitor in virtual desktop space.
2. **Work Area vs Display Bounds**: Taskbars, docks, and status panels reserve screen space. Semantic placement must distinguish between positioning relative to the usable `workArea` vs raw `bounds`.
3. **Per-Monitor Scaling (DPI)**: Displays frequently have different resolutions and scale factors (e.g. 1080p at 1.0x next to 4K at 1.5x).
4. **Hot-Plugging & Reconfiguration**: Monitors can be disconnected, reconnected, or rearranged while the application is running.

---

## 2. Platform-Neutral Display Model

```ts
export interface Display {
  id: string;          // Stable identifier (eDP-1, HDMI-A-1, \\.\DISPLAY1)
  name: string;        // Human-readable description
  bounds: Rect;        // Full resolution { x, y, width, height }
  workArea: Rect;      // Usable area excluding reserved panels
  scaleFactor: number; // e.g. 1.0, 1.25, 1.5
  primary: boolean;    // Whether this is the primary display
}
```

The application never references monitors by array index (`monitor[0]`, `monitor[1]`). Instead, stable identifiers or semantic selectors are used.

---

## 3. Semantic Monitor Selection

The application core specifies which monitor the overlay targets using `DisplaySelector`:

| Selector Type | Behavior | Fallback Strategy |
|---|---|---|
| `{ type: "primary" }` | Targets the main operating system display. | First available display |
| `{ type: "active" }` | Targets the currently focused monitor. | Primary display |
| `{ type: "id", id: "HDMI-A-1" }` | Targets a specific named display. | If unplugged, gracefully falls back to primary display |
| `{ type: "cursor" }` | Targets the monitor currently containing the mouse cursor. | Active display |
| `{ type: "target-window" }` | Targets the monitor containing a target app (e.g. Spotify). | Active display |

---

## 4. Platform Translation

### Linux / Hyprland
- Hyprland reports display coordinates and reserved panel areas via its UNIX IPC socket (`j/monitors`).
- Monitor work area calculation:
  ```ts
  workArea.x = monitor.x + reserved[0]; // left
  workArea.y = monitor.y + reserved[1]; // top
  workArea.width = monitor.width - reserved[0] - reserved[2];
  workArea.height = monitor.height - reserved[1] - reserved[3];
  ```
- Layer-shell overlays attach directly to the specified `wl_output`.

### Windows / Win32
- Enumerated using `EnumDisplayMonitors` and `GetMonitorInfoW`.
- `rcMonitor` provides raw bounds.
- `rcWork` provides the work area excluding the Windows taskbar.
- Translates coordinates into global virtual desktop coordinates.

---

## 5. Hot-Plugging Resilience

When a monitor disconnects:
1. `DisplayProvider` receives the OS notification (`WM_DISPLAYCHANGE` on Windows, `monitorremoved` on Hyprland).
2. The display list is refreshed.
3. `resolveDisplay()` checks if the previously selected monitor still exists.
4. If missing, it immediately selects the primary display without throwing an exception or leaving the window orphaned off-screen.
5. The Reconciler repositions the window to the new monitor seamlessly.
