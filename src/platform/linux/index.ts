import { DisplayProvider, FullscreenDetector, OverlayWindow, PlatformCapabilities } from '../../core/types.js';
import { PlatformAdapter } from '../types.js';
import { HyprlandIPC } from './hyprland-ipc.js';
import { WaylandDisplayProvider } from './wayland-display-provider.js';
import { WaylandFullscreenDetector } from './wayland-fullscreen-detector.js';
import { WaylandLayerShellWindow, WaylandNativeBridge } from './wayland-window.js';

export * from './hyprland-ipc.js';
export * from './wayland-window.js';
export * from './wayland-display-provider.js';
export * from './wayland-fullscreen-detector.js';

export class WaylandPlatformAdapter implements PlatformAdapter {
  public readonly platform = 'linux' as const;
  public readonly backend = 'wayland' as const;
  public readonly compositor?: string;

  private hyprland?: HyprlandIPC;
  private displayProvider: WaylandDisplayProvider;
  private fullscreenDetector: WaylandFullscreenDetector;
  private bridge?: WaylandNativeBridge;

  constructor(options?: { bridge?: WaylandNativeBridge; hyprland?: HyprlandIPC }) {
    this.bridge = options?.bridge;
    this.hyprland = options?.hyprland || new HyprlandIPC();

    if (this.hyprland.isAvailable()) {
      this.compositor = 'hyprland';
    } else if (process.env.SWAYSOCK) {
      this.compositor = 'sway';
    } else {
      this.compositor = process.env.XDG_CURRENT_DESKTOP || 'wayland-generic';
    }

    this.displayProvider = new WaylandDisplayProvider(this.hyprland);
    this.fullscreenDetector = new WaylandFullscreenDetector(this.hyprland);
  }

  public getCapabilities(): PlatformCapabilities {
    const hasHyprland = Boolean(this.hyprland && this.hyprland.isAvailable());
    return {
      layerShell: true,
      alwaysOnTop: true,
      clickThrough: true,
      multiMonitor: true,
      fullscreenDetection: hasHyprland,
      fractionalScaling: true,
    };
  }

  public async createOverlayWindow(): Promise<OverlayWindow> {
    const win = new WaylandLayerShellWindow(this.bridge);
    return win;
  }

  public getDisplayProvider(): DisplayProvider {
    return this.displayProvider;
  }

  public getFullscreenDetector(): FullscreenDetector {
    return this.fullscreenDetector;
  }

  public dispose(): void {
    this.displayProvider.dispose();
    this.fullscreenDetector.dispose();
    this.hyprland?.dispose();
  }
}
