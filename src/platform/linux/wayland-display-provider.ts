import { Display, DisplayProvider } from '../../core/types.js';
import { HyprlandIPC } from './hyprland-ipc.js';

export class WaylandDisplayProvider implements DisplayProvider {
  private hyprland?: HyprlandIPC;
  private cachedDisplays: Display[] = [];
  private listeners: Array<(displays: Display[]) => void> = [];
  private cleanupHyprland?: () => void;

  constructor(hyprland?: HyprlandIPC) {
    this.hyprland = hyprland;

    if (this.hyprland && this.hyprland.isAvailable()) {
      this.cleanupHyprland = this.hyprland.addListener({
        onMonitorChanged: async () => {
          await this.refreshDisplays();
        },
      });
    }
  }

  public async getDisplays(): Promise<Display[]> {
    if (this.hyprland && this.hyprland.isAvailable()) {
      try {
        this.cachedDisplays = await this.hyprland.getMonitors();
        return [...this.cachedDisplays];
      } catch (err) {
        console.warn('Hyprland monitor query failed, using fallback displays:', err);
      }
    }

    if (this.cachedDisplays.length === 0) {
      // Generic fallback 1080p display
      this.cachedDisplays = [
        {
          id: 'wayland-0',
          name: 'Wayland Output 0',
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          workArea: { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: 1.0,
          primary: true,
        },
      ];
    }

    return [...this.cachedDisplays];
  }

  public async getPrimaryDisplay(): Promise<Display> {
    const displays = await this.getDisplays();
    return displays.find((d) => d.primary) || displays[0];
  }

  public async getActiveDisplay(): Promise<Display | undefined> {
    const displays = await this.getDisplays();
    return displays.find((d) => d.primary) || displays[0];
  }

  public onDisplaysChanged(callback: (displays: Display[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private async refreshDisplays(): Promise<void> {
    const fresh = await this.getDisplays();
    for (const listener of this.listeners) {
      listener(fresh);
    }
  }

  public dispose(): void {
    if (this.cleanupHyprland) {
      this.cleanupHyprland();
      this.cleanupHyprland = undefined;
    }
    this.listeners = [];
  }
}
