import { PlatformAdapter } from './types.js';
import { WaylandPlatformAdapter } from './linux/index.js';
import { WindowsPlatformAdapter } from './windows/index.js';

export interface PlatformFactoryOptions {
  forcePlatform?: 'linux' | 'windows';
}

/**
 * Centralized Platform Factory.
 * Detects the runtime environment once at startup and instantiates the appropriate native adapter.
 */
export function createPlatformAdapter(options?: PlatformFactoryOptions): PlatformAdapter {
  const targetPlatform = options?.forcePlatform || process.platform;

  switch (targetPlatform) {
    case 'win32':
    case 'windows':
      return new WindowsPlatformAdapter();

    case 'linux':
    default:
      return new WaylandPlatformAdapter();
  }
}
