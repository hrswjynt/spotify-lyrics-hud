import { calculateLayout } from './layout.js';
import { resolveDisplay } from './display-resolver.js';
import { evaluateFullscreenVisibility, resolveInteraction } from './policy.js';
import { reconcileOverlay } from './reconciler.js';
import {
  Display,
  DisplayProvider,
  FullscreenDetector,
  FullscreenState,
  OverlayIntent,
  OverlayWindow,
  PlatformCapabilities,
  Point,
  ResolvedOverlayState,
} from './types.js';
import { formatDiagnosticLog, OverlayDiagnosticReport } from './diagnostics.js';

export interface OverlayEngineOptions {
  window: OverlayWindow;
  displayProvider: DisplayProvider;
  fullscreenDetector: FullscreenDetector;
  capabilities: PlatformCapabilities;
  platformName: string;
  backendName: string;
  compositorName?: string;
  initialIntent?: OverlayIntent;
}

export class OverlayEngine {
  private window: OverlayWindow;
  private displayProvider: DisplayProvider;
  private fullscreenDetector: FullscreenDetector;
  private capabilities: PlatformCapabilities;
  private platformName: string;
  private backendName: string;
  private compositorName?: string;

  private currentIntent: OverlayIntent;
  private currentDisplays: Display[] = [];
  private currentFullscreenState: FullscreenState = { state: 'windowed' };
  private activeCursorPosition?: Point;
  private lastResolvedState?: ResolvedOverlayState;

  private unsubs: Array<() => void> = [];

  constructor(options: OverlayEngineOptions) {
    this.window = options.window;
    this.displayProvider = options.displayProvider;
    this.fullscreenDetector = options.fullscreenDetector;
    this.capabilities = options.capabilities;
    this.platformName = options.platformName;
    this.backendName = options.backendName;
    this.compositorName = options.compositorName;

    this.currentIntent = options.initialIntent ?? {
      visible: true,
      placement: {
        anchor: 'bottom-center',
        offset: { x: 0, y: -48 },
        size: { width: 700, height: 100 },
        relativeTo: 'workArea',
      },
      zOrder: 'overlay',
      interaction: {
        pointer: 'passthrough',
        keyboard: 'none',
      },
      display: { type: 'primary' },
      fullscreenBehavior: 'hide-on-exclusive-fullscreen',
      opacity: 1.0,
    };
  }

  public async start(): Promise<void> {
    // 1. Fetch initial displays
    this.currentDisplays = await this.displayProvider.getDisplays();

    // 2. Fetch initial fullscreen state
    this.currentFullscreenState = await this.fullscreenDetector.getFullscreenState();

    // 3. Listen to display changes (monitor connect/disconnect/resolution changes)
    const unsubDisplays = this.displayProvider.onDisplaysChanged(async (displays) => {
      this.currentDisplays = displays;
      await this.evaluateAndReconcile();
    });
    this.unsubs.push(unsubDisplays);

    // 4. Listen to fullscreen events
    const unsubFullscreen = this.fullscreenDetector.onFullscreenChanged(async (fsState) => {
      this.currentFullscreenState = fsState;
      await this.evaluateAndReconcile();
    });
    this.unsubs.push(unsubFullscreen);

    // 5. Initial reconciliation
    await this.evaluateAndReconcile();
  }

  public async setIntent(intent: Partial<OverlayIntent>): Promise<void> {
    this.currentIntent = {
      ...this.currentIntent,
      ...intent,
      placement: intent.placement
        ? { ...this.currentIntent.placement, ...intent.placement }
        : this.currentIntent.placement,
      interaction: intent.interaction
        ? { ...this.currentIntent.interaction, ...intent.interaction }
        : this.currentIntent.interaction,
    };
    await this.evaluateAndReconcile();
  }

  public getIntent(): OverlayIntent {
    return { ...this.currentIntent };
  }

  public getLastResolvedState(): ResolvedOverlayState | undefined {
    return this.lastResolvedState ? { ...this.lastResolvedState } : undefined;
  }

  public updateCursorPosition(point: Point): void {
    this.activeCursorPosition = point;
    if (this.currentIntent.display.type === 'cursor') {
      void this.evaluateAndReconcile();
    }
  }

  public async evaluateAndReconcile(): Promise<ResolvedOverlayState> {
    if (this.currentDisplays.length === 0) {
      this.currentDisplays = await this.displayProvider.getDisplays();
    }

    const primaryDisplay =
      (await this.displayProvider.getPrimaryDisplay()) || this.currentDisplays[0];
    const activeDisplay = await this.displayProvider.getActiveDisplay();

    // Resolve target display
    const targetDisplay = resolveDisplay(this.currentIntent.display, {
      displays: this.currentDisplays,
      primaryDisplay,
      activeDisplay,
      cursorPosition: this.activeCursorPosition,
    });

    // Evaluate layout
    const layout = calculateLayout(this.currentIntent.placement, targetDisplay);

    // Evaluate visibility under fullscreen policy
    const effectiveVisible = evaluateFullscreenVisibility({
      intentVisible: this.currentIntent.visible,
      behavior: this.currentIntent.fullscreenBehavior,
      fullscreenState: this.currentFullscreenState,
      targetDisplayId: targetDisplay.id,
    });

    // Evaluate interaction policy
    const interaction = resolveInteraction(this.currentIntent.interaction);

    const resolved: ResolvedOverlayState = {
      visible: effectiveVisible,
      geometry: layout.geometry,
      displayId: targetDisplay.id,
      zOrder: this.currentIntent.zOrder,
      inputMode: interaction.pointer,
      keyboardMode: interaction.keyboard,
      opacity: this.currentIntent.opacity ?? 1.0,
      layerShellConfig: layout.layerShellConfig,
    };

    this.lastResolvedState = resolved;

    // Reconcile with native window
    await reconcileOverlay(this.window, resolved);

    return resolved;
  }

  public getDiagnostics(): OverlayDiagnosticReport {
    const primary = this.currentDisplays.find((d) => d.primary) || this.currentDisplays[0];
    const targetDisplay = this.lastResolvedState
      ? this.currentDisplays.find((d) => d.id === this.lastResolvedState?.displayId) || primary
      : primary;

    return {
      platform: this.platformName,
      backend: this.backendName,
      compositor: this.compositorName,
      displayId: targetDisplay?.id ?? 'unknown',
      displayName: targetDisplay?.name ?? 'unknown',
      displayScale: targetDisplay?.scaleFactor ?? 1,
      anchor: this.currentIntent.placement.anchor,
      geometry: this.lastResolvedState?.geometry ?? {
        x: 0,
        y: 0,
        width: this.currentIntent.placement.size.width,
        height: this.currentIntent.placement.size.height,
      },
      inputMode: this.lastResolvedState?.inputMode ?? this.currentIntent.interaction.pointer,
      zOrder: this.lastResolvedState?.zOrder ?? this.currentIntent.zOrder,
      visible: this.lastResolvedState?.visible ?? this.currentIntent.visible,
      fullscreenState: this.currentFullscreenState,
      capabilities: this.capabilities,
    };
  }

  public logDiagnostics(): void {
    console.log(formatDiagnosticLog(this.getDiagnostics()));
  }

  public dispose(): void {
    for (const unsub of this.unsubs) {
      unsub();
    }
    this.unsubs = [];
    this.displayProvider.dispose();
    this.fullscreenDetector.dispose();
  }
}
