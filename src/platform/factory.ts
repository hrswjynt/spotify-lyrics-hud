import { PlatformAdapter } from './types.js';
import { WaylandPlatformAdapter } from './linux/index.js';
import { WindowsPlatformAdapter } from './windows/index.js';
import { TauriPlatformAdapter } from './tauri/index.js';

export interface PlatformFactoryOptions {
  forcePlatform?: 'linux' | 'windows' | 'tauri';
}

/**
 * Centralized Platform Factory.
 * Detects the runtime environment once at startup and instantiates the appropriate native adapter.
 */
export function createPlatformAdapter(options?: PlatformFactoryOptions): PlatformAdapter {
  if (options?.forcePlatform === 'tauri') {
    return new TauriPlatformAdapter();
  }

  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    return new TauriPlatformAdapter();
  }

  const targetPlatform = options?.forcePlatform || (typeof process !== 'undefined' ? process.platform : 'linux');

  switch (targetPlatform) {
    case 'win32':
    case 'windows':
      return new WindowsPlatformAdapter();

    case 'linux':
    default:
      return new WaylandPlatformAdapter();
  }
}
