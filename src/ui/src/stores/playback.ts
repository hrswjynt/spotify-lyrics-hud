import { derived, writable } from 'svelte/store';
import {
  calculateLineProgress,
  findActiveLineIndex,
  LyricLine,
} from '../sync/lyrics-sync.js';

export interface TrackInfo {
  title: string;
  artist: string;
  album: string;
  albumArtUrl?: string;
  durationMs: number;
}

export interface PlaybackState {
  currentTimeMs: number;
  isPlaying: boolean;
}

export const currentTrack = writable<TrackInfo | null>(null);

export const playbackState = writable<PlaybackState>({
  currentTimeMs: 0,
  isPlaying: false,
});

export const lyrics = writable<LyricLine[]>([]);

export const activeLineIndex = derived(
  [lyrics, playbackState],
  ([$lyrics, $playbackState]) =>
    findActiveLineIndex($lyrics, $playbackState.currentTimeMs)
);

export const lineProgress = derived(
  [lyrics, activeLineIndex, playbackState],
  ([$lyrics, $activeIdx, $playbackState]) => {
    if ($activeIdx < 0 || $activeIdx >= $lyrics.length) {
      return 0.0;
    }
    const current = $lyrics[$activeIdx];
    const next = $lyrics[$activeIdx + 1];
    return calculateLineProgress(current, next, $playbackState.currentTimeMs);
  }
);

export function setTrack(track: TrackInfo, trackLyrics: LyricLine[]): void {
  currentTrack.set(track);
  lyrics.set(trackLyrics);
  playbackState.set({
    currentTimeMs: 0,
    isPlaying: true,
  });
}

export function updateProgress(currentTimeMs: number): void {
  playbackState.update((s) => ({
    ...s,
    currentTimeMs,
  }));
}

export function togglePlayPause(): void {
  playbackState.update((s) => ({
    ...s,
    isPlaying: !s.isPlaying,
  }));
}
