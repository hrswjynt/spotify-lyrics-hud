import { describe, expect, it, vi } from 'vitest';
import { TauriOverlayWindow } from '../../src/platform/tauri/tauri-window.js';
import { TauriDisplayProvider } from '../../src/platform/tauri/tauri-display-provider.js';
import { TauriPlatformAdapter } from '../../src/platform/tauri/tauri-adapter.js';

describe('Tauri Platform Adapter', () => {
  describe('TauriOverlayWindow', () => {
    it('invokes set_click_through with passthrough true/false', async () => {
      const mockInvoke = vi.fn().mockResolvedValue(undefined);
      const window = new TauriOverlayWindow({ invoke: mockInvoke });

      await window.create();
      expect(window.getActualState().created).toBe(true);

      window.setInputMode('passthrough');
      expect(mockInvoke).toHaveBeenCalledWith('set_click_through', { passthrough: true });
      expect(window.getActualState().inputMode).toBe('passthrough');

      window.setInputMode('interactive');
      expect(mockInvoke).toHaveBeenCalledWith('set_click_through', { passthrough: false });
      expect(window.getActualState().inputMode).toBe('interactive');
    });

    it('invokes set_overlay_geometry on setGeometry', () => {
      const mockInvoke = vi.fn().mockResolvedValue(undefined);
      const window = new TauriOverlayWindow({ invoke: mockInvoke });

      window.setGeometry({ x: 50, y: 100, width: 750, height: 120 });
      expect(mockInvoke).toHaveBeenCalledWith('set_overlay_geometry', {
        x: 50,
        y: 100,
        width: 750,
        height: 120,
      });
      expect(window.getActualState().geometry).toEqual({
        x: 50,
        y: 100,
        width: 750,
        height: 120,
      });
    });

    it('invokes set_overlay_visibility on setVisibility', () => {
      const mockInvoke = vi.fn().mockResolvedValue(undefined);
      const window = new TauriOverlayWindow({ invoke: mockInvoke });

      window.setVisibility(false);
      expect(mockInvoke).toHaveBeenCalledWith('set_overlay_visibility', { visible: false });
      expect(window.getActualState().visible).toBe(false);

      window.setVisibility(true);
      expect(mockInvoke).toHaveBeenCalledWith('set_overlay_visibility', { visible: true });
      expect(window.getActualState().visible).toBe(true);
    });

    it('invokes set_overlay_z_order on setZOrder', () => {
      const mockInvoke = vi.fn().mockResolvedValue(undefined);
      const window = new TauriOverlayWindow({ invoke: mockInvoke });

      window.setZOrder('overlay');
      expect(mockInvoke).toHaveBeenCalledWith('set_overlay_z_order', { topmost: true });
      expect(window.getActualState().zOrder).toBe('overlay');

      window.setZOrder('normal');
      expect(mockInvoke).toHaveBeenCalledWith('set_overlay_z_order', { topmost: false });
      expect(window.getActualState().zOrder).toBe('normal');
    });
  });

  describe('TauriDisplayProvider', () => {
    it('queries native monitors and maps to Display interface', async () => {
      const mockNativeMonitors = [
        {
          id: 'eDP-1',
          name: 'AU Optronics',
          bounds: { x: 0, y: 1080, width: 1920, height: 1080 },
          workArea: { x: 0, y: 1080, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          primary: false,
        },
        {
          id: 'HDMI-A-1',
          name: 'Xiaomi Monitor',
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          workArea: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          primary: true,
        },
      ];

      const mockInvoke = vi.fn().mockResolvedValue(mockNativeMonitors);
      const provider = new TauriDisplayProvider({ invoke: mockInvoke });

      const displays = await provider.getDisplays();
      expect(displays).toHaveLength(2);
      expect(displays[0].id).toBe('eDP-1');
      expect(displays[1].primary).toBe(true);

      const primary = await provider.getPrimaryDisplay();
      expect(primary.id).toBe('HDMI-A-1');
    });
  });

  describe('TauriPlatformAdapter', () => {
    it('creates windows and displays with tauri capabilities', async () => {
      const adapter = new TauriPlatformAdapter();
      expect(adapter.getCapabilities().clickThrough).toBe(true);
      expect(adapter.getCapabilities().alwaysOnTop).toBe(true);
      expect(adapter.backend).toBe('tauri');

      const window = await adapter.createOverlayWindow();
      expect(window).toBeDefined();

      const displayProvider = adapter.getDisplayProvider();
      expect(displayProvider).toBeDefined();
    });
  });
});
