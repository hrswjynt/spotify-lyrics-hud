import { describe, expect, it, vi } from 'vitest';
import { OverlayEngine } from '../../src/core/overlay-engine.js';
import {
  ActualWindowState,
  Display,
  DisplayProvider,
  FullscreenDetector,
  FullscreenState,
  OverlayWindow,
  PlatformCapabilities,
} from '../../src/core/types.js';

describe('OverlayEngine Orchestration', () => {
  const displays: Display[] = [
    {
      id: 'DP-1',
      name: 'Primary-1080p',
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 40, width: 1920, height: 1040 },
      scaleFactor: 1.0,
      primary: true,
    },
    {
      id: 'HDMI-1',
      name: 'Secondary-1080p',
      bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
      workArea: { x: 1920, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1.0,
      primary: false,
    },
  ];

  function createTestHarness() {
    let actualState: ActualWindowState = {
      created: false,
      visible: false,
      geometry: { x: 0, y: 0, width: 0, height: 0 },
      displayId: '',
      zOrder: 'normal',
      inputMode: 'interactive',
      keyboardMode: 'none',
      opacity: 1.0,
    };

    const mockWindow: OverlayWindow = {
      create: vi.fn(async () => {
        actualState.created = true;
      }),
      destroy: vi.fn(async () => {
        actualState.created = false;
      }),
      setGeometry: vi.fn(async (geo) => {
        actualState.geometry = { ...geo };
      }),
      setVisibility: vi.fn(async (vis) => {
        actualState.visible = vis;
      }),
      setInputMode: vi.fn(async (mode) => {
        actualState.inputMode = mode;
      }),
      setZOrder: vi.fn(async (z) => {
        actualState.zOrder = z;
      }),
      setDisplay: vi.fn(async (dispId) => {
        actualState.displayId = dispId;
      }),
      setOpacity: vi.fn(async (op) => {
        actualState.opacity = op;
      }),
      getActualState: vi.fn(() => ({ ...actualState })),
    };

    let displayListeners: Array<(d: Display[]) => void> = [];
    const mockDisplayProvider: DisplayProvider = {
      getDisplays: vi.fn(async () => displays),
      getPrimaryDisplay: vi.fn(async () => displays[0]),
      getActiveDisplay: vi.fn(async () => displays[0]),
      onDisplaysChanged: vi.fn((cb) => {
        displayListeners.push(cb);
        return () => {
          displayListeners = displayListeners.filter((l) => l !== cb);
        };
      }),
      dispose: vi.fn(),
    };

    let fullscreenListeners: Array<(s: FullscreenState) => void> = [];
    const mockFullscreenDetector: FullscreenDetector = {
      getFullscreenState: vi.fn(async () => ({ state: 'windowed' as const })),
      onFullscreenChanged: vi.fn((cb) => {
        fullscreenListeners.push(cb);
        return () => {
          fullscreenListeners = fullscreenListeners.filter((l) => l !== cb);
        };
      }),
      dispose: vi.fn(),
    };

    const capabilities: PlatformCapabilities = {
      layerShell: true,
      alwaysOnTop: true,
      clickThrough: true,
      multiMonitor: true,
      fullscreenDetection: true,
      fractionalScaling: true,
    };

    const engine = new OverlayEngine({
      window: mockWindow,
      displayProvider: mockDisplayProvider,
      fullscreenDetector: mockFullscreenDetector,
      capabilities,
      platformName: 'Linux',
      backendName: 'Wayland',
      compositorName: 'Hyprland',
    });

    return {
      engine,
      mockWindow,
      mockDisplayProvider,
      mockFullscreenDetector,
      triggerFullscreen: (s: FullscreenState) =>
        fullscreenListeners.forEach((l) => l(s)),
      triggerDisplaysChanged: (d: Display[]) =>
        displayListeners.forEach((l) => l(d)),
    };
  }

  it('initializes and applies default intent on start()', async () => {
    const { engine, mockWindow } = createTestHarness();

    await engine.start();

    expect(mockWindow.create).toHaveBeenCalled();
    expect(mockWindow.setDisplay).toHaveBeenCalledWith('DP-1');
    expect(mockWindow.setZOrder).toHaveBeenCalledWith('overlay');
    expect(mockWindow.setInputMode).toHaveBeenCalledWith('passthrough');
    expect(mockWindow.setVisibility).toHaveBeenCalledWith(true);

    const diagnostics = engine.getDiagnostics();
    expect(diagnostics.platform).toBe('Linux');
    expect(diagnostics.backend).toBe('Wayland');
    expect(diagnostics.compositor).toBe('Hyprland');
    expect(diagnostics.inputMode).toBe('passthrough');
  });

  it('dynamically responds to fullscreen events under hide-on-exclusive-fullscreen policy', async () => {
    const { engine, mockWindow, triggerFullscreen } = createTestHarness();
    await engine.start();

    // Default intent is on DP-1, policy is 'hide-on-exclusive-fullscreen'
    // Game goes fullscreen on HDMI-1 (different monitor)
    triggerFullscreen({
      state: 'fullscreen',
      displayId: 'HDMI-1',
      applicationId: 'game.exe',
    });

    // Let microtasks run
    await new Promise((r) => setTimeout(r, 10));

    // Overlay is on DP-1, so it SHOULD remain visible!
    expect(engine.getLastResolvedState()?.visible).toBe(true);

    // Now game goes fullscreen on DP-1 (same monitor as overlay)
    triggerFullscreen({
      state: 'fullscreen',
      displayId: 'DP-1',
      applicationId: 'game.exe',
    });

    await new Promise((r) => setTimeout(r, 10));

    // Overlay MUST hide!
    expect(engine.getLastResolvedState()?.visible).toBe(false);
  });

  it('updates placement dynamically via setIntent()', async () => {
    const { engine, mockWindow } = createTestHarness();
    await engine.start();

    await engine.setIntent({
      placement: {
        anchor: 'top-right',
        offset: { x: -20, y: 20 },
        size: { width: 400, height: 100 },
      },
    });

    const last = engine.getLastResolvedState();
    expect(last?.geometry.x).toBe(1920 - 400 - 20); // 1500
    expect(last?.geometry.y).toBe(40 + 20); // 60
  });

  it('toggles click-through input mode via setIntent()', async () => {
    const { engine, mockWindow } = createTestHarness();
    await engine.start();

    expect(mockWindow.setInputMode).toHaveBeenLastCalledWith('passthrough');

    await engine.setIntent({
      interaction: {
        pointer: 'interactive',
        keyboard: 'interactive',
      },
    });

    expect(mockWindow.setInputMode).toHaveBeenLastCalledWith('interactive');
  });
});
