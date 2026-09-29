import { describe, expect, it } from 'vitest';
import { PlaybackClock } from '../../src/data/mpris/playback-clock.js';

describe('High-Precision Monotonic Playback Clock', () => {
  it('returns static position when paused', () => {
    const clock = new PlaybackClock();
    clock.sync(15000, false, 200000);

    expect(clock.getCurrentPositionMs()).toBe(15000);
  });

  it('interpolates elapsed time forward when playing', async () => {
    const clock = new PlaybackClock();
    clock.sync(10000, true, 200000);

    // Wait 50ms
    await new Promise((r) => setTimeout(r, 50));

    const pos = clock.getCurrentPositionMs();
    expect(pos).toBeGreaterThanOrEqual(10045);
    expect(pos).toBeLessThan(10150);
  });

  it('clamps to duration when reaching end of track', () => {
    const clock = new PlaybackClock();
    clock.sync(199900, true, 200000); // 100ms from end

    // Simulate elapsed time far past duration
    clock.sync(205000, true, 200000);
    expect(clock.getCurrentPositionMs()).toBe(200000);
  });

  it('updates position cleanly on seek', () => {
    const clock = new PlaybackClock();
    clock.sync(5000, true, 200000);
    clock.seek(30000);

    expect(clock.getCurrentPositionMs()).toBeGreaterThanOrEqual(30000);
  });

  it('freezes position when paused with setPlaying(false)', async () => {
    const clock = new PlaybackClock();
    clock.sync(5000, true, 200000);

    await new Promise((r) => setTimeout(r, 20));
    clock.setPlaying(false);

    const pausedPos = clock.getCurrentPositionMs();
    await new Promise((r) => setTimeout(r, 30));

    expect(clock.getCurrentPositionMs()).toBe(pausedPos);
  });
});
