import { describe, expect, it, vi } from 'vitest';
import { HyprlandIPC, HyprlandMonitorJSON } from '../../src/platform/linux/hyprland-ipc.js';

describe('Hyprland IPC Integration Layer', () => {
  it('correctly maps raw Hyprland monitor JSON to Platform-neutral Display objects', async () => {
    const ipc = new HyprlandIPC();

    const mockMonitors: HyprlandMonitorJSON[] = [
      {
        id: 0,
        name: 'eDP-1',
        description: 'AU Optronics 0xD0A2',
        make: 'AU Optronics',
        model: '0xD0A2',
        serial: '',
        width: 1920,
        height: 1080,
        refreshRate: 144.42,
        x: 0,
        y: 1080,
        activeWorkspace: { id: 9, name: '9' },
        specialWorkspace: { id: 0, name: '' },
        reserved: [0, 40, 0, 0], // 40px top bar
        scale: 1.0,
        transform: 0,
        focused: false,
        dpmsStatus: true,
        disabled: false,
      },
      {
        id: 1,
        name: 'HDMI-A-1',
        description: 'Xiaomi Corporation A22FAB',
        make: 'Xiaomi Corporation',
        model: 'A22FAB',
        serial: '483411',
        width: 1920,
        height: 1080,
        refreshRate: 75.0,
        x: 0,
        y: 0,
        activeWorkspace: { id: 2, name: '2' },
        specialWorkspace: { id: 0, name: '' },
        reserved: [0, 40, 0, 0],
        scale: 1.0,
        transform: 0,
        focused: true,
        dpmsStatus: true,
        disabled: false,
      },
    ];

    vi.spyOn(ipc, 'sendCommand').mockResolvedValue(JSON.stringify(mockMonitors));

    const displays = await ipc.getMonitors();

    expect(displays).toHaveLength(2);

    // Monitor 0: eDP-1 at 0x1080
    expect(displays[0].id).toBe('eDP-1');
    expect(displays[0].bounds).toEqual({ x: 0, y: 1080, width: 1920, height: 1080 });
    // Work area: reserved[1] is 40 (top bar) -> y becomes 1080 + 40 = 1120, height = 1040
    expect(displays[0].workArea).toEqual({ x: 0, y: 1120, width: 1920, height: 1040 });

    // Monitor 1: HDMI-A-1 at 0x0
    expect(displays[1].id).toBe('HDMI-A-1');
    expect(displays[1].primary).toBe(true); // focused is true
    expect(displays[1].workArea).toEqual({ x: 0, y: 40, width: 1920, height: 1040 });
  });

  it('detects fullscreen window state via activewindow', async () => {
    const ipc = new HyprlandIPC();

    vi.spyOn(ipc, 'getMonitors').mockResolvedValue([
      {
        id: 'HDMI-A-1',
        name: 'HDMI-A-1',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        workArea: { x: 0, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
        primary: true,
      },
    ]);

    vi.spyOn(ipc, 'getActiveWindow').mockResolvedValue({
      address: '0x123',
      mapped: true,
      hidden: false,
      at: [0, 0],
      size: [1920, 1080],
      workspace: { id: 1, name: '1' },
      floating: false,
      pseudo: false,
      monitor: 0,
      class: 'steam_app_1245620',
      title: 'Elden Ring',
      initialClass: 'eldenring.exe',
      initialTitle: 'Elden Ring',
      pid: 12345,
      xwayland: true,
      pinned: false,
      fullscreen: true,
      fullscreenClient: 1,
      grouped: [],
      tags: [],
      swallowing: '',
      focusHistoryID: 1,
    });

    const fsState = await ipc.getFullscreenState();

    expect(fsState).toEqual({
      state: 'fullscreen',
      displayId: 'HDMI-A-1',
      applicationId: 'steam_app_1245620',
    });
  });

  it('detects windowed state when no fullscreen client active', async () => {
    const ipc = new HyprlandIPC();

    vi.spyOn(ipc, 'getActiveWindow').mockResolvedValue({
      address: '0x124',
      mapped: true,
      hidden: false,
      at: [100, 100],
      size: [800, 600],
      workspace: { id: 1, name: '1' },
      floating: true,
      pseudo: false,
      monitor: 0,
      class: 'spotify',
      title: 'Spotify Premium',
      initialClass: 'spotify',
      initialTitle: 'Spotify',
      pid: 54321,
      xwayland: false,
      pinned: false,
      fullscreen: false,
      fullscreenClient: 0,
      grouped: [],
      tags: [],
      swallowing: '',
      focusHistoryID: 2,
    });

    const fsState = await ipc.getFullscreenState();
    expect(fsState).toEqual({ state: 'windowed' });
  });
});
