import { DisplayProvider, FullscreenDetector, OverlayWindow, PlatformCapabilities } from '../../core/types.js';
import { PlatformAdapter } from '../types.js';
import { Win32DisplayNativeBridge, Win32DisplayProvider } from './win32-display-provider.js';
import { Win32FullscreenBridge, Win32FullscreenDetector } from './win32-fullscreen-detector.js';
import { Win32NativeBridge, Win32OverlayWindow } from './win32-window.js';

export * from './win32-window.js';
export * from './win32-display-provider.js';
export * from './win32-fullscreen-detector.js';

export interface WindowsPlatformOptions {
  windowBridge?: Win32NativeBridge;
  displayBridge?: Win32DisplayNativeBridge;
  fullscreenBridge?: Win32FullscreenBridge;
}

export class WindowsPlatformAdapter implements PlatformAdapter {
  public readonly platform = 'windows' as const;
  public readonly backend = 'win32' as const;

  private displayProvider: Win32DisplayProvider;
  private fullscreenDetector: Win32FullscreenDetector;
  private windowBridge?: Win32NativeBridge;

  constructor(options?: WindowsPlatformOptions) {
    this.windowBridge = options?.windowBridge;
    this.displayProvider = new Win32DisplayProvider(options?.displayBridge);
    this.fullscreenDetector = new Win32FullscreenDetector(options?.fullscreenBridge);
  }

  public getCapabilities(): PlatformCapabilities {
    return {
      layerShell: false, // Windows does not use layer-shell
      alwaysOnTop: true,
      clickThrough: true,
      multiMonitor: true,
      fullscreenDetection: true,
      fractionalScaling: true,
    };
  }

  public async createOverlayWindow(): Promise<OverlayWindow> {
    return new Win32OverlayWindow(this.windowBridge);
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
  }
}
