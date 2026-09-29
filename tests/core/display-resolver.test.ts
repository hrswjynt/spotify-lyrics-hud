import { describe, expect, it } from 'vitest';
import { resolveDisplay } from '../../src/core/display-resolver.js';
import { Display } from '../../src/core/types.js';

describe('Display Resolver', () => {
  const primaryDisplay: Display = {
    id: 'DP-1',
    name: 'Main Display',
    bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1040 },
    scaleFactor: 1.0,
    primary: true,
  };

  const secondaryDisplay: Display = {
    id: 'HDMI-A-1',
    name: 'Secondary Display',
    bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
    workArea: { x: 1920, y: 0, width: 1920, height: 1080 },
    scaleFactor: 1.0,
    primary: false,
  };

  const displays = [primaryDisplay, secondaryDisplay];

  it('resolves primary display selector', () => {
    const result = resolveDisplay(
      { type: 'primary' },
      { displays, primaryDisplay }
    );
    expect(result.id).toBe('DP-1');
  });

  it('resolves specific display by ID', () => {
    const result = resolveDisplay(
      { type: 'id', id: 'HDMI-A-1' },
      { displays, primaryDisplay }
    );
    expect(result.id).toBe('HDMI-A-1');
  });

  it('falls back to primary display if requested display ID is missing (unplugged)', () => {
    const result = resolveDisplay(
      { type: 'id', id: 'DISCONNECTED-DISPLAY' },
      { displays, primaryDisplay }
    );
    expect(result.id).toBe('DP-1');
  });

  it('resolves active display when provided', () => {
    const result = resolveDisplay(
      { type: 'active' },
      { displays, primaryDisplay, activeDisplay: secondaryDisplay }
    );
    expect(result.id).toBe('HDMI-A-1');
  });

  it('resolves display containing cursor coordinates', () => {
    // Cursor on secondary monitor at x: 2500, y: 500
    const result = resolveDisplay(
      { type: 'cursor' },
      { displays, primaryDisplay, cursorPosition: { x: 2500, y: 500 } }
    );
    expect(result.id).toBe('HDMI-A-1');
  });

  it('resolves display for target window', () => {
    const result = resolveDisplay(
      { type: 'target-window', windowTitleOrId: 'Spotify' },
      { displays, primaryDisplay, targetWindowDisplayId: 'HDMI-A-1' }
    );
    expect(result.id).toBe('HDMI-A-1');
  });
});
