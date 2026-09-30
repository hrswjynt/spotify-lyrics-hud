import { OverlayEngine } from '../core/overlay-engine.js';
import { Anchor, Display, DisplayProvider } from '../core/types.js';
import { SpotifyService } from '../data/spotify-service.js';
import { HotkeyManager } from './hotkeys/hotkey-manager.js';
import { buildTrayMenu, TrayDisplaySettings } from './tray/menu-items.js';
import { TrayManager } from './tray/tray-manager.js';

export interface SystemControllerOptions {
  engine: OverlayEngine;
  displayProvider?: DisplayProvider;
  spotifyService?: SpotifyService;
  hotkeyManager?: HotkeyManager;
  trayManager?: TrayManager;
  karaokeMode?: boolean;
  onToggleKaraoke?: (enabled: boolean) => void;
  displaySettings?: TrayDisplaySettings;
  onUpdateDisplaySettings?: (settings: Partial<TrayDisplaySettings>) => void;
}

export class SystemController {
  private engine: OverlayEngine;
  private displayProvider?: DisplayProvider;
  private spotifyService?: SpotifyService;
  private hotkeyManager: HotkeyManager;
  private trayManager: TrayManager;
  private karaokeMode: boolean = true;
  private onToggleKaraokeCallback?: (enabled: boolean) => void;
  private displaySettings: TrayDisplaySettings = {
    alignment: 'center',
    lineMode: 'triple',
    highlightTheme: 'emerald',
  };
  private onUpdateDisplaySettingsCallback?: (settings: Partial<TrayDisplaySettings>) => void;

  private displays: Display[] = [];
  private unsubs: Array<() => void> = [];

  constructor(options: SystemControllerOptions) {
    this.engine = options.engine;
    this.displayProvider = options.displayProvider;
    this.spotifyService = options.spotifyService;
    this.hotkeyManager = options.hotkeyManager || new HotkeyManager();
    this.trayManager = options.trayManager || new TrayManager();
    this.karaokeMode = options.karaokeMode ?? true;
    this.onToggleKaraokeCallback = options.onToggleKaraoke;
    if (options.displaySettings) {
      this.displaySettings = { ...this.displaySettings, ...options.displaySettings };
    }
    this.onUpdateDisplaySettingsCallback = options.onUpdateDisplaySettings;

    this.hotkeyManager.registerDefaultBindings();
    this.setupHotkeyHandlers();
  }

  public async start(): Promise<void> {
    // 1. Initial tray menu setup
    await this.refreshTrayMenu();

    // 2. Listen to Spotify track changes if available
    if (this.spotifyService) {
      const unsubTrack = this.spotifyService.onTrack(async () => {
        await this.refreshTrayMenu();
      });
      this.unsubs.push(unsubTrack);

      const unsubStatus = this.spotifyService.onStatus(async () => {
        await this.refreshTrayMenu();
      });
      this.unsubs.push(unsubStatus);
    }
  }

  private setupHotkeyHandlers(): void {
    this.hotkeyManager.setHandler('toggle_click_through', async () => {
      await this.toggleClickThrough();
    });

    this.hotkeyManager.setHandler('toggle_visibility', async () => {
      await this.toggleVisibility();
    });

    this.hotkeyManager.setHandler('cycle_monitor', async () => {
      await this.cycleMonitor();
    });

    this.hotkeyManager.setHandler('play_pause', async () => {
      await this.playPause();
    });

    this.hotkeyManager.setHandler('toggle_karaoke', async () => {
      await this.toggleKaraoke();
    });

    this.hotkeyManager.setHandler('toggle-karaoke', async () => {
      await this.toggleKaraoke();
    });
  }

  public async toggleClickThrough(): Promise<void> {
    const currentIntent = this.engine.getIntent();
    const nextMode =
      currentIntent.interaction.pointer === 'passthrough'
        ? 'interactive'
        : 'passthrough';

    await this.engine.setIntent({
      interaction: {
        pointer: nextMode,
        keyboard: nextMode === 'interactive' ? 'interactive' : 'none',
      },
    });

    await this.refreshTrayMenu();
  }

  public async toggleVisibility(): Promise<void> {
    const currentIntent = this.engine.getIntent();
    await this.engine.setIntent({
      visible: !currentIntent.visible,
    });
    await this.refreshTrayMenu();
  }

  public async cycleMonitor(): Promise<void> {
    const currentIntent = this.engine.getIntent();
    const diagnostics = this.engine.getDiagnostics();
    const resolved = this.engine.getLastResolvedState();

    let currentId =
      currentIntent.display.type === 'id'
        ? currentIntent.display.id
        : resolved
        ? resolved.displayId
        : diagnostics.displayId;

    if (this.displayProvider) {
      this.displays = await this.displayProvider.getDisplays();
    }

    if (this.displays.length > 1) {
      let currentIdx = this.displays.findIndex((d) => d.id === currentId);
      if (currentIdx === -1) {
        currentIdx = 0;
      }
      const nextIdx = (currentIdx + 1) % this.displays.length;
      const nextDisplay = this.displays[nextIdx];

      await this.engine.setIntent({
        display: { type: 'id', id: nextDisplay.id },
      });
      await this.refreshTrayMenu();
      return;
    }

    // Default fallback cycle between eDP-1 and HDMI-A-1
    const next = currentId === 'eDP-1' ? 'HDMI-A-1' : 'eDP-1';
    await this.engine.setIntent({
      display: { type: 'id', id: next },
    });
    await this.refreshTrayMenu();
  }

