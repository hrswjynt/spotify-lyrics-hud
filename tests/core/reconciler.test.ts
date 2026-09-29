import { describe, expect, it, vi } from 'vitest';
import { diffState, reconcileOverlay } from '../../src/core/reconciler.js';
import {
  ActualWindowState,
  OverlayWindow,
  ResolvedOverlayState,
} from '../../src/core/types.js';

describe('State Reconciler & Diffing Engine', () => {
  const baseDesired: ResolvedOverlayState = {
    visible: true,
    geometry: { x: 100, y: 200, width: 600, height: 120 },
    displayId: 'DP-1',
    zOrder: 'overlay',
    inputMode: 'passthrough',
    keyboardMode: 'none',
    opacity: 1.0,
  };

  it('generates zero diffs when actual matches desired state', () => {
    const actual: ActualWindowState = {
      created: true,
      visible: true,
      geometry: { x: 100, y: 200, width: 600, height: 120 },
      displayId: 'DP-1',
      zOrder: 'overlay',
      inputMode: 'passthrough',
      keyboardMode: 'none',
      opacity: 1.0,
    };

    const diffs = diffState(baseDesired, actual);
    expect(diffs).toHaveLength(0);
  });

  it('detects uncreated window and requests creation', () => {
    const actual: ActualWindowState = {
      created: false,
      visible: false,
      geometry: { x: 0, y: 0, width: 0, height: 0 },
      displayId: '',
      zOrder: 'normal',
      inputMode: 'interactive',
      keyboardMode: 'none',
      opacity: 1.0,
    };

    const diffs = diffState(baseDesired, actual);
    expect(diffs.some((d) => d.action === 'create')).toBe(true);
    expect(diffs.some((d) => d.action === 'set_geometry')).toBe(true);
    expect(diffs.some((d) => d.action === 'set_input_mode')).toBe(true);
    expect(diffs.some((d) => d.action === 'set_z_order')).toBe(true);
  });

  it('detects inputMode change (e.g. interactive to passthrough)', () => {
    const actual: ActualWindowState = {
      created: true,
      visible: true,
      geometry: { x: 100, y: 200, width: 600, height: 120 },
      displayId: 'DP-1',
      zOrder: 'overlay',
      inputMode: 'interactive', // Differs!
      keyboardMode: 'none',
      opacity: 1.0,
    };

    const diffs = diffState(baseDesired, actual);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      action: 'set_input_mode',
      from: 'interactive',
      to: 'passthrough',
    });
  });

  it('reconciles native window mock with precise method calls', async () => {
    const mockWindow: OverlayWindow = {
      create: vi.fn().mockResolvedValue(undefined),
      destroy: vi.fn().mockResolvedValue(undefined),
      setGeometry: vi.fn().mockResolvedValue(undefined),
      setVisibility: vi.fn().mockResolvedValue(undefined),
      setInputMode: vi.fn().mockResolvedValue(undefined),
      setZOrder: vi.fn().mockResolvedValue(undefined),
      setDisplay: vi.fn().mockResolvedValue(undefined),
      setOpacity: vi.fn().mockResolvedValue(undefined),
      getActualState: vi.fn().mockReturnValue({
        created: true,
        visible: false,
        geometry: { x: 0, y: 0, width: 500, height: 100 },
        displayId: 'HDMI-1',
        zOrder: 'normal',
        inputMode: 'interactive',
        keyboardMode: 'none',
        opacity: 0.8,
      }),
    };

    const executedDiffs = await reconcileOverlay(mockWindow, baseDesired);

    expect(executedDiffs.length).toBeGreaterThan(0);
    expect(mockWindow.setDisplay).toHaveBeenCalledWith('DP-1');
    expect(mockWindow.setGeometry).toHaveBeenCalledWith(
      baseDesired.geometry,
      undefined
    );
    expect(mockWindow.setZOrder).toHaveBeenCalledWith('overlay');
    expect(mockWindow.setInputMode).toHaveBeenCalledWith('passthrough');
    expect(mockWindow.setVisibility).toHaveBeenCalledWith(true);
    expect(mockWindow.setOpacity).toHaveBeenCalledWith(1.0);
  });
});
