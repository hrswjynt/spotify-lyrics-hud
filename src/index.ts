import { OverlayEngine, OverlayIntent } from './core/index.js';
import { createPlatformAdapter, PlatformAdapter } from './platform/index.js';

export * from './core/index.js';
export * from './platform/index.js';

/**
 * Bootstrap function to initialize the desktop overlay application.
 */
export async function createOverlayApplication(initialIntent?: OverlayIntent): Promise<{
  engine: OverlayEngine;
  platform: PlatformAdapter;
}> {
  const platform = createPlatformAdapter();
  const window = await platform.createOverlayWindow();
  const displayProvider = platform.getDisplayProvider();
  const fullscreenDetector = platform.getFullscreenDetector();
  const capabilities = platform.getCapabilities();

  const engine = new OverlayEngine({
    window,
    displayProvider,
    fullscreenDetector,
    capabilities,
    platformName: platform.platform,
    backendName: platform.backend,
    compositorName: platform.compositor,
    initialIntent,
  });

  await engine.start();

  return { engine, platform };
}
