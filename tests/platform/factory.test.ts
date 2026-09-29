import { describe, expect, it } from 'vitest';
import { createPlatformAdapter } from '../../src/platform/factory.js';

describe('Platform Factory & Runtime Adapter Selection', () => {
  it('instantiates WaylandPlatformAdapter for Linux', () => {
    const adapter = createPlatformAdapter({ forcePlatform: 'linux' });
    expect(adapter.platform).toBe('linux');
    expect(adapter.backend).toBe('wayland');

    const capabilities = adapter.getCapabilities();
    expect(capabilities.layerShell).toBe(true);
    expect(capabilities.clickThrough).toBe(true);
    expect(capabilities.alwaysOnTop).toBe(true);
    adapter.dispose();
  });

  it('instantiates WindowsPlatformAdapter for Windows', () => {
    const adapter = createPlatformAdapter({ forcePlatform: 'windows' });
    expect(adapter.platform).toBe('windows');
    expect(adapter.backend).toBe('win32');

    const capabilities = adapter.getCapabilities();
    expect(capabilities.layerShell).toBe(false); // Windows does not use layer-shell
    expect(capabilities.clickThrough).toBe(true); // Windows uses WS_EX_TRANSPARENT
    expect(capabilities.alwaysOnTop).toBe(true); // Windows uses HWND_TOPMOST
    expect(capabilities.fullscreenDetection).toBe(true);
    adapter.dispose();
  });
});
