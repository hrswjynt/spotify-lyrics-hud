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
      let data: LrclibResponse | null = null;

      // In Tauri runtime, delegate to native Rust command (bypasses browser CORS & sandbox)
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const raw = await invoke<string | null>('fetch_lyrics_lrclib', {
            trackName: track.title,
            artistName: track.artist,
            albumName: track.album || undefined,
            durationSecs: track.durationMs > 0 ? Math.round(track.durationMs / 1000) : undefined,
          });
          if (raw) {
            data = JSON.parse(raw) as LrclibResponse;
          }
        } catch (e) {
          console.warn('[LrclibProvider] Tauri fetch_lyrics_lrclib error:', e);
        }
      }

      // Fallback to standard fetch
      if (!data) {
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

        const headers: Record<string, string> = {
          'X-User-Agent': 'SpotifyDesktopOverlay/1.0',
        };
        if (typeof window === 'undefined') {
          headers['User-Agent'] = 'SpotifyDesktopOverlay/1.0 (https://github.com/desktop-overlay)';
        }

        const response = await fetch(url.toString(), {
          signal: controller.signal,
          headers,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          data = (await response.json()) as LrclibResponse;
        }
      }

      if (!data) {
        return null;
      }

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
    } catch (err) {
      console.warn('[LrclibProvider] Exception in fetchLyrics:', err);
      return null;
    }
  }

}
