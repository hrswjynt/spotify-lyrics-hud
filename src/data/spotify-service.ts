import { LyricLine } from '../ui/src/sync/lyrics-sync.js';
import { LrclibProvider } from './lyrics/lrclib-provider.js';
import { DbusMprisClient } from './mpris/dbus-mpris.js';
import { PlaybackClock } from './mpris/playback-clock.js';
import { LyricsProvider, PlaybackStatus, SpotifyTrack } from './types.js';

export interface SpotifyServiceOptions {
  mprisClient?: DbusMprisClient;
  lyricsProvider?: LyricsProvider;
  autoStartPolling?: boolean;
  pollIntervalMs?: number;
}

export type TrackCallback = (track: SpotifyTrack, lyrics: LyricLine[]) => void;
export type ProgressCallback = (currentTimeMs: number, isPlaying: boolean) => void;
export type StatusCallback = (status: PlaybackStatus) => void;

/**
 * Central orchestrator connecting native Spotify playback detection,
 * synchronized lyrics fetching, and high-frequency UI clock updates.
 */
export class SpotifyService {
  private mprisClient: DbusMprisClient;
  private lyricsProvider: LyricsProvider;
  private clock: PlaybackClock;

  private currentTrack: SpotifyTrack | null = null;
  private currentLyrics: LyricLine[] = [];
  private currentStatus: PlaybackStatus = 'Stopped';

  private trackListeners: TrackCallback[] = [];
  private progressListeners: ProgressCallback[] = [];
  private statusListeners: StatusCallback[] = [];
  private unsubs: Array<() => void> = [];

  constructor(options?: SpotifyServiceOptions) {
    this.mprisClient = options?.mprisClient || new DbusMprisClient();
    this.lyricsProvider = options?.lyricsProvider || new LrclibProvider();
    this.clock = new PlaybackClock();

    this.setupListeners();

    if (options?.autoStartPolling !== false) {
      this.start(options?.pollIntervalMs || 1000);
    }
  }

  private setupListeners(): void {
    // 1. Handle track change
    const unsubTrack = this.mprisClient.onTrackChanged(async (track) => {
      this.currentTrack = track;
      this.currentLyrics = [];
      this.clock.sync(0, this.currentStatus === 'Playing', track.durationMs);

      // Immediately notify listeners of the new track (even before lyrics are fetched)
      for (const l of this.trackListeners) {
        l(track, []);
      }

      // Fetch synchronized lyrics
      const lyricsResult = await this.lyricsProvider.fetchLyrics(track);
      
      // Ensure user hasn't skipped to another track while waiting for lyrics
      const isSameTrack =
        this.currentTrack &&
        (this.currentTrack.id === track.id ||
          (this.currentTrack.artist === track.artist && this.currentTrack.title === track.title));

      if (isSameTrack) {
        this.currentLyrics = lyricsResult ? lyricsResult.lines : [];
        for (const l of this.trackListeners) {
          l(track, this.currentLyrics);
        }
      }
    });
    this.unsubs.push(unsubTrack);

    // 2. Handle position sync
    const unsubPos = this.mprisClient.onPositionSync((posMs, status) => {
      this.currentStatus = status;
      this.clock.sync(posMs, status === 'Playing', this.currentTrack?.durationMs);

      for (const l of this.progressListeners) {
        l(this.clock.getCurrentPositionMs(), status === 'Playing');
      }
    });
    this.unsubs.push(unsubPos);

    // 3. Handle status change
    const unsubStatus = this.mprisClient.onStatusChanged((status) => {
      this.currentStatus = status;
      this.clock.setPlaying(status === 'Playing');

      for (const l of this.statusListeners) {
        l(status);
      }
    });
    this.unsubs.push(unsubStatus);
  }

  public async pollOnce(): Promise<void> {
    await this.mprisClient.pollCurrentState();
  }

  public start(intervalMs: number = 1000): void {
    this.mprisClient.start(intervalMs);
  }

  public stop(): void {
    this.mprisClient.stop();
  }

  public onTrack(callback: TrackCallback): () => void {
    this.trackListeners.push(callback);
    if (this.currentTrack) {
      callback(this.currentTrack, this.currentLyrics);
    }
    return () => {
      this.trackListeners = this.trackListeners.filter((l) => l !== callback);
    };
  }

  public onProgress(callback: ProgressCallback): () => void {
    this.progressListeners.push(callback);
    callback(this.clock.getCurrentPositionMs(), this.clock.getIsPlaying());
    return () => {
      this.progressListeners = this.progressListeners.filter((l) => l !== callback);
    };
  }

  public onStatus(callback: StatusCallback): () => void {
    this.statusListeners.push(callback);
    if (this.currentStatus) {
      callback(this.currentStatus);
    }
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== callback);
    };
  }

  public getCurrentPositionMs(): number {
    return this.clock.getCurrentPositionMs();
  }

  public getIsPlaying(): boolean {
    return this.clock.getIsPlaying();
  }

  public getCurrentTrack(): SpotifyTrack | null {
    return this.currentTrack ? { ...this.currentTrack } : null;
  }

  public getCurrentLyrics(): LyricLine[] {
    return [...this.currentLyrics];
  }

  public async playPause(): Promise<void> {
    await this.mprisClient.playPause();
  }

  public async next(): Promise<void> {
    await this.mprisClient.next();
  }

  public async previous(): Promise<void> {
    await this.mprisClient.previous();
  }

  public dispose(): void {
    this.stop();
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.mprisClient.dispose();
    this.trackListeners = [];
    this.progressListeners = [];
    this.statusListeners = [];
  }
}
