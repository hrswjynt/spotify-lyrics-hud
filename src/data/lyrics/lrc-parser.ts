import { LyricLine } from '../../ui/src/sync/lyrics-sync.js';

// Matches tags like [01:23.45] or [01:23.456]
const TIMESTAMP_REGEX = /\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

/**
 * Parses an LRC synchronized lyrics string into an array of LyricLine objects sorted by timeMs.
 */
export function parseLrc(lrcContent: string): LyricLine[] {
  if (!lrcContent || typeof lrcContent !== 'string') {
    return [];
  }

  const rawLines = lrcContent.split(/\r?\n/);
  const result: LyricLine[] = [];

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Skip metadata tags like [ti:...], [ar:...], [al:...], [by:...]
    if (/^\[[a-zA-Z]+:.*\]$/.test(line)) {
      continue;
    }

    const matches = Array.from(line.matchAll(TIMESTAMP_REGEX));
    if (matches.length === 0) {
      continue;
    }

    // Extract text after removing all timestamp tags
    const text = line.replace(TIMESTAMP_REGEX, '').trim();

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fracStr = match[3] || '0';

      // 2 digits = hundredths of a second (10ms each); 3 digits = milliseconds
      const millis =
        fracStr.length === 2
          ? parseInt(fracStr, 10) * 10
          : parseInt(fracStr.padEnd(3, '0').slice(0, 3), 10);

      const timeMs = minutes * 60000 + seconds * 1000 + millis;

      result.push({
        timeMs,
        text,
      });
    }
  }

  // Sort chronologically
  result.sort((a, b) => a.timeMs - b.timeMs);

  return result;
}
