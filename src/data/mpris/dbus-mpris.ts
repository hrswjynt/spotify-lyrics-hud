import * as childProcess from 'child_process';
import * as util from 'util';
import { PlaybackStatus, PlaybackUpdate, SpotifyTrack } from '../types.js';

let execFileAsync: ((cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string }>) | null = null;
try {
  if (
    typeof window === 'undefined' &&
    util &&
    typeof util.promisify === 'function' &&
    childProcess &&
    typeof childProcess.execFile === 'function'
  ) {
    execFileAsync = util.promisify(childProcess.execFile);
  }
} catch {
  execFileAsync = null;
}

export interface MprisCommandRunner {
  isAvailable?(): Promise<boolean>;
  getStatus(): Promise<PlaybackStatus>;
  getMetadata(): Promise<SpotifyTrack | null>;
  getPositionMs(): Promise<number>;
  playPause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
}

export function sanitizeTrackId(rawId?: string): string | undefined {
  if (!rawId) return undefined;
  let id = rawId.trim();
  const trackIdx = id.lastIndexOf('/track/');
  if (trackIdx !== -1) {
    id = id.substring(trackIdx + 7);
  } else {
    const colonIdx = id.lastIndexOf('track:');
    if (colonIdx !== -1) {
      id = id.substring(colonIdx + 6);
    }
  }
  const qIdx = id.indexOf('?');
  if (qIdx !== -1) id = id.substring(0, qIdx);
  const hIdx = id.indexOf('#');
  if (hIdx !== -1) id = id.substring(0, hIdx);
  return id || undefined;
}

/**
 * Standard implementation using Linux playerctl CLI tool to interact with DBus MPRIS.
 */
export class PlayerctlRunner implements MprisCommandRunner {
  private playerName: string;

  constructor(playerName: string = 'spotify') {
    this.playerName = playerName;
  }

  public async isAvailable(): Promise<boolean> {
    if (!execFileAsync) return false;
    try {
      const { stdout } = await execFileAsync('playerctl', ['-l']);
      return stdout.toLowerCase().includes(this.playerName.toLowerCase());
    } catch {
      return false;
    }
  }

  public async getStatus(): Promise<PlaybackStatus> {
    if (!execFileAsync) return 'Stopped';
    try {
      const { stdout } = await execFileAsync('playerctl', ['-p', this.playerName, 'status']);
      const trimmed = stdout.trim();
      if (trimmed === 'Playing' || trimmed === 'Paused' || trimmed === 'Stopped') {
        return trimmed;
      }
      return 'Stopped';
    } catch {
      return 'Stopped';
    }
  }

  public async getMetadata(): Promise<SpotifyTrack | null> {
    if (!execFileAsync) return null;
    try {
      // Format: title:::artist:::album:::length:::artUrl:::trackid
      const format = '{{title}}:::{{artist}}:::{{album}}:::{{mpris:length}}:::{{mpris:artUrl}}:::{{mpris:trackid}}';
      const { stdout } = await execFileAsync('playerctl', ['-p', this.playerName, 'metadata', '--format', format]);
      const line = stdout.trim();
      if (!line) return null;

      const [title, artist, album, lengthStr, artUrl, rawTrackId] = line.split(':::');
      if (!title || !artist) return null;

      // length in microseconds from mpris:length -> convert to ms
      const lengthMicros = parseInt(lengthStr, 10) || 0;
      const durationMs = Math.round(lengthMicros / 1000);

      const trackId = sanitizeTrackId(rawTrackId);

      return {
        id: trackId,
        title,
        artist,
        album: album || '',
        albumArtUrl: artUrl || undefined,
        durationMs,
      };
    } catch {
      return null;
    }
  }

  public async getPositionMs(): Promise<number> {
    if (!execFileAsync) return 0;
    try {
      const { stdout } = await execFileAsync('playerctl', ['-p', this.playerName, 'position']);
      const seconds = parseFloat(stdout.trim());
      if (isNaN(seconds)) return 0;
      return Math.round(seconds * 1000);
    } catch {
      return 0;
    }
  }

  public async playPause(): Promise<void> {
    if (!execFileAsync) return;
    try {
      await execFileAsync('playerctl', ['-p', this.playerName, 'play-pause']);
    } catch {}
  }

  public async next(): Promise<void> {
    if (!execFileAsync) return;
    try {
      await execFileAsync('playerctl', ['-p', this.playerName, 'next']);
    } catch {}
  }

  public async previous(): Promise<void> {
    if (!execFileAsync) return;
    try {
      await execFileAsync('playerctl', ['-p', this.playerName, 'previous']);
    } catch {}
  }
}


/**
 * High-level Linux DBus MPRIS Client managing state polling, change detection, and events.
 */
export class DbusMprisClient {
  private runner: MprisCommandRunner;
  private timer?: NodeJS.Timeout;
  private lastTrackId: string | null = null;
  private lastStatus: PlaybackStatus = 'Stopped';

  private trackListeners: Array<(track: SpotifyTrack) => void> = [];
  private statusListeners: Array<(status: PlaybackStatus) => void> = [];
  private positionSyncListeners: Array<(posMs: number, status: PlaybackStatus) => void> = [];

  constructor(runner?: MprisCommandRunner) {
    this.runner = runner || new PlayerctlRunner('spotify');
  }

  public async pollCurrentState(): Promise<PlaybackUpdate | null> {
    try {
      const status = await this.runner.getStatus();
      const track = await this.runner.getMetadata();
      const positionMs = await this.runner.getPositionMs();

      if (!track) {
        if (this.lastStatus !== 'Stopped') {
          this.lastStatus = 'Stopped';
          for (const l of this.statusListeners) l('Stopped');
        }
        return null;
      }

      // Check status change
      if (status !== this.lastStatus) {
        this.lastStatus = status;
        for (const l of this.statusListeners) l(status);
      }

      // Check track change
      const currentTrackIdentifier = track.id || `${track.artist} - ${track.title}`;
      if (currentTrackIdentifier !== this.lastTrackId) {
        this.lastTrackId = currentTrackIdentifier;
        for (const l of this.trackListeners) l(track);
      }

      // Position sync event
      for (const l of this.positionSyncListeners) l(positionMs, status);

      return {
        status,
        track,
        positionMs,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }

  public start(intervalMs: number = 1000): void {
    if (this.timer) return;

    // Initial poll
    void this.pollCurrentState();

    this.timer = setInterval(() => {
      void this.pollCurrentState();
    }, intervalMs);
    this.timer.unref?.();
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  public onTrackChanged(callback: (track: SpotifyTrack) => void): () => void {
    this.trackListeners.push(callback);
    return () => {
      this.trackListeners = this.trackListeners.filter((l) => l !== callback);
    };
  }

  public onStatusChanged(callback: (status: PlaybackStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== callback);
    };
  }

  public onPositionSync(callback: (posMs: number, status: PlaybackStatus) => void): () => void {
    this.positionSyncListeners.push(callback);
    return () => {
      this.positionSyncListeners = this.positionSyncListeners.filter((l) => l !== callback);
    };
  }

  public async playPause(): Promise<void> {
    await this.runner.playPause();
  }

  public async next(): Promise<void> {
    await this.runner.next();
  }

  public async previous(): Promise<void> {
    await this.runner.previous();
  }

  public dispose(): void {
    this.stop();
    this.trackListeners = [];
    this.statusListeners = [];
    this.positionSyncListeners = [];
  }
}
