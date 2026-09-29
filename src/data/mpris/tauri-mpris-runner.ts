import { PlaybackStatus, SpotifyTrack } from '../types.js';
import { MprisCommandRunner } from './dbus-mpris.js';

export class TauriMprisRunner implements MprisCommandRunner {
  private invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<any>;

  constructor(invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<any>) {
    this.invoke = invoke;
  }

  private async getInvoke() {
    if (this.invoke) return this.invoke;
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { invoke } = await import('@tauri-apps/api/core');
      return invoke;
    }
    return null;
  }

  public async isAvailable(): Promise<boolean> {
    const inv = await this.getInvoke();
    if (!inv) return false;
    const res = await inv('query_spotify_mpris');
    return res !== null;
  }

  public async getStatus(): Promise<PlaybackStatus> {
    const inv = await this.getInvoke();
    if (!inv) return 'Stopped';
    const res: any = await inv('query_spotify_mpris');
    if (res && (res.status === 'Playing' || res.status === 'Paused' || res.status === 'Stopped')) {
      return res.status as PlaybackStatus;
    }
    return 'Stopped';
  }

  public async getMetadata(): Promise<SpotifyTrack | null> {
    const inv = await this.getInvoke();
    if (!inv) return null;
    const res: any = await inv('query_spotify_mpris');
    if (!res) return null;
    return {
      title: res.title,
      artist: res.artist,
      album: res.album,
      durationMs: res.durationMs,
    };
  }

  public async getPositionMs(): Promise<number> {
    const inv = await this.getInvoke();
    if (!inv) return 0;
    const res: any = await inv('query_spotify_mpris');
    return res?.positionMs ?? 0;
  }

  public async playPause(): Promise<void> {
    const inv = await this.getInvoke();
    if (inv) await inv('control_spotify_mpris', { action: 'play-pause' });
  }

  public async next(): Promise<void> {
    const inv = await this.getInvoke();
    if (inv) await inv('control_spotify_mpris', { action: 'next' });
  }

  public async previous(): Promise<void> {
    const inv = await this.getInvoke();
    if (inv) await inv('control_spotify_mpris', { action: 'previous' });
  }
}
