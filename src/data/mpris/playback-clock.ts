/**
 * High-precision playback clock that interpolates audio playback position
 * between MPRIS or OS status updates using performance.now().
 *
 * Prevents UI jitter and provides 144Hz smooth karaoke line sweep animation.
 */
export class PlaybackClock {
  private basePositionMs: number = 0;
  private baseTimestamp: number = 0;
  private isPlaying: boolean = false;
  private durationMs: number = 0;

  constructor() {
    this.baseTimestamp = performance.now();
  }

  /**
   * Synchronizes the clock with authoritative position data from the player.
   */
  public sync(positionMs: number, isPlaying: boolean, durationMs?: number): void {
    if (typeof durationMs === 'number' && durationMs > 0) {
      this.durationMs = durationMs;
    }

    const clampedPosition =
      this.durationMs > 0 ? Math.min(this.durationMs, Math.max(0, positionMs)) : Math.max(0, positionMs);

    this.basePositionMs = clampedPosition;
    this.baseTimestamp = performance.now();
    this.isPlaying = isPlaying;
  }

  /**
   * Retrieves the current interpolated playback position in milliseconds.
   */
  public getCurrentPositionMs(): number {
    if (!this.isPlaying) {
      return this.basePositionMs;
    }

    const elapsed = performance.now() - this.baseTimestamp;
    const current = this.basePositionMs + elapsed;

    if (this.durationMs > 0 && current >= this.durationMs) {
      return this.durationMs;
    }

    return Math.max(0, current);
  }

  /**
   * Explicitly sets play/pause state while maintaining current interpolated position.
   */
  public setPlaying(isPlaying: boolean): void {
    if (this.isPlaying === isPlaying) {
      return;
    }

    // Capture current interpolated position as the new static base
    this.basePositionMs = this.getCurrentPositionMs();
    this.baseTimestamp = performance.now();
    this.isPlaying = isPlaying;
  }

  /**
   * Moves playback to a new position.
   */
  public seek(newPositionMs: number): void {
    const clamped =
      this.durationMs > 0 ? Math.min(this.durationMs, Math.max(0, newPositionMs)) : Math.max(0, newPositionMs);

    this.basePositionMs = clamped;
    this.baseTimestamp = performance.now();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getDurationMs(): number {
    return this.durationMs;
  }
}
