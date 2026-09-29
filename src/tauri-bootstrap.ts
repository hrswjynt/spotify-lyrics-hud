import { TauriPlatformAdapter } from './platform/tauri/index.js';
import { OverlayEngine } from './core/overlay-engine.js';
import { SystemController } from './system/system-controller.js';
import { SpotifyService } from './data/spotify-service.js';
import { DbusMprisClient } from './data/mpris/dbus-mpris.js';
import { TauriMprisRunner } from './data/mpris/tauri-mpris-runner.js';
import { setTrack, setPlaying, updateProgress } from './ui/src/stores/playback.js';
import { onUIIntentChange, syncWithEngineState } from './ui/src/stores/overlay.js';

export async function initTauriRuntime(): Promise<{
  engine: OverlayEngine;
  controller: SystemController;
  spotify: SpotifyService;
} | null> {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
    return null;
  }

  const { invoke } = await import('@tauri-apps/api/core');
  const { listen } = await import('@tauri-apps/api/event');

  const platform = new TauriPlatformAdapter({ invoke });
  const windowHandle = await platform.createOverlayWindow();

  const engine = new OverlayEngine({
    window: windowHandle,
    displayProvider: platform.getDisplayProvider(),
    fullscreenDetector: platform.getFullscreenDetector(),
    capabilities: platform.getCapabilities(),
    platformName: 'linux',
    backendName: 'tauri',
    initialIntent: {
      visible: true,
      placement: {
        anchor: 'bottom-center',
        offset: { x: 0, y: -48 },
        size: { width: 750, height: 275 },
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

    },
  });

  await engine.start();
  void invoke('log_from_js', { level: 'INFO', msg: 'OverlayEngine started with size 750x275' });

  const mprisRunner = new TauriMprisRunner(invoke);
  const mprisClient = new DbusMprisClient(mprisRunner);


  const spotify = new SpotifyService({
    mprisClient,
    autoStartPolling: false,
    pollIntervalMs: 1000,
  });

  // Sync Spotify changes to UI stores
  spotify.onTrack((track, lyrics) => {
    void invoke('log_from_js', {
      level: 'INFO',
      msg: `Track: "${track.title}" by "${track.artist}" | Lyrics: ${lyrics.length} lines | Art: ${track.albumArtUrl ? 'Yes' : 'No'}`,
    });
    setTrack(
      {
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumArtUrl: track.albumArtUrl,
        durationMs: track.durationMs,
      },
      lyrics.map((l) => ({ timeMs: l.timeMs, text: l.text })),
      spotify.getCurrentPositionMs(),
      spotify.getIsPlaying()
    );
  });

  spotify.onStatus((status) => {
    void invoke('log_from_js', { level: 'INFO', msg: `Playback Status: ${status}` });
    setPlaying(status === 'Playing');
  });


  const controller = new SystemController({
    engine,
    displayProvider: platform.getDisplayProvider(),
    spotifyService: spotify,
  });

  await controller.start();

  // Start polling MPRIS
  spotify.start(1000);
  try {
    await spotify.pollOnce();
  } catch (err) {
    console.warn('[Spotify] Initial poll error:', err);
  }


  // Sync UI intent requests back to OverlayEngine
  onUIIntentChange((intent) => {
    void engine.setIntent(intent);
  });

  // Helper to update UI store from current engine state
  const syncStoreWithEngine = () => {
    const intent = engine.getIntent();
    const resolved = engine.getLastResolvedState();
    syncWithEngineState({
      inputMode: intent.interaction.pointer,
      zOrder: intent.zOrder,
      displayId: resolved ? resolved.displayId : 'primary',
      visible: intent.visible,
      opacity: intent.opacity ?? 1.0,
    });
  };

  syncStoreWithEngine();

  // Sync Dynamic Tray menu to native OS tray
  controller.getTrayManager().onChange((menu) => {
    void invoke('update_native_tray_menu', { items: menu.items });
    syncStoreWithEngine();
  });

  // Push initial tray menu
  const initialMenu = controller.getTrayManager().getMenu();
  if (initialMenu) {
    void invoke('update_native_tray_menu', { items: initialMenu.items });
  }

  // Listen for native events from Rust
  await listen<string>('tray-menu-action', (event) => {
    controller.getTrayManager().triggerItem(event.payload);
  });

  await listen<string>('global-shortcut-pressed', (event) => {
    void controller.getHotkeyManager().trigger(event.payload);
  });

  // High precision position tracking loop
  setInterval(() => {
    const pos = spotify.getCurrentPositionMs();
    updateProgress(pos);
  }, 100);

  return { engine, controller, spotify };
}
