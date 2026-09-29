import { LyricLine } from '../ui/src/sync/lyrics-sync.js';

export interface SpotifyTrack {
  id?: string;
  title: string;
  artist: string;
  album: string;
  albumArtUrl?: string;
  durationMs: number;
  url?: string;
}

export type PlaybackStatus = 'Playing' | 'Paused' | 'Stopped';

export interface PlaybackUpdate {
  status: PlaybackStatus;
  track: SpotifyTrack;
  positionMs: number;
  timestamp: number; // Date.now() when sample was taken
}

export interface LyricsResult {
  trackTitle: string;
  artistName: string;
  synced: boolean;
  lines: LyricLine[];
  plainText?: string;
  source: string;
}

export interface LyricsProvider {
  name: string;
  fetchLyrics(track: SpotifyTrack): Promise<LyricsResult | null>;
}
