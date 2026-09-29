import { describe, expect, it } from 'vitest';
import { PlayerctlRunner } from '../../src/data/mpris/dbus-mpris.js';

describe('Live Spotify MPRIS Integration (Real System)', () => {
  it('connects to active Spotify session and retrieves live track metadata', async () => {
    const runner = new PlayerctlRunner('spotify');
    const isAvailable = await runner.isAvailable();

    if (!isAvailable) {
      console.log('Skipping live Spotify test: Spotify player is not running.');
      return;
    }

    const status = await runner.getStatus();
    expect(['Playing', 'Paused', 'Stopped']).toContain(status);

    const track = await runner.getMetadata();
    expect(track).not.toBeNull();
    expect(track?.title).toBeDefined();
    expect(track?.artist).toBeDefined();
    expect(track?.durationMs).toBeGreaterThan(0);

    const positionMs = await runner.getPositionMs();
    expect(positionMs).toBeGreaterThanOrEqual(0);

    console.log(`Live Spotify Verified: Status=${status}, Title="${track?.title}" by "${track?.artist}", Position=${Math.round(positionMs / 1000)}s / ${Math.round((track?.durationMs ?? 0) / 1000)}s`);
  });
});
