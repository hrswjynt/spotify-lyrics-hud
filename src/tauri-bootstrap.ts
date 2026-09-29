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
  });

  await engine.start();

  const mprisRunner = new TauriMprisRunner(invoke);
  const mprisClient = new DbusMprisClient(mprisRunner);

  const spotify = new SpotifyService({
    mprisClient,
    autoStartPolling: true,
    pollIntervalMs: 1000,
  });

  const controller = new SystemController({
    engine,
    displayProvider: platform.getDisplayProvider(),
    spotifyService: spotify,
  });

  await controller.start();

  // Sync Spotify changes to UI stores
  spotify.onTrack((track, lyrics) => {
    setTrack(
      {
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumArtUrl: track.albumArtUrl,
        durationMs: track.durationMs,
      },
      lyrics.map((l) => ({ timeMs: l.timeMs, text: l.text }))
    );
  });

  spotify.onStatus((status) => {
    setPlaying(status === 'Playing');
  });

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
