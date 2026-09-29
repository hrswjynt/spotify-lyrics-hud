import { describe, expect, it, vi } from 'vitest';
import { SpotifyService } from '../../src/data/spotify-service.js';
import { LyricsProvider, LyricsResult, SpotifyTrack } from '../../src/data/types.js';
import { DbusMprisClient, MprisCommandRunner } from '../../src/data/mpris/dbus-mpris.js';

describe('SpotifyService Orchestrator', () => {
  const sampleTrack: SpotifyTrack = {
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    durationMs: 230000,
  };

  const sampleLyricsResult: LyricsResult = {
    trackTitle: 'Starboy',
    artistName: 'The Weeknd',
    synced: true,
    lines: [
      { timeMs: 1500, text: "I'm tryna put you in the worst mood, ah" },
      { timeMs: 4800, text: 'P1 cleaner than your church shoes, ah' },
    ],
    source: 'lrclib',
  };

  it('coordinates playback updates and fetches lyrics automatically', async () => {
    const mockRunner: MprisCommandRunner = {
      getStatus: vi.fn(async () => 'Playing'),
      getMetadata: vi.fn(async () => sampleTrack),
      getPositionMs: vi.fn(async () => 5000),
      playPause: vi.fn(async () => {}),
      next: vi.fn(async () => {}),
      previous: vi.fn(async () => {}),
    };

    const mockLyricsProvider: LyricsProvider = {
      name: 'mock',
      fetchLyrics: vi.fn(async () => sampleLyricsResult),
    };

    const mprisClient = new DbusMprisClient(mockRunner);
    const service = new SpotifyService({
      mprisClient,
      lyricsProvider: mockLyricsProvider,
      autoStartPolling: false,
    });

    const trackListener = vi.fn();
    service.onTrack(trackListener);

    // Trigger poll
    await service.pollOnce();

    expect(mockLyricsProvider.fetchLyrics).toHaveBeenCalledWith(sampleTrack);
    expect(trackListener).toHaveBeenCalledWith(sampleTrack, sampleLyricsResult.lines);
    expect(service.getCurrentPositionMs()).toBeGreaterThanOrEqual(5000);
    expect(service.getIsPlaying()).toBe(true);

    service.dispose();
  });

  it('delegates playback controls to underlying MPRIS client', async () => {
    const mockRunner: MprisCommandRunner = {
      getStatus: vi.fn(async () => 'Playing'),
      getMetadata: vi.fn(async () => sampleTrack),
      getPositionMs: vi.fn(async () => 0),
      playPause: vi.fn(async () => {}),
      next: vi.fn(async () => {}),
      previous: vi.fn(async () => {}),
    };

    const mprisClient = new DbusMprisClient(mockRunner);
    const service = new SpotifyService({
      mprisClient,
      autoStartPolling: false,
    });

    await service.playPause();
    expect(mockRunner.playPause).toHaveBeenCalled();

    await service.next();
    expect(mockRunner.next).toHaveBeenCalled();

    await service.previous();
    expect(mockRunner.previous).toHaveBeenCalled();

    service.dispose();
  });
});
