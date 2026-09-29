import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  activeLineIndex,
  currentTrack,
  lineProgress,
  lyrics,
  playbackState,
  setTrack,
  updateProgress,
} from '../../src/ui/src/stores/playback.js';
import {
  overlayBridge,
  toggleClickThrough,
} from '../../src/ui/src/stores/overlay.js';

describe('Reactive Playback and Overlay Stores', () => {
  beforeEach(() => {
    setTrack(
      {
        title: 'Starboy',
        artist: 'The Weeknd',
        album: 'Starboy',
        durationMs: 230000,
      },
      [
        { timeMs: 1000, text: "I'm tryna put you in the worst mood, ah" },
        { timeMs: 4000, text: 'P1 cleaner than your church shoes, ah' },
        { timeMs: 8000, text: 'Milli point two just to hurt you, ah' },
      ]
    );
  });

  it('updates currentTrack and lyrics stores via setTrack', () => {
    expect(get(currentTrack)?.title).toBe('Starboy');
    expect(get(lyrics)).toHaveLength(3);
  });

  it('calculates active line reactively when progress updates', () => {
    updateProgress(500); // Before first line
    expect(get(activeLineIndex)).toBe(-1);

    updateProgress(2500); // Between 1000 and 4000 -> line 0
    expect(get(activeLineIndex)).toBe(0);

    updateProgress(5000); // Between 4000 and 8000 -> line 1
    expect(get(activeLineIndex)).toBe(1);

    updateProgress(10000); // Past 8000 -> line 2
    expect(get(activeLineIndex)).toBe(2);
  });

  it('calculates active line progress percentage reactively', () => {
    // Line 0 is 1000ms to 4000ms. At 2500ms, progress should be 50%
    updateProgress(2500);
    expect(get(lineProgress)).toBeCloseTo(0.5);
  });

  it('toggles click-through mode between passthrough and interactive', () => {
    expect(get(overlayBridge).inputMode).toBe('passthrough');

    toggleClickThrough();
    expect(get(overlayBridge).inputMode).toBe('interactive');

    toggleClickThrough();
    expect(get(overlayBridge).inputMode).toBe('passthrough');
  });
});
