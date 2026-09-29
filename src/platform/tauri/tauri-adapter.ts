import {
  DisplayProvider,
  FullscreenDetector,
  OverlayWindow,
  PlatformCapabilities,
} from '../../core/types.js';
import { PlatformAdapter } from '../types.js';
import { TauriDisplayProvider } from './tauri-display-provider.js';
import { TauriFullscreenDetector } from './tauri-fullscreen-detector.js';
import { TauriOverlayWindow } from './tauri-window.js';
import { TauriInvokeFn } from './types.js';

export interface TauriPlatformAdapterOptions {
  invoke?: TauriInvokeFn;
}

export class TauriPlatformAdapter implements PlatformAdapter {
  public readonly platform = 'linux' as const;
  public readonly backend = 'tauri' as const;

  private invoke?: TauriInvokeFn;
  private displayProvider?: TauriDisplayProvider;
  private fullscreenDetector?: TauriFullscreenDetector;

  constructor(options?: TauriPlatformAdapterOptions) {
    this.invoke = options?.invoke;
  }

  public getCapabilities(): PlatformCapabilities {
    return {
      layerShell: false,
      alwaysOnTop: true,
      clickThrough: true,
      multiMonitor: true,
      fullscreenDetection: false,
      fractionalScaling: true,
    };
  }

  public async createOverlayWindow(): Promise<OverlayWindow> {
    const win = new TauriOverlayWindow({ invoke: this.invoke });
    await win.create();
    return win;
  }

  public getDisplayProvider(): DisplayProvider {
    if (!this.displayProvider) {
      this.displayProvider = new TauriDisplayProvider({ invoke: this.invoke });
    }
    return this.displayProvider;
  }

  public getFullscreenDetector(): FullscreenDetector {
    if (!this.fullscreenDetector) {
      this.fullscreenDetector = new TauriFullscreenDetector();
    }
    return this.fullscreenDetector;
  }

  public dispose(): void {
    this.displayProvider?.dispose();
    this.fullscreenDetector?.dispose();
  }
}
