import { TauriPlatformAdapter, TauriOverlayWindow } from './platform/tauri/index.js';
import { OverlayEngine } from './core/overlay-engine.js';
import { SystemController } from './system/system-controller.js';
import { TrayDisplaySettings } from './system/tray/menu-items.js';
import { SpotifyService } from './data/spotify-service.js';
import { DbusMprisClient } from './data/mpris/dbus-mpris.js';
import { TauriMprisRunner } from './data/mpris/tauri-mpris-runner.js';
import { setTrack, updateTrackArtist, setPlaying, updateProgress, karaokeMode, setKaraokeMode } from './ui/src/stores/playback.js';
import { displaySettings, updateDisplaySettings } from './ui/src/stores/display-settings.js';
import { onUIIntentChange, syncWithEngineState } from './ui/src/stores/overlay.js';

export function resolveEnrichedArtist(
  primaryArtist: string,
  scrapedArtist?: string | null,
  lrclibArtist?: string | null
): string {
  if (scrapedArtist && scrapedArtist.trim().length > 0) {
    return scrapedArtist.trim();
  }
  if (lrclibArtist) {
    const trimmed = lrclibArtist.trim();
    if (/[,/&]|feat\./i.test(trimmed)) {
      return trimmed.replace(/\s*\/\s*/g, ', ');
    }
  }
  return primaryArtist;
}

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

  let initialScale = 1.0;
  const unsubInitialScale = displaySettings.subscribe((s) => {
    initialScale = parseFloat(s.scale || '1') || 1.0;
  });
  unsubInitialScale();

  const initWidth = Math.round(750 * initialScale);
  const initHeight = Math.round(275 * initialScale);

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
        size: { width: initWidth, height: initHeight },
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
  void invoke('log_from_js', { level: 'INFO', msg: `OverlayEngine started with size ${initWidth}x${initHeight}` });

  const mprisRunner = new TauriMprisRunner(invoke);
  const mprisClient = new DbusMprisClient(mprisRunner);


  const spotify = new SpotifyService({
    mprisClient,
    autoStartPolling: false,
    pollIntervalMs: 1000,
  });

  let activeEnrichmentTrackId: string | null = null;

  // Sync Spotify changes to UI stores
  spotify.onTrack(async (track, rawLyrics) => {
    void invoke('log_from_js', {
      level: 'INFO',
      msg: `Track: "${track.title}" by "${track.artist}" | Lyrics: ${rawLyrics.length} lines | Art: ${track.albumArtUrl ? 'Yes' : 'No'}`,
    });

    let lines: LyricLine[] = rawLyrics.map((l) => ({ timeMs: l.timeMs, text: l.text }));

    // If lyrics are present, check for Japanese transliteration
    if (lines.length > 0) {
      try {
        const textLines = lines.map((l) => l.text);
        const romajiResults = await invoke<Array<string | null>>('convert_lyrics_to_romaji', {
          lines: textLines,
        });
        if (Array.isArray(romajiResults)) {
          lines = lines.map((line, idx) => ({
            ...line,
            romaji: romajiResults[idx] || undefined,
          }));
        }
      } catch (err) {
        console.warn('[Romaji] Transliteration failed:', err);
      }
    }

    const activeId = track.id;
    activeEnrichmentTrackId = activeId || null;

    setTrack(
      {
        id: activeId,
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumArtUrl: track.albumArtUrl,
        durationMs: track.durationMs,
      },
      lines,
      spotify.getCurrentPositionMs(),
      spotify.getIsPlaying()
    );

    // Asynchronously enrich metadata for multi-artist collaborations
    if (activeId) {
      void (async () => {
        try {
          const scrapedArtist = await invoke<string | null>('enrich_track_metadata', {
            trackId: activeId,
          });
          const enriched = resolveEnrichedArtist(track.artist, scrapedArtist);
          if (activeEnrichmentTrackId === activeId && enriched !== track.artist) {
            updateTrackArtist(enriched, activeId);
            void invoke('log_from_js', {
              level: 'INFO',
              msg: `Enriched artist for "${track.title}": "${enriched}"`,
            });
          }
        } catch (err) {
          console.warn('[Enrichment] Failed to enrich track metadata:', err);
        }
      })();
    }
  });

  spotify.onStatus((status) => {
    void invoke('log_from_js', { level: 'INFO', msg: `Playback Status: ${status}` });
    setPlaying(status === 'Playing');
  });


  let initialKaraoke = true;
  const unsubInitial = karaokeMode.subscribe((v) => {
    initialKaraoke = v;
  });
  unsubInitial();

  let initialDisplaySettings: TrayDisplaySettings = {};
  const unsubInitialDisplay = displaySettings.subscribe((s) => {
    initialDisplaySettings = {
      alignment: s.alignment,
      lineMode: s.lineMode,
      highlightTheme: s.highlightTheme,
    };
  });
  unsubInitialDisplay();

  const controller = new SystemController({
    engine,
    displayProvider: platform.getDisplayProvider(),
    spotifyService: spotify,
    karaokeMode: initialKaraoke,
    displaySettings: initialDisplaySettings,
    onToggleKaraoke: (enabled) => {
      setKaraokeMode(enabled);
      void invoke('log_from_js', {
        level: 'INFO',
        msg: `Karaoke mode toggled from hotkey/tray to: ${enabled}`,
      });
    },
    onUpdateDisplaySettings: (settings) => {
      updateDisplaySettings(settings);
      void invoke('log_from_js', {
        level: 'INFO',
        msg: `Display settings updated from tray: ${JSON.stringify(settings)}`,
      });
    },
  });

  karaokeMode.subscribe((enabled) => {
    if (controller.isKaraokeMode() !== enabled) {
      void controller.setKaraokeMode(enabled);
      void invoke('log_from_js', {
        level: 'INFO',
        msg: `Karaoke mode synced from UI to: ${enabled}`,
      });
    }
  });

  let lastScale: string | undefined = undefined;
  displaySettings.subscribe((s) => {
    const current = controller.getDisplaySettings();
    if (
      current.alignment !== s.alignment ||
      current.lineMode !== s.lineMode ||
      current.highlightTheme !== s.highlightTheme
    ) {
      void controller.setDisplaySettings({
        alignment: s.alignment,
        lineMode: s.lineMode,
        highlightTheme: s.highlightTheme,
      });
    }

    if (s.scale && s.scale !== lastScale) {
      const isInitial = lastScale === undefined;
      lastScale = s.scale;
      if (!isInitial) {
        const factor = parseFloat(s.scale) || 1.0;
        const targetWidth = Math.round(750 * factor);
        const targetHeight = Math.round(275 * factor);

        if (windowHandle instanceof TauriOverlayWindow) {
          windowHandle.setSize(targetWidth, targetHeight);
        } else {
          void invoke('set_overlay_size', { width: targetWidth, height: targetHeight });
        }
        engine.updatePlacementSize({ width: targetWidth, height: targetHeight });

        void invoke('log_from_js', {
          level: 'INFO',
          msg: `Overlay scaled to ${s.scale}x (${targetWidth}x${targetHeight}) in place`,
        });
      }
    }
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
