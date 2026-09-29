import {
  DisplayProvider,
  FullscreenDetector,
  OverlayWindow,
  PlatformCapabilities,
} from '../core/types.js';

/**
 * Top-level contract that each native platform (Linux Wayland, Windows Win32) must satisfy.
 */
export interface PlatformAdapter {
  readonly platform: 'linux' | 'windows' | 'darwin';
  readonly backend: 'wayland' | 'win32' | 'mock' | 'tauri';
  readonly compositor?: string;

  getCapabilities(): PlatformCapabilities;
  createOverlayWindow(): Promise<OverlayWindow>;
  getDisplayProvider(): DisplayProvider;
  getFullscreenDetector(): FullscreenDetector;
  dispose(): void;
}
