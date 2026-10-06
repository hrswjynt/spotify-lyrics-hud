import { describe, expect, it, vi } from 'vitest';
import {
  DbusMprisClient,
  MprisCommandRunner,
  sanitizeTrackId,
} from '../../src/data/mpris/dbus-mpris.js';
import { SpotifyTrack } from '../../src/data/types.js';

describe('Linux DBus MPRIS Client', () => {
  const mockTrack: SpotifyTrack = {
    id: '/com/spotify/track/12345',
    title: 'All Girls Are The Same',
    artist: 'Juice WRLD',
    album: 'Goodbye & Good Riddance',
    albumArtUrl: 'https://i.scdn.co/image/xyz',
    durationMs: 165819,
  };

  it('queries metadata and position from MPRIS runner', async () => {
    const mockRunner: MprisCommandRunner = {
      getStatus: vi.fn(async () => 'Playing'),
      getMetadata: vi.fn(async () => mockTrack),
      getPositionMs: vi.fn(async () => 45000),
      playPause: vi.fn(async () => {}),
      next: vi.fn(async () => {}),
      previous: vi.fn(async () => {}),
    };

    const client = new DbusMprisClient(mockRunner);
    const update = await client.pollCurrentState();

    expect(update).not.toBeNull();
    expect(update?.status).toBe('Playing');
    expect(update?.track.title).toBe('All Girls Are The Same');
    expect(update?.track.artist).toBe('Juice WRLD');
    expect(update?.positionMs).toBe(45000);
  });

  it('triggers onTrackChanged when track title or ID changes', async () => {
    let currentTrackInMock = mockTrack;
    const mockRunner: MprisCommandRunner = {
      getStatus: vi.fn(async () => 'Playing'),
      getMetadata: vi.fn(async () => currentTrackInMock),
      getPositionMs: vi.fn(async () => 10000),
      playPause: vi.fn(async () => {}),
      next: vi.fn(async () => {}),
      previous: vi.fn(async () => {}),
    };

    const client = new DbusMprisClient(mockRunner);
    const trackListener = vi.fn();
    client.onTrackChanged(trackListener);

    // First poll: detects initial track
    await client.pollCurrentState();
    expect(trackListener).toHaveBeenCalledTimes(1);
    expect(trackListener).toHaveBeenCalledWith(mockTrack);

    // Second poll with same track: listener should NOT be called again
    await client.pollCurrentState();
    expect(trackListener).toHaveBeenCalledTimes(1);

    // Third poll with new track
    currentTrackInMock = {
      ...mockTrack,
      id: '/com/spotify/track/99999',
      title: 'Lucid Dreams',
    };
    await client.pollCurrentState();
    expect(trackListener).toHaveBeenCalledTimes(2);
    expect(trackListener).toHaveBeenLastCalledWith(currentTrackInMock);
  });

  it('delegates playback controls to the runner', async () => {
    const mockRunner: MprisCommandRunner = {
      getStatus: vi.fn(async () => 'Playing'),
      getMetadata: vi.fn(async () => mockTrack),
      getPositionMs: vi.fn(async () => 0),
      playPause: vi.fn(async () => {}),
      next: vi.fn(async () => {}),
      previous: vi.fn(async () => {}),
    };

    const client = new DbusMprisClient(mockRunner);

    await client.playPause();
    expect(mockRunner.playPause).toHaveBeenCalled();

    await client.next();
    expect(mockRunner.next).toHaveBeenCalled();

    await client.previous();
    expect(mockRunner.previous).toHaveBeenCalled();
  });

  it('sanitizes track id from various MPRIS and URL formats', () => {
    expect(sanitizeTrackId('/com/spotify/track/3f1ChZHm6v4KdUaEW5y5qd')).toBe('3f1ChZHm6v4KdUaEW5y5qd');
    expect(sanitizeTrackId('spotify:track:3f1ChZHm6v4KdUaEW5y5qd')).toBe('3f1ChZHm6v4KdUaEW5y5qd');
    expect(sanitizeTrackId('https://open.spotify.com/track/3f1ChZHm6v4KdUaEW5y5qd?si=xyz')).toBe('3f1ChZHm6v4KdUaEW5y5qd');
    expect(sanitizeTrackId('3f1ChZHm6v4KdUaEW5y5qd')).toBe('3f1ChZHm6v4KdUaEW5y5qd');
    expect(sanitizeTrackId(undefined)).toBeUndefined();
    expect(sanitizeTrackId('')).toBeUndefined();
  });
});
