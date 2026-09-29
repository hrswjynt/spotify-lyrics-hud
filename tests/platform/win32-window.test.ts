import { describe, expect, it, vi } from 'vitest';
import {
  HWND_NOTOPMOST,
  HWND_TOPMOST,
  SWP_NOACTIVATE,
  SWP_SHOWWINDOW,
  Win32NativeBridge,
  Win32OverlayWindow,
  WS_EX_LAYERED,
  WS_EX_NOACTIVATE,
  WS_EX_TOOLWINDOW,
  WS_EX_TOPMOST,
  WS_EX_TRANSPARENT,
  WS_POPUP,
} from '../../src/platform/windows/win32-window.js';

describe('Windows / Win32 Overlay Window Adapter', () => {
  it('creates an HWND with WS_POPUP and WS_EX_TOOLWINDOW | WS_EX_LAYERED', async () => {
    let capturedOptions: any = null;
    const mockBridge: Win32NativeBridge = {
      createWindow: vi.fn(async (opts) => {
        capturedOptions = opts;
        return 0x8888;
      }),
      destroyWindow: vi.fn(async () => {}),
      setWindowLongPtr: vi.fn(async () => 0),
      getWindowLongPtr: vi.fn(async () => 0),
      setWindowPos: vi.fn(async () => true),
      setLayeredWindowAttributes: vi.fn(async () => true),
      showWindow: vi.fn(async () => true),
    };

    const win = new Win32OverlayWindow(mockBridge);
    await win.create();

    expect(win.getActualState().created).toBe(true);
    expect(capturedOptions.style).toBe(WS_POPUP);
    expect(capturedOptions.exStyle & WS_EX_TOOLWINDOW).toBeTruthy();
    expect(capturedOptions.exStyle & WS_EX_LAYERED).toBeTruthy();
    expect(capturedOptions.exStyle & WS_EX_NOACTIVATE).toBeTruthy();
  });

  it('manages click-through via WS_EX_TRANSPARENT in GWL_EXSTYLE', async () => {
    let currentEx = WS_EX_TOOLWINDOW | WS_EX_LAYERED;
    const mockBridge: Win32NativeBridge = {
      createWindow: vi.fn(async () => 0x9999),
      destroyWindow: vi.fn(async () => {}),
      setWindowLongPtr: vi.fn(async (_hwnd, _idx, val) => {
        currentEx = val;
        return currentEx;
      }),
      getWindowLongPtr: vi.fn(async () => currentEx),
      setWindowPos: vi.fn(async () => true),
      setLayeredWindowAttributes: vi.fn(async () => true),
      showWindow: vi.fn(async () => true),
    };

    const win = new Win32OverlayWindow(mockBridge);
    await win.create();

    // Enable passthrough (click-through)
    await win.setInputMode('passthrough');
    expect(mockBridge.setWindowLongPtr).toHaveBeenCalledWith(
      0x9999,
      -20, // GWL_EXSTYLE
      expect.any(Number)
    );
    expect(currentEx & WS_EX_TRANSPARENT).toBeTruthy();

    // Disable passthrough (interactive)
    await win.setInputMode('interactive');
    expect(currentEx & WS_EX_TRANSPARENT).toBeFalsy();
  });

  it('manages z-order via SetWindowPos and HWND_TOPMOST / HWND_NOTOPMOST', async () => {
    const mockBridge: Win32NativeBridge = {
      createWindow: vi.fn(async () => 0x7777),
      destroyWindow: vi.fn(async () => {}),
      setWindowLongPtr: vi.fn(async () => 0),
      getWindowLongPtr: vi.fn(async () => 0),
      setWindowPos: vi.fn(async () => true),
      setLayeredWindowAttributes: vi.fn(async () => true),
      showWindow: vi.fn(async () => true),
    };

    const win = new Win32OverlayWindow(mockBridge);
    await win.create();

    await win.setZOrder('overlay');
    expect(mockBridge.setWindowPos).toHaveBeenCalledWith(
      0x7777,
      HWND_TOPMOST,
      0,
      0,
      0,
      0,
      expect.any(Number)
    );

    await win.setZOrder('normal');
    expect(mockBridge.setWindowPos).toHaveBeenCalledWith(
      0x7777,
      HWND_NOTOPMOST,
      0,
      0,
      0,
      0,
      expect.any(Number)
    );
  });

  it('positions window using virtual screen coordinates (including negative offsets)', async () => {
    const mockBridge: Win32NativeBridge = {
      createWindow: vi.fn(async () => 0x6666),
      destroyWindow: vi.fn(async () => {}),
      setWindowLongPtr: vi.fn(async () => 0),
      getWindowLongPtr: vi.fn(async () => 0),
      setWindowPos: vi.fn(async () => true),
      setLayeredWindowAttributes: vi.fn(async () => true),
      showWindow: vi.fn(async () => true),
    };

    const win = new Win32OverlayWindow(mockBridge);
    await win.create();
    await win.setVisibility(true);

    // Negative coordinates (monitor to the left)
    await win.setGeometry({ x: -1360, y: 910, width: 800, height: 120 });

    expect(mockBridge.setWindowPos).toHaveBeenCalledWith(
      0x6666,
      HWND_NOTOPMOST, // default normal
      -1360,
      910,
      800,
      120,
      SWP_NOACTIVATE | SWP_SHOWWINDOW
    );
  });
});
