import { describe, expect, it, vi } from 'vitest';
import { OverlayEngine } from '../../src/core/overlay-engine.js';
import { Display, DisplayProvider, FullscreenDetector, OverlayWindow } from '../../src/core/types.js';
import { SpotifyService } from '../../src/data/spotify-service.js';
import { SystemController } from '../../src/system/system-controller.js';

describe('SystemController Orchestrator', () => {
  const displays: Display[] = [
    {
      id: 'DP-1',
      name: 'Monitor 1',
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 40, width: 1920, height: 1040 },
      scaleFactor: 1.0,
      primary: true,
    },
    {
      id: 'HDMI-1',
      name: 'Monitor 2',
      bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
      workArea: { x: 1920, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1.0,
      primary: false,
    },
  ];

  function createTestHarness() {
    const mockWindow: OverlayWindow = {
      create: vi.fn(),
      destroy: vi.fn(),
      setGeometry: vi.fn(),
      setVisibility: vi.fn(),
      setInputMode: vi.fn(),
      setZOrder: vi.fn(),
      setDisplay: vi.fn(),
      setOpacity: vi.fn(),
      getActualState: vi.fn(() => ({
        created: true,
        visible: true,
        geometry: { x: 0, y: 0, width: 700, height: 100 },
        displayId: 'DP-1',
        zOrder: 'overlay' as const,
        inputMode: 'passthrough' as const,
        keyboardMode: 'none' as const,
        opacity: 1.0,
      })),
    };

    const mockDisplayProvider: DisplayProvider = {
      getDisplays: vi.fn(async () => displays),
      getPrimaryDisplay: vi.fn(async () => displays[0]),
      getActiveDisplay: vi.fn(async () => displays[0]),
      onDisplaysChanged: vi.fn(() => () => {}),
      dispose: vi.fn(),
    };

    const mockFullscreenDetector: FullscreenDetector = {
      getFullscreenState: vi.fn(async () => ({ state: 'windowed' as const })),
      onFullscreenChanged: vi.fn(() => () => {}),
      dispose: vi.fn(),
    };

    const engine = new OverlayEngine({
      window: mockWindow,
      displayProvider: mockDisplayProvider,
      fullscreenDetector: mockFullscreenDetector,
      capabilities: {
        layerShell: true,
        alwaysOnTop: true,
        clickThrough: true,
        multiMonitor: true,
        fullscreenDetection: true,
        fractionalScaling: true,
      },
      platformName: 'linux',
      backendName: 'wayland',
    });

    return { engine, mockWindow, mockDisplayProvider };
  }

  it('toggles click-through via hotkey trigger and updates engine intent', async () => {
    const { engine, mockDisplayProvider } = createTestHarness();
    await engine.start();

    const controller = new SystemController({ engine, displayProvider: mockDisplayProvider });
    await controller.start();

    expect(engine.getIntent().interaction.pointer).toBe('passthrough');

    // Trigger hotkey Ctrl+Shift+X
    await controller.getHotkeyManager().trigger('Ctrl+Shift+X');
    expect(engine.getIntent().interaction.pointer).toBe('interactive');

    // Trigger again
    await controller.getHotkeyManager().trigger('Ctrl+Shift+X');
    expect(engine.getIntent().interaction.pointer).toBe('passthrough');

    controller.dispose();
  });

  it('cycles monitors in round-robin order via hotkey trigger', async () => {
    const { engine, mockDisplayProvider } = createTestHarness();
    await engine.start();

    const controller = new SystemController({ engine, displayProvider: mockDisplayProvider });
    await controller.start();

    // Initially on primary DP-1
    expect(engine.getIntent().display).toEqual({ type: 'primary' });

    // Cycle monitor -> should select HDMI-1
    await controller.getHotkeyManager().trigger('Ctrl+Shift+M');
    expect(engine.getIntent().display).toEqual({ type: 'id', id: 'HDMI-1' });

    // Cycle monitor again -> should wrap back to DP-1
    await controller.getHotkeyManager().trigger('Ctrl+Shift+M');
    expect(engine.getIntent().display).toEqual({ type: 'id', id: 'DP-1' });

    controller.dispose();
  });

  it('toggles overlay visibility via hotkey trigger', async () => {
    const { engine, mockDisplayProvider } = createTestHarness();
    await engine.start();

    const controller = new SystemController({ engine, displayProvider: mockDisplayProvider });
    await controller.start();

    expect(engine.getIntent().visible).toBe(true);

    // Trigger Ctrl+Shift+H
    await controller.getHotkeyManager().trigger('Ctrl+Shift+H');
    expect(engine.getIntent().visible).toBe(false);

    // Trigger again
    await controller.getHotkeyManager().trigger('Ctrl+Shift+H');
    expect(engine.getIntent().visible).toBe(true);

    controller.dispose();
  });
});
