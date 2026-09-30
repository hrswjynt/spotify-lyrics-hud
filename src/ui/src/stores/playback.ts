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

let lastTrackKey: string | null = null;

/**
 * Normalizes raw lyrics so that if the first line is not empty,
 * an empty intro line is prepended at timeMs = 0.
 * This guarantees that when the first lyric is highlighted,
 * it is displayed in the center of the 3-line HUD with an empty line above it.
 */
export function normalizeLyrics(rawLyrics: LyricLine[]): LyricLine[] {
  if (!rawLyrics || rawLyrics.length === 0) {
    return [];
  }

  // If the first line is already empty (whitespace only or empty), keep as-is
  if (rawLyrics[0].text.trim() === '') {
    return rawLyrics;
  }

  // Prepend an empty intro line at timeMs = 0
  return [{ timeMs: 0, text: '' }, ...rawLyrics];
}

export function setTrack(
  track: TrackInfo,
  trackLyrics: LyricLine[],
  currentTimeMs?: number,
  isPlaying?: boolean
): void {
  const currentKey = `${track.artist} - ${track.title}`;
  const isDifferentTrack = lastTrackKey !== currentKey;
  lastTrackKey = currentKey;

  currentTrack.set(track);
  lyrics.set(normalizeLyrics(trackLyrics));
  playbackState.update((s) => ({
    isPlaying: isPlaying !== undefined ? isPlaying : (isDifferentTrack ? true : s.isPlaying),
    currentTimeMs:
      currentTimeMs !== undefined
        ? currentTimeMs
        : (isDifferentTrack ? 0 : s.currentTimeMs),
  }));
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

export function setPlaying(isPlaying: boolean): void {
  playbackState.update((s) => ({
    ...s,
    isPlaying,
  }));
}

function getInitialKaraokeMode(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('overlay_karaoke_mode');
      if (saved !== null) return saved === 'true';
    } catch {}
  }
  return true;
}

export const karaokeMode = writable<boolean>(getInitialKaraokeMode());

export function setKaraokeMode(enabled: boolean): void {
  karaokeMode.set(enabled);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('overlay_karaoke_mode', String(enabled));
    } catch {}
  }
}

export function toggleKaraokeMode(): boolean {
  let next = true;
  karaokeMode.update((curr) => {
    next = !curr;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('overlay_karaoke_mode', String(next));
      } catch {}
    }
    return next;
  });
  return next;
}


