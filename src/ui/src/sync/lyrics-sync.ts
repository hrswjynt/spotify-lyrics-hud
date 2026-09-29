export interface LyricLine {
  timeMs: number;
  text: string;
}

/**
 * Finds the index of the currently active lyric line using binary search.
 * O(log N) runtime efficiency.
 *
 * Returns -1 if playback is before the first timestamp.
 */
export function findActiveLineIndex(lyrics: LyricLine[], currentTimeMs: number): number {
  if (lyrics.length === 0 || currentTimeMs < lyrics[0].timeMs) {
    return -1;
  }

  let low = 0;
  let high = lyrics.length - 1;
  let activeIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (lyrics[mid].timeMs <= currentTimeMs) {
      activeIndex = mid;
      low = mid + 1; // Look further right to see if a later line has also started
    } else {
      high = mid - 1;
    }
  }

  return activeIndex;
}

/**
 * Calculates the completion percentage (0.0 to 1.0) of the current active line.
 * Used for karaoke character/word fill sweep animation.
 */
export function calculateLineProgress(
  currentLine: LyricLine,
  nextLine: LyricLine | undefined,
  currentTimeMs: number,
  defaultDurationMs: number = 3000
): number {
  const start = currentLine.timeMs;
  const end = nextLine ? nextLine.timeMs : start + defaultDurationMs;

  if (currentTimeMs <= start) return 0.0;
  if (currentTimeMs >= end) return 1.0;

  const duration = Math.max(1, end - start);
  return Math.min(1.0, Math.max(0.0, (currentTimeMs - start) / duration));
}

/**
 * Formats a duration in milliseconds to human-readable MM:SS format.
 */
export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
