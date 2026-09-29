import { SpotifyService } from '../data/spotify-service.js';
import { findActiveLineIndex, formatTimestamp } from '../ui/src/sync/lyrics-sync.js';
import { createOverlayApplication } from '../index.js';

export async function runLiveSpotifyHUD(): Promise<void> {
  console.log('=== Connecting to Live Spotify Desktop Playback ===\n');

  // Initialize native overlay engine
  const { engine, platform } = await createOverlayApplication({
    visible: true,
    placement: {
      anchor: 'bottom-center',
      offset: { x: 0, y: -40 },
      size: { width: 750, height: 120 },
      relativeTo: 'workArea',
    },
    zOrder: 'overlay',
    interaction: {
      pointer: 'passthrough',
      keyboard: 'none',
    },
    display: { type: 'primary' },
    fullscreenBehavior: 'hide-on-exclusive-fullscreen',
    opacity: 0.95,
  });

  console.log('Overlay Engine active:');
  engine.logDiagnostics();
  console.log('\n----------------------------------------------');

  // Initialize Spotify Service
  const spotify = new SpotifyService({
    autoStartPolling: true,
    pollIntervalMs: 1000,
  });

  spotify.onTrack((track, lyrics) => {
    console.log(`\n🎵 Track Changed: "${track.title}" by ${track.artist}`);
    console.log(`   Album: ${track.album}`);
    console.log(`   Duration: ${formatTimestamp(track.durationMs)}`);
    console.log(`   Lyrics loaded: ${lyrics.length} lines from LRCLIB`);

    if (lyrics.length > 0) {
      console.log('   Sample lyric line [0]:', lyrics[0].text);
    } else {
      console.log('   (Instrumental or lyrics not found in LRCLIB)');
    }
  });

  spotify.onStatus((status) => {
    console.log(`\n▶ Playback Status: ${status}`);
  });

  // Track progress and print active lyric line every 2 seconds for a short demo
  let ticks = 0;
  const timer = setInterval(() => {
    const track = spotify.getCurrentTrack();
    if (!track) return;

    const posMs = spotify.getCurrentPositionMs();
    const lyrics = spotify.getCurrentLyrics();
    const activeIdx = findActiveLineIndex(lyrics, posMs);
    const activeLine = activeIdx >= 0 ? lyrics[activeIdx] : null;

    console.log(
      `[${formatTimestamp(posMs)} / ${formatTimestamp(track.durationMs)}] Line #${activeIdx}: ${
        activeLine ? `"${activeLine.text}"` : '(Intro / Instrumental)'
      }`
    );

    ticks++;
    if (ticks >= 5) {
      clearInterval(timer);
      console.log('\n=== Live Demonstration Completed Successfully ===');
      spotify.dispose();
      engine.dispose();
      platform.dispose();
      process.exit(0);
    }
  }, 2000);
}

if (process.argv[1]?.endsWith('live-spotify-hud.js') || process.argv[1]?.endsWith('live-spotify-hud.ts')) {
  void runLiveSpotifyHUD();
}
