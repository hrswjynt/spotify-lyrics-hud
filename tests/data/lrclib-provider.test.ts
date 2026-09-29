import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LrclibProvider } from '../../src/data/lyrics/lrclib-provider.js';
import { SpotifyTrack } from '../../src/data/types.js';

describe('LRCLIB Lyrics Provider', () => {
  const sampleTrack: SpotifyTrack = {
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    durationMs: 230000,
  };

  const mockSyncedLyrics = `
[00:01.50]I'm tryna put you in the worst mood, ah
[00:04.80]P1 cleaner than your church shoes, ah
[00:08.20]Milli point two just to hurt you, ah
`;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully fetches and parses synchronized lyrics from LRCLIB', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 12345,
        trackName: 'Starboy',
        artistName: 'The Weeknd',
        syncedLyrics: mockSyncedLyrics,
        plainLyrics: "I'm tryna put you in the worst mood, ah\n...",
      }),
    });

    const provider = new LrclibProvider();
    const result = await provider.fetchLyrics(sampleTrack);

    expect(result).not.toBeNull();
    expect(result?.synced).toBe(true);
    expect(result?.source).toBe('lrclib');
    expect(result?.lines).toHaveLength(3);
    expect(result?.lines[0].text).toBe("I'm tryna put you in the worst mood, ah");
    expect(result?.lines[0].timeMs).toBe(1500);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://lrclib.net/api/get?track_name=Starboy'),
      expect.any(Object)
    );
  });

  it('handles 404 track not found gracefully without throwing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ statusCode: 404, error: 'Not Found' }),
    });

    const provider = new LrclibProvider();
    const result = await provider.fetchLyrics(sampleTrack);

    expect(result).toBeNull();
  });

  it('handles network / fetch failure safely', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const provider = new LrclibProvider();
    const result = await provider.fetchLyrics(sampleTrack);

    expect(result).toBeNull();
  });
});
