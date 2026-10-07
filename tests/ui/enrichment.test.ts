import { beforeEach, describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import {
  currentTrack,
  setTrack,
  updateTrackArtist,
} from '../../src/ui/src/stores/playback.js';

export function resolveEnrichedArtist(
  primaryArtist: string,
  scrapedArtist?: string | null,
  lrclibArtist?: string | null
): string {
  if (scrapedArtist && scrapedArtist.trim().length > 0) {
    return scrapedArtist.trim();
  }
  if (lrclibArtist) {
    const trimmed = lrclibArtist.trim();
    if (/[,/&]|feat\./i.test(trimmed)) {
      // Normalize slashes or ampersands if needed
      return trimmed.replace(/\s*\/\s*/g, ', ');
    }
  }
  return primaryArtist;
}

describe('Multi-Artist Enrichment Pipeline', () => {
  beforeEach(() => {
    currentTrack.set(null);
  });

  it('updates track artist when trackId matches active track', () => {
    setTrack(
      {
        id: '3f1ChZHm6v4KdUaEW5y5qd',
        title: 'Me and You',
        artist: 'Cold Hart',
        album: 'Me and You',
        durationMs: 224813,
      },
      []
    );

    expect(get(currentTrack)?.artist).toBe('Cold Hart');

    updateTrackArtist('Cold Hart, Lil Peep', '3f1ChZHm6v4KdUaEW5y5qd');

    expect(get(currentTrack)?.artist).toBe('Cold Hart, Lil Peep');
  });

  it('ignores enrichment update if active trackId has changed (race condition protection)', () => {
    setTrack(
      {
        id: 'newTrack123',
        title: 'New Song',
        artist: 'New Artist',
        album: 'New Album',
        durationMs: 180000,
      },
      []
    );

    // Stale enrichment arrives for the previous track
    updateTrackArtist('Old Artist, Featured Guest', 'oldTrack999');

    // Should NOT overwrite the current track
    expect(get(currentTrack)?.artist).toBe('New Artist');
  });

  it('resolves scraped artist with highest precedence', () => {
    const result = resolveEnrichedArtist(
      'Cold Hart',
      'Cold Hart, Lil Peep',
      'Cold Hart/Lil Peep'
    );
    expect(result).toBe('Cold Hart, Lil Peep');
  });

  it('falls back to LRCLIB artist if scraped artist is not available and LRCLIB has multi-artist', () => {
    const result = resolveEnrichedArtist(
      'Cold Hart',
      null,
      'Cold Hart/Lil Peep'
    );
    expect(result).toBe('Cold Hart, Lil Peep');
  });

  it('retains primary artist if neither source provides multi-artist info', () => {
    const result = resolveEnrichedArtist(
      'Cold Hart',
      null,
      'Cold Hart'
    );
    expect(result).toBe('Cold Hart');
  });
});
