import { describe, expect, it } from 'vitest';
import {
  Win32DisplayNativeBridge,
  Win32DisplayProvider,
} from '../../src/platform/windows/win32-display-provider.js';

describe('Windows / Win32 Display Provider', () => {
  it('enumerates multi-monitors with virtual coordinates and work areas', async () => {
    const mockBridge: Win32DisplayNativeBridge = {
      enumDisplayMonitors: async () => [
        {
          hMonitor: 0x1,
          deviceName: '\\\\.\\DISPLAY1',
          rcMonitor: { x: 0, y: 0, width: 1920, height: 1080 },
          rcWork: { x: 0, y: 0, width: 1920, height: 1040 },
          isPrimary: true,
          dpiScale: 1.0,
        },
        {
          hMonitor: 0x2,
          deviceName: '\\\\.\\DISPLAY2',
          rcMonitor: { x: -1920, y: 0, width: 1920, height: 1080 },
          rcWork: { x: -1920, y: 0, width: 1920, height: 1080 },
          isPrimary: false,
          dpiScale: 1.25,
        },
      ],
      onDisplayChangeMessage: () => () => {},
    };

    const provider = new Win32DisplayProvider(mockBridge);
    const displays = await provider.getDisplays();

    expect(displays).toHaveLength(2);

    expect(displays[0].id).toBe('\\\\.\\DISPLAY1');
    expect(displays[0].primary).toBe(true);
    expect(displays[0].workArea.height).toBe(1040);

    expect(displays[1].id).toBe('\\\\.\\DISPLAY2');
    expect(displays[1].primary).toBe(false);
    expect(displays[1].bounds.x).toBe(-1920);
    expect(displays[1].scaleFactor).toBe(1.25);
  });
});
