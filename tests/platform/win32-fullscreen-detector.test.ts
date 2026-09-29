import { describe, expect, it } from 'vitest';
import {
  Win32FullscreenBridge,
  Win32FullscreenDetector,
} from '../../src/platform/windows/win32-fullscreen-detector.js';

describe('Windows / Win32 Fullscreen Detector', () => {
  it('detects windowed foreground application', async () => {
    const mockBridge: Win32FullscreenBridge = {
      getForegroundWindow: async () => ({
        hwnd: 0x101,
        rect: { x: 50, y: 50, width: 1200, height: 800 },
        style: 0x14cf0000, // WS_OVERLAPPEDWINDOW with WS_CAPTION
        monitorName: '\\\\.\\DISPLAY1',
        processName: 'chrome.exe',
      }),
      onForegroundChanged: () => () => {},
    };

    const detector = new Win32FullscreenDetector(mockBridge);
    const state = await detector.getFullscreenState();

    expect(state).toEqual({ state: 'windowed' });
    detector.dispose();
  });

  it('detects borderless fullscreen application covering display', async () => {
    const mockBridge: Win32FullscreenBridge = {
      getForegroundWindow: async () => ({
        hwnd: 0x102,
        rect: { x: 0, y: 0, width: 1920, height: 1080 },
        style: 0x90000000, // WS_POPUP | WS_VISIBLE (no WS_CAPTION)
        monitorName: '\\\\.\\DISPLAY1',
        processName: 'cyberpunk2077.exe',
      }),
      onForegroundChanged: () => () => {},
    };

    const detector = new Win32FullscreenDetector(mockBridge);
    const state = await detector.getFullscreenState();

    expect(state).toEqual({
      state: 'fullscreen',
      displayId: '\\\\.\\DISPLAY1',
      applicationId: 'cyberpunk2077.exe',
    });
    detector.dispose();
  });
});
