# Windows / Win32 Development Guide

## 1. Native Architecture on Windows

On Windows, the desktop overlay uses native Win32 window management APIs coupled with the Desktop Window Manager (DWM).

### Core Win32 APIs & Styles Used
- **Window Styles**:
  - `WS_POPUP`: Removes standard title bar and window resizing borders.
  - `WS_EX_TOOLWINDOW`: Prevents the overlay from displaying in Alt+Tab window lists or the Windows taskbar.
  - `WS_EX_LAYERED`: Enables alpha blending and hardware-accelerated transparency via `SetLayeredWindowAttributes` or `DwmExtendFrameIntoClientArea`.
  - `WS_EX_TOPMOST`: Ensures the window stays on top of standard desktop applications.
  - `WS_EX_NOACTIVATE`: Prevents clicking the overlay from stealing focus from games or the user's active application.
- **Click-Through Handling**:
  - `WS_EX_TRANSPARENT` is dynamically toggled on the window's extended style using `SetWindowLongPtr(hwnd, GWL_EXSTYLE, ...)`.
  - When enabled, `WM_NCHITTEST` returns `HTTRANSPARENT`, allowing all mouse clicks and scrolls to pass directly to underlying windows.
- **Positioning**:
  - `SetWindowPos(hwnd, HWND_TOPMOST, x, y, cx, cy, SWP_NOACTIVATE | SWP_SHOWWINDOW)` places the window in global virtual desktop coordinates.

---

## 2. Multi-Monitor Coordinate Spaces

On Windows, monitors form a unified virtual desktop coordinate grid:
- If a secondary display is configured to the left of the main display, its `x` coordinates are **negative** (e.g. `x = -1920` to `x = 0`).
- If a display is positioned above the main display, its `y` coordinates are negative.
- The Win32 adapter queries `EnumDisplayMonitors` and `GetMonitorInfoW` to retrieve:
  - `rcMonitor`: Total monitor dimensions.
  - `rcWork`: Dimensions excluding the taskbar.

The Core Layout Engine seamlessly computes exact positions within this coordinate system.

---

## 3. Fullscreen Detection

Fullscreen detection uses:
1. `GetForegroundWindow()` to inspect the focused application.
2. `GetWindowRect()` and `MonitorFromWindow()` to test if the foreground window covers the full monitor.
3. Style inspection to verify whether caption bars are absent (`WS_CAPTION` check).
4. `SHQueryUserNotificationState` to detect DirectX exclusive mode (`QUNS_RUNNING_D3D_FULL_SCREEN`).

---

## 4. Known Limitations & Edge Cases

1. **Legacy DirectX Exclusive Fullscreen**:
   - Legacy games using `DXGI_SWAP_EFFECT_DISCARD` in exclusive fullscreen mode completely bypass the Desktop Window Manager (DWM). No standard window can be rendered on top of an exclusive DirectX flip chain without injecting code/hooks into the game process (which anti-cheat tools like EasyAntiCheat or BattlEye strictly prohibit).
   - Our `hide-on-exclusive-fullscreen` policy detects this state cleanly and temporarily hides the overlay, avoiding display flicker or stutter.
2. **UAC Prompts & Secure Desktop**:
   - Windows security prevents non-elevated windows from drawing over User Account Control (UAC) prompts or Ctrl+Alt+Del secure desktops.
