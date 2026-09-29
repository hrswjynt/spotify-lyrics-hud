import { describe, expect, it, vi } from 'vitest';
import {
  WaylandLayerShellWindow,
  WaylandNativeBridge,
  WlrLayer,
  WlrLayerAnchor,
} from '../../src/platform/linux/wayland-window.js';

describe('Linux / Wayland Layer-Shell Window Adapter', () => {
  it('creates a layer surface with overlay layer and initial dimensions', async () => {
    const mockBridge: WaylandNativeBridge = {
      createLayerSurface: vi.fn(async () => 'surf-123'),
      destroyLayerSurface: vi.fn(async () => {}),
      setLayer: vi.fn(async () => {}),
      setAnchorsAndMargins: vi.fn(async () => {}),
      setSize: vi.fn(async () => {}),
      setInputRegion: vi.fn(async () => {}),
      setOutput: vi.fn(async () => {}),
      setOpacity: vi.fn(async () => {}),
      setVisibility: vi.fn(async () => {}),
    };

    const win = new WaylandLayerShellWindow(mockBridge);

    // Initial state before creation
    expect(win.getActualState().created).toBe(false);

    await win.create();

    expect(win.getActualState().created).toBe(true);
    expect(mockBridge.createLayerSurface).toHaveBeenCalledWith({
      layer: WlrLayer.Bottom, // 'normal' default
      outputName: undefined,
      width: 700,
      height: 100,
    });
  });

  it('translates layerShellConfig into native anchor bitmasks and margins', async () => {
    const mockBridge: WaylandNativeBridge = {
      createLayerSurface: vi.fn(async () => 'surf-123'),
      destroyLayerSurface: vi.fn(async () => {}),
      setLayer: vi.fn(async () => {}),
      setAnchorsAndMargins: vi.fn(async () => {}),
      setSize: vi.fn(async () => {}),
      setInputRegion: vi.fn(async () => {}),
      setOutput: vi.fn(async () => {}),
      setOpacity: vi.fn(async () => {}),
      setVisibility: vi.fn(async () => {}),
    };

    const win = new WaylandLayerShellWindow(mockBridge);
    await win.create();

    // bottom-center placement config
    await win.setGeometry(
      { x: 610, y: 932, width: 700, height: 100 },
      {
        anchorTop: false,
        anchorBottom: true,
        anchorLeft: false,
        anchorRight: false,
        marginTop: 0,
        marginBottom: 48,
        marginLeft: 0,
        marginRight: 0,
      }
    );

    expect(mockBridge.setSize).toHaveBeenCalledWith('surf-123', 700, 100);
    expect(mockBridge.setAnchorsAndMargins).toHaveBeenCalledWith(
      'surf-123',
      WlrLayerAnchor.Bottom, // 2
      { top: 0, right: 0, bottom: 48, left: 0 }
    );
  });

  it('sets input region to empty for passthrough mode (click-through)', async () => {
    const mockBridge: WaylandNativeBridge = {
      createLayerSurface: vi.fn(async () => 'surf-123'),
      destroyLayerSurface: vi.fn(async () => {}),
      setLayer: vi.fn(async () => {}),
      setAnchorsAndMargins: vi.fn(async () => {}),
      setSize: vi.fn(async () => {}),
      setInputRegion: vi.fn(async () => {}),
      setOutput: vi.fn(async () => {}),
      setOpacity: vi.fn(async () => {}),
      setVisibility: vi.fn(async () => {}),
    };

    const win = new WaylandLayerShellWindow(mockBridge);
    await win.create();

    await win.setInputMode('passthrough');
    expect(mockBridge.setInputRegion).toHaveBeenCalledWith('surf-123', true);
    expect(win.getActualState().inputMode).toBe('passthrough');

    await win.setInputMode('interactive');
    expect(mockBridge.setInputRegion).toHaveBeenCalledWith('surf-123', false);
    expect(win.getActualState().inputMode).toBe('interactive');
  });

  it('maps zOrder to correct Wayland layer', async () => {
    const mockBridge: WaylandNativeBridge = {
      createLayerSurface: vi.fn(async () => 'surf-123'),
      destroyLayerSurface: vi.fn(async () => {}),
      setLayer: vi.fn(async () => {}),
      setAnchorsAndMargins: vi.fn(async () => {}),
      setSize: vi.fn(async () => {}),
      setInputRegion: vi.fn(async () => {}),
      setOutput: vi.fn(async () => {}),
      setOpacity: vi.fn(async () => {}),
      setVisibility: vi.fn(async () => {}),
    };

    const win = new WaylandLayerShellWindow(mockBridge);
    await win.create();

    await win.setZOrder('overlay');
    expect(mockBridge.setLayer).toHaveBeenCalledWith('surf-123', WlrLayer.Overlay);

    await win.setZOrder('topmost');
    expect(mockBridge.setLayer).toHaveBeenCalledWith('surf-123', WlrLayer.Top);

    await win.setZOrder('normal');
    expect(mockBridge.setLayer).toHaveBeenCalledWith('surf-123', WlrLayer.Bottom);
  });
});
