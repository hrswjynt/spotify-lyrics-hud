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
  normalizeLyrics,
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

  it('updates currentTrack and lyrics stores via setTrack, adding intro empty line', () => {
    expect(get(currentTrack)?.title).toBe('Starboy');
    // Original 3 lines + 1 prepended intro empty line = 4 lines
    const parsedLyrics = get(lyrics);
    expect(parsedLyrics).toHaveLength(4);
    expect(parsedLyrics[0]).toEqual({ timeMs: 0, text: '' });
    expect(parsedLyrics[1].text).toBe("I'm tryna put you in the worst mood, ah");
  });

  it('calculates active line reactively when progress updates', () => {
    updateProgress(500); // During intro empty line (0ms to 1000ms)
    expect(get(activeLineIndex)).toBe(0);

    updateProgress(2500); // First lyric line (1000ms to 4000ms) -> line 1
    expect(get(activeLineIndex)).toBe(1);

    updateProgress(5000); // Second lyric line (4000ms to 8000ms) -> line 2
    expect(get(activeLineIndex)).toBe(2);

    updateProgress(10000); // Past 8000ms -> line 3
    expect(get(activeLineIndex)).toBe(3);
  });

  it('calculates active line progress percentage reactively', () => {
    // Line 1 is 1000ms to 4000ms. At 2500ms, progress should be 50%
    updateProgress(2500);
    expect(get(lineProgress)).toBeCloseTo(0.5);
  });

  it('normalizes lyrics by prepending empty line only if not present', () => {
    // Case 1: First line is non-empty -> prepends { timeMs: 0, text: '' }
    const res1 = normalizeLyrics([
      { timeMs: 3000, text: 'First sung lyric' }
    ]);
    expect(res1).toHaveLength(2);
    expect(res1[0]).toEqual({ timeMs: 0, text: '' });
    expect(res1[1].text).toBe('First sung lyric');

    // Case 2: First line is already empty -> keeps as-is without duplicating
    const res2 = normalizeLyrics([
      { timeMs: 0, text: '' },
      { timeMs: 3000, text: 'First sung lyric' }
    ]);
    expect(res2).toHaveLength(2);
    expect(res2[0]).toEqual({ timeMs: 0, text: '' });

    // Case 3: Empty array -> returns empty array
    expect(normalizeLyrics([])).toEqual([]);
  });

  it('toggles click-through mode between passthrough and interactive', () => {
    expect(get(overlayBridge).inputMode).toBe('passthrough');

    toggleClickThrough();
    expect(get(overlayBridge).inputMode).toBe('interactive');

    toggleClickThrough();
    expect(get(overlayBridge).inputMode).toBe('passthrough');
  });

  it('manages karaokeMode store and toggles state', async () => {
    const { karaokeMode, toggleKaraokeMode, setKaraokeMode } = await import(
      '../../src/ui/src/stores/playback.js'
    );

    setKaraokeMode(true);
    expect(get(karaokeMode)).toBe(true);

    const next1 = toggleKaraokeMode();
    expect(next1).toBe(false);
    expect(get(karaokeMode)).toBe(false);

    const next2 = toggleKaraokeMode();
    expect(next2).toBe(true);
    expect(get(karaokeMode)).toBe(true);
  });
});

