import { FullscreenDetector, FullscreenState } from '../../core/types.js';
import { HyprlandIPC } from './hyprland-ipc.js';

export class WaylandFullscreenDetector implements FullscreenDetector {
  private hyprland?: HyprlandIPC;
  private listeners: Array<(state: FullscreenState) => void> = [];
  private cleanupHyprland?: () => void;
  private currentState: FullscreenState = { state: 'windowed' };

  constructor(hyprland?: HyprlandIPC) {
    this.hyprland = hyprland;

    if (this.hyprland && this.hyprland.isAvailable()) {
      this.hyprland.connectEventStream();

      this.cleanupHyprland = this.hyprland.addListener({
        onFullscreen: async () => {
          await this.checkState();
        },
        onActiveWindow: async () => {
          await this.checkState();
        },
      });
    }
  }

  public async getFullscreenState(): Promise<FullscreenState> {
    if (this.hyprland && this.hyprland.isAvailable()) {
      try {
        this.currentState = await this.hyprland.getFullscreenState();
        return this.currentState;
      } catch (err) {
        console.warn('Failed to query Hyprland fullscreen state:', err);
      }
    }

    // Generic Wayland sandbox does not expose external window state without compositor privilege
    return { state: 'unknown' };
  }

  public onFullscreenChanged(callback: (state: FullscreenState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private async checkState(): Promise<void> {
    const newState = await this.getFullscreenState();
    for (const listener of this.listeners) {
      listener(newState);
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