  public async setDisplay(displayId: string): Promise<void> {
    await this.engine.setIntent({
      display: { type: 'id', id: displayId },
    });
    await this.refreshTrayMenu();
  }

  public async setAnchor(anchor: Anchor): Promise<void> {
    const currentPlacement = this.engine.getIntent().placement;
    await this.engine.setIntent({
      placement: {
        ...currentPlacement,
        anchor,
      },
    });
    await this.refreshTrayMenu();
  }

  public async playPause(): Promise<void> {
    if (this.spotifyService) {
      await this.spotifyService.playPause();
      await this.refreshTrayMenu();
    }
  }

  public async nextTrack(): Promise<void> {
    if (this.spotifyService) {
      await this.spotifyService.next();
      await this.refreshTrayMenu();
    }
  }

  public async prevTrack(): Promise<void> {
    if (this.spotifyService) {
      await this.spotifyService.previous();
      await this.refreshTrayMenu();
    }
  }

  public isKaraokeMode(): boolean {
    return this.karaokeMode;
  }

  public async setKaraokeMode(enabled: boolean): Promise<void> {
    this.karaokeMode = enabled;
    this.onToggleKaraokeCallback?.(this.karaokeMode);
    await this.refreshTrayMenu();
  }

  public async toggleKaraoke(): Promise<boolean> {
    this.karaokeMode = !this.karaokeMode;
    this.onToggleKaraokeCallback?.(this.karaokeMode);
    await this.refreshTrayMenu();
    return this.karaokeMode;
  }

  public getDisplaySettings(): TrayDisplaySettings {
    return { ...this.displaySettings };
  }

  public async setDisplaySettings(settings: Partial<TrayDisplaySettings>): Promise<void> {
    this.displaySettings = { ...this.displaySettings, ...settings };
    this.onUpdateDisplaySettingsCallback?.(settings);
    await this.refreshTrayMenu();
  }

  public async refreshTrayMenu(): Promise<void> {
    const intent = this.engine.getIntent();
    const resolved = this.engine.getLastResolvedState();
    const diagnostics = this.engine.getDiagnostics();

    const currentDisplayId = resolved ? resolved.displayId : diagnostics.displayId;

    // Use current displays from diagnostics if available
    this.displays = [
      {
        id: currentDisplayId,
        name: diagnostics.displayName,
        bounds: { ...diagnostics.geometry },
        workArea: { ...diagnostics.geometry },
        scaleFactor: diagnostics.displayScale,
        primary: true,
      },
    ];

    // If on dual monitor host (e.g. eDP-1 and HDMI-A-1), include secondary
    if (currentDisplayId === 'eDP-1') {
      this.displays.push({
        id: 'HDMI-A-1',
        name: 'Xiaomi Corporation A22FAB',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        workArea: { x: 0, y: 40, width: 1920, height: 1040 },
        scaleFactor: 1.0,
        primary: false,
      });
    } else if (currentDisplayId === 'HDMI-A-1') {
      this.displays.unshift({
        id: 'eDP-1',
        name: 'AU Optronics 0xD0A2',
        bounds: { x: 0, y: 1080, width: 1920, height: 1080 },
        workArea: { x: 0, y: 1120, width: 1920, height: 1040 },
        scaleFactor: 1.0,
        primary: false,
      });
    } else if (currentDisplayId === 'DP-1') {
      this.displays.push({
        id: 'HDMI-1',
        name: 'Secondary Display',
        bounds: { x: 1920, y: 0, width: 1920, height: 1080 },
        workArea: { x: 1920, y: 0, width: 1920, height: 1080 },
        scaleFactor: 1.0,
        primary: false,
      });
    }

    const menu = buildTrayMenu({
      displays: this.displays,
      currentDisplayId,
      inputMode: intent.interaction.pointer,
      visible: intent.visible,
      currentAnchor: intent.placement.anchor,
      karaokeMode: this.karaokeMode,
      displaySettings: this.displaySettings,
      isPlaying: this.spotifyService ? this.spotifyService.getIsPlaying() : false,
      currentTrack: this.spotifyService ? this.spotifyService.getCurrentTrack() : null,
      callbacks: {
        onToggleClickThrough: () => void this.toggleClickThrough(),
        onToggleVisibility: () => void this.toggleVisibility(),
        onToggleKaraoke: () => void this.toggleKaraoke(),
        onSelectDisplay: (id) => void this.setDisplay(id),
        onSelectAnchor: (anchor) => void this.setAnchor(anchor),
        onSelectAlignment: (alignment) => void this.setDisplaySettings({ alignment }),
        onSelectLineMode: (lineMode) => void this.setDisplaySettings({ lineMode }),
        onSelectTheme: (highlightTheme) => void this.setDisplaySettings({ highlightTheme }),
        onPlayPause: () => void this.playPause(),
        onNextTrack: () => void this.nextTrack(),
        onPrevTrack: () => void this.prevTrack(),
        onQuit: () => this.dispose(),
      },
    });

    this.trayManager.setMenu(menu);
  }

  public getHotkeyManager(): HotkeyManager {
    return this.hotkeyManager;
  }

  public getTrayManager(): TrayManager {
    return this.trayManager;
  }

  public dispose(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.hotkeyManager.dispose();
    this.trayManager.dispose();
  }
}
