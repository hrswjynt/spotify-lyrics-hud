import { OverlayIntent } from '../core/types.js';
import { createOverlayApplication } from '../index.js';

export interface LyricsLine {
  timeMs: number;
  text: string;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  lyrics: LyricsLine[];
}

/**
 * Example demonstrating how the Spotify Lyrics Overlay is built on top of the
 * Desktop Overlay Architecture using OverlayIntent and State Reconciliation.
 */
export async function runSpotifyLyricsHUD(): Promise<void> {
  console.log('=== Initializing Spotify Lyrics HUD ===');

  // Define initial semantic intent
  const initialIntent: OverlayIntent = {
    visible: true,
    placement: {
      anchor: 'bottom-center',
      offset: { x: 0, y: -48 }, // 48px above bottom edge
      size: { width: 720, height: 110 },
      relativeTo: 'workArea',
    },
    zOrder: 'overlay', // High priority overlay
    interaction: {
      pointer: 'passthrough', // Default to click-through so user can click underneath
      keyboard: 'none',
    },
    display: { type: 'primary' },
    fullscreenBehavior: 'hide-on-exclusive-fullscreen', // Automatically hide when a game is fullscreen
    opacity: 0.95,
  };

  const { engine, platform } = await createOverlayApplication(initialIntent);

  console.log('Overlay running with intent:');
  console.log(JSON.stringify(engine.getIntent(), null, 2));

  // Log structured diagnostic report
  console.log('\n--- Diagnostic Information ---');
  engine.logDiagnostics();

  // Demonstration: User presses hotkey to make overlay interactive (e.g. to scroll lyrics)
  console.log('\n[Event] User toggles interaction mode to "interactive"');
  await engine.setIntent({
    interaction: {
      pointer: 'interactive',
      keyboard: 'none',
    },
  });
  console.log('Current input mode:', engine.getLastResolvedState()?.inputMode);

  // Demonstration: User moves overlay to secondary monitor
  console.log('\n[Event] User moves overlay to active monitor');
  await engine.setIntent({
    display: { type: 'active' },
  });
  console.log('Target display:', engine.getLastResolvedState()?.displayId);

  // Demonstration: User docks overlay to top-right
  console.log('\n[Event] User changes anchor to "top-right"');
  await engine.setIntent({
    placement: {
      anchor: 'top-right',
      offset: { x: -24, y: 24 },
      size: { width: 450, height: 90 },
    },
  });
  console.log('New Geometry:', engine.getLastResolvedState()?.geometry);

  engine.dispose();
  platform.dispose();
  console.log('\n=== Overlay Closed Gracefully ===');
}

// Allow direct execution
if (process.argv[1]?.endsWith('spotify-lyrics-overlay.js') || process.argv[1]?.endsWith('spotify-lyrics-overlay.ts')) {
  void runSpotifyLyricsHUD();
}
