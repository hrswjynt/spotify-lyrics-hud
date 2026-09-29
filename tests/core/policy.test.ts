import { describe, expect, it } from 'vitest';
import {
  evaluateFullscreenVisibility,
  resolveInteraction,
} from '../../src/core/policy.js';

describe('Fullscreen Policy Evaluation', () => {
  it('returns false immediately if intent visible is false', () => {
    const visible = evaluateFullscreenVisibility({
      intentVisible: false,
      behavior: 'always-show',
      fullscreenState: { state: 'windowed' },
      targetDisplayId: 'DP-1',
    });
    expect(visible).toBe(false);
  });

  it('keeps visible in windowed mode regardless of behavior', () => {
    const visible = evaluateFullscreenVisibility({
      intentVisible: true,
      behavior: 'always-hide',
      fullscreenState: { state: 'windowed' },
      targetDisplayId: 'DP-1',
    });
    expect(visible).toBe(true);
  });

  it('handles "unknown" fullscreen state by staying visible', () => {
    const visible = evaluateFullscreenVisibility({
      intentVisible: true,
      behavior: 'hide-on-exclusive-fullscreen',
      fullscreenState: { state: 'unknown' },
      targetDisplayId: 'DP-1',
    });
    expect(visible).toBe(true);
  });

  describe('When a fullscreen window is active', () => {
    it('always-show keeps overlay visible over fullscreen', () => {
      const visible = evaluateFullscreenVisibility({
        intentVisible: true,
        behavior: 'always-show',
        fullscreenState: {
          state: 'fullscreen',
          displayId: 'DP-1',
          applicationId: 'game.exe',
        },
        targetDisplayId: 'DP-1',
      });
      expect(visible).toBe(true);
    });

    it('always-hide hides overlay when any window is fullscreen', () => {
      const visible = evaluateFullscreenVisibility({
        intentVisible: true,
        behavior: 'always-hide',
        fullscreenState: {
          state: 'fullscreen',
          displayId: 'HDMI-1',
          applicationId: 'game.exe',
        },
        targetDisplayId: 'DP-1',
      });
      expect(visible).toBe(false);
    });

    it('hide-on-exclusive-fullscreen hides when fullscreen is on the SAME monitor', () => {
      const visible = evaluateFullscreenVisibility({
        intentVisible: true,
        behavior: 'hide-on-exclusive-fullscreen',
        fullscreenState: {
          state: 'fullscreen',
          displayId: 'DP-1',
          applicationId: 'game.exe',
        },
        targetDisplayId: 'DP-1',
      });
      expect(visible).toBe(false);
    });

    it('hide-on-exclusive-fullscreen KEEPS overlay visible when fullscreen is on a DIFFERENT monitor', () => {
      const visible = evaluateFullscreenVisibility({
        intentVisible: true,
        behavior: 'hide-on-exclusive-fullscreen',
        fullscreenState: {
          state: 'fullscreen',
          displayId: 'HDMI-A-1', // Fullscreen game is on HDMI-A-1
          applicationId: 'game.exe',
        },
        targetDisplayId: 'DP-1', // Overlay is on DP-1
      });
      expect(visible).toBe(true);
    });
  });
});

describe('Interaction Policy Resolution', () => {
  it('correctly maps passthrough mode without keyboard', () => {
    const result = resolveInteraction({
      pointer: 'passthrough',
      keyboard: 'none',
    });
    expect(result).toEqual({
      pointer: 'passthrough',
      keyboard: 'none',
    });
  });

  it('correctly maps interactive mode with interactive keyboard', () => {
    const result = resolveInteraction({
      pointer: 'interactive',
      keyboard: 'interactive',
    });
    expect(result).toEqual({
      pointer: 'interactive',
      keyboard: 'interactive',
    });
  });
});
