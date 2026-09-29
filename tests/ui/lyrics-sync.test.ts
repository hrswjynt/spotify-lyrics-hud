import { describe, expect, it } from 'vitest';
import {
  calculateLineProgress,
  findActiveLineIndex,
  formatTimestamp,
  LyricLine,
} from '../../src/ui/src/sync/lyrics-sync.js';

describe('Karaoke Synchronization & Timing Engine', () => {
  const sampleLyrics: LyricLine[] = [
    { timeMs: 5000, text: 'Is this the real life?' },
    { timeMs: 8000, text: 'Is this just fantasy?' },
    { timeMs: 12500, text: 'Caught in a landslide' },
    { timeMs: 16000, text: 'No escape from reality' },
  ];

  describe('findActiveLineIndex (Binary Search)', () => {
    it('returns -1 when current time is before the first line starts', () => {
      const index = findActiveLineIndex(sampleLyrics, 2000);
      expect(index).toBe(-1);
    });

    it('identifies the first line as active at exact start timestamp', () => {
      const index = findActiveLineIndex(sampleLyrics, 5000);
      expect(index).toBe(0);
    });

    it('identifies the active line midway between timestamps', () => {
      const index = findActiveLineIndex(sampleLyrics, 10000); // Between 8000 and 12500
      expect(index).toBe(1);
    });

    it('identifies the last line when time is past the final timestamp', () => {
      const index = findActiveLineIndex(sampleLyrics, 25000);
      expect(index).toBe(3);
    });

    it('handles empty lyrics array safely', () => {
      const index = findActiveLineIndex([], 5000);
      expect(index).toBe(-1);
    });
  });

  describe('calculateLineProgress', () => {
    it('calculates 0% at the exact beginning of a line', () => {
      const progress = calculateLineProgress(sampleLyrics[0], sampleLyrics[1], 5000);
      expect(progress).toBeCloseTo(0.0);
    });

    it('calculates 50% midway through a line', () => {
      // Line 0 is 5000ms to 8000ms (duration 3000ms). Midway is 6500ms.
      const progress = calculateLineProgress(sampleLyrics[0], sampleLyrics[1], 6500);
      expect(progress).toBeCloseTo(0.5);
    });

    it('clamps to 1.0 when time passes the next line', () => {
      const progress = calculateLineProgress(sampleLyrics[0], sampleLyrics[1], 9000);
      expect(progress).toBe(1.0);
    });

    it('uses fallback duration when there is no next line', () => {
      // Last line is at 16000ms. With 4000ms fallback duration, 18000ms should be 50%
      const progress = calculateLineProgress(sampleLyrics[3], undefined, 18000, 4000);
      expect(progress).toBeCloseTo(0.5);
    });
  });

  describe('formatTimestamp', () => {
    it('formats milliseconds to MM:SS', () => {
      expect(formatTimestamp(0)).toBe('0:00');
      expect(formatTimestamp(5000)).toBe('0:05');
      expect(formatTimestamp(65000)).toBe('1:05');
      expect(formatTimestamp(215000)).toBe('3:35');
    });
  });
});
