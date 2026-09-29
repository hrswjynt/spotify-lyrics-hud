import { LyricsProvider, LyricsResult, SpotifyTrack } from '../types.js';
import { parseLrc } from './lrc-parser.js';

export interface LrclibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string;
  syncedLyrics?: string;
}

export class LrclibProvider implements LyricsProvider {
  public readonly name = 'lrclib';
  private baseUrl = 'https://lrclib.net/api';

  public async fetchLyrics(track: SpotifyTrack): Promise<LyricsResult | null> {
    if (!track.title || !track.artist) {
      return null;
    }

    try {
      const url = new URL(`${this.baseUrl}/get`);
      url.searchParams.set('track_name', track.title);
      url.searchParams.set('artist_name', track.artist);

      if (track.album) {
        url.searchParams.set('album_name', track.album);
      }

      if (track.durationMs > 0) {
        url.searchParams.set('duration', Math.round(track.durationMs / 1000).toString());
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SpotifyDesktopOverlay/1.0 (https://github.com/desktop-overlay)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as LrclibResponse;

      if (data.syncedLyrics) {
        const lines = parseLrc(data.syncedLyrics);
        return {
          trackTitle: data.trackName || track.title,
          artistName: data.artistName || track.artist,
          synced: true,
          lines,
          plainText: data.plainLyrics,
          source: this.name,
        };
      }

      if (data.plainLyrics) {
        return {
          trackTitle: data.trackName || track.title,
          artistName: data.artistName || track.artist,
          synced: false,
          lines: [],
          plainText: data.plainLyrics,
          source: this.name,
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}
