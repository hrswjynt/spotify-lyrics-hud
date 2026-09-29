# Fullscreen Detection & Policy Architecture

## 1. The Fullscreen Problem in Desktop Overlays

When a user launches a fullscreen game, video player, or presentation, an overlay HUD must behave intelligently:
- In some cases (e.g. game HUD, synced lyrics during casual gaming), the user wants the overlay to remain visible (`always-show`).
- In other cases, an overlay covering game UI or immersive videos is annoying (`hide-on-exclusive-fullscreen` or `always-hide`).
- On multi-monitor setups, if a game is playing fullscreen on Monitor 1, the user often wants the overlay to remain visible on Monitor 2!

---

## 2. Platform-Neutral Fullscreen State Model

```ts
export type FullscreenState =
  | { state: "windowed" }
  | { state: "fullscreen"; displayId?: string; applicationId?: string }
  | { state: "unknown" };
```

### The Explicit `"unknown"` State
Wayland compositors without extended IPC (such as standard GNOME Wayland) do not permit unprivileged clients to query other applications' window states for security reasons. Instead of faking windowed or fullscreen status, the detector reports `"unknown"`. The core policy engine understands this and applies safe default rules.

---

## 3. Fullscreen Policy Engine

The core application defines policy rules independently of the operating system:

| Policy | Windowed State | Fullscreen (Same Monitor) | Fullscreen (Other Monitor) | Unknown State |
|---|---|---|---|---|
| `always-show` | Visible | Visible | Visible | Visible |
| `always-hide` | Visible | Hidden | Hidden | Visible |
| `hide-on-any-fullscreen` | Visible | Hidden | Hidden | Visible |
| `hide-on-exclusive-fullscreen` | Visible | **Hidden** | **Visible** | Visible |

### Per-Monitor Awareness (`hide-on-exclusive-fullscreen`)
When set to `hide-on-exclusive-fullscreen`:
- If `fullscreenState.displayId === overlayDisplayId`: Overlay hides.
- If `fullscreenState.displayId !== overlayDisplayId`: Overlay stays visible on the secondary monitor!

---

## 4. Platform Detection Mechanisms

### Linux / Hyprland
- Hyprland emits real-time events on its UNIX domain socket (`.socket2.sock`):
  - `fullscreen>>1` (entered fullscreen)
  - `fullscreen>>0` (exited fullscreen)
  - `activewindow` (reports active window class, title, and monitor ID)
- Zero CPU polling required.

### Windows / Win32
- The adapter checks the active foreground window (`GetForegroundWindow`):
  - Retrieves window rectangle (`GetWindowRect`).
  - Retrieves the monitor rectangle containing the window (`MonitorFromWindow`).
  - Checks window styles (`WS_CAPTION` missing, `WS_POPUP` present).
  - Can cross-verify with `SHQueryUserNotificationState()` for DirectX exclusive fullscreen detection.
