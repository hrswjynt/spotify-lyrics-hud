import { describe, expect, it } from 'vitest';
import { HyprlandIPC } from '../../src/platform/linux/hyprland-ipc.js';

describe('Live Hyprland IPC Integration (Real System)', () => {
  it('connects to real Hyprland socket if signature exists', async () => {
    const ipc = new HyprlandIPC();
    if (!ipc.isAvailable()) {
      console.log('Skipping live Hyprland test: HYPRLAND_INSTANCE_SIGNATURE not set.');
      return;
    }

    const monitors = await ipc.getMonitors();
    expect(Array.isArray(monitors)).toBe(true);
    expect(monitors.length).toBeGreaterThan(0);

    const firstMon = monitors[0];
    expect(firstMon.id).toBeDefined();
    expect(firstMon.bounds.width).toBeGreaterThan(0);
    expect(firstMon.bounds.height).toBeGreaterThan(0);

    console.log(`Live Hyprland verified: Detected ${monitors.length} monitor(s):`, monitors.map((m) => `${m.id} (${m.bounds.width}x${m.bounds.height} at ${m.bounds.x},${m.bounds.y})`).join(', '));
  });
});
