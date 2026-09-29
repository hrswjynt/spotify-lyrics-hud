/**
 * Platform-Neutral Overlay Domain Types & Interfaces
 *
 * The core describes WHAT the overlay desires.
 * Platform adapters determine HOW the operating system/compositor fulfills it.
 *
 * No platform-specific types (HWND, zwlr_layer_shell_v1, wl_output, etc.) are allowed here.
 */

export type Anchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Point, Size {}

export interface Placement {
  anchor: Anchor;
  offset: Point;
  size: Size;
  /**
   * Whether to position relative to the usable work area (excluding taskbars/panels)
   * or relative to the raw display bounds. Defaults to "workArea".
   */
  relativeTo?: 'workArea' | 'bounds';
}

export type ZOrder = 'normal' | 'topmost' | 'overlay';

export type InputMode = 'interactive' | 'passthrough';

export type KeyboardMode = 'none' | 'interactive';

export interface InteractionPolicy {
  pointer: InputMode;
  keyboard: KeyboardMode;
}

export type DisplaySelector =
  | { type: 'primary' }
  | { type: 'active' }
  | { type: 'id'; id: string }
  | { type: 'cursor' }
  | { type: 'target-window'; windowTitleOrId: string };

export type FullscreenBehavior =
  | 'always-show'
  | 'always-hide'
  | 'hide-on-exclusive-fullscreen'
  | 'hide-on-any-fullscreen';

export type FullscreenState =
  | { state: 'windowed' }
  | { state: 'fullscreen'; displayId?: string; applicationId?: string }
  | { state: 'unknown' };

export interface Display {
  id: string;
  name: string;
  bounds: Rect;
  workArea: Rect;
  scaleFactor: number;
  primary: boolean;
}

export interface PlatformCapabilities {
  layerShell: boolean;
  alwaysOnTop: boolean;
  clickThrough: boolean;
  multiMonitor: boolean;
  fullscreenDetection: boolean;
  fractionalScaling: boolean;
}

/**
 * High-level intent describing the desired state of the desktop overlay.
 */
export interface OverlayIntent {
  visible: boolean;
  placement: Placement;
  zOrder: ZOrder;
  interaction: InteractionPolicy;
  display: DisplaySelector;
  fullscreenBehavior: FullscreenBehavior;
  opacity?: number;
}

/**
 * Resolved, concrete state ready to be applied by the platform adapter.
 */
export interface ResolvedOverlayState {
  visible: boolean;
  geometry: Rect;
  displayId: string;
  zOrder: ZOrder;
  inputMode: InputMode;
  keyboardMode: KeyboardMode;
  opacity: number;
  // Computed Layer-Shell anchors and margins for Wayland compositors
  layerShellConfig?: {
    anchorTop: boolean;
    anchorBottom: boolean;
    anchorLeft: boolean;
    anchorRight: boolean;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
  };
}

/**
 * Actual runtime state recorded by the platform adapter for reconciliation.
 */
export interface ActualWindowState {
  created: boolean;
  visible: boolean;
  geometry: Rect;
  displayId: string;
  zOrder: ZOrder;
  inputMode: InputMode;
  keyboardMode: KeyboardMode;
  opacity: number;
}

/**
 * Platform-neutral abstraction for a native overlay window.
 */
export interface OverlayWindow {
  create(): Promise<void>;
  destroy(): Promise<void>;
  setGeometry(geometry: Rect, layerShellConfig?: ResolvedOverlayState['layerShellConfig']): Promise<void> | void;
  setVisibility(visible: boolean): Promise<void> | void;
  setInputMode(mode: InputMode): Promise<void> | void;
  setZOrder(mode: ZOrder): Promise<void> | void;
  setDisplay(displayId: string): Promise<void> | void;
  setOpacity(opacity: number): Promise<void> | void;
  getActualState(): ActualWindowState;
}

/**
 * Platform-neutral display management interface.
 */
export interface DisplayProvider {
  getDisplays(): Promise<Display[]>;
  getPrimaryDisplay(): Promise<Display>;
  getActiveDisplay(): Promise<Display | undefined>;
  onDisplaysChanged(callback: (displays: Display[]) => void): () => void;
  dispose(): void;
}

/**
 * Platform-neutral fullscreen detection interface.
 */
export interface FullscreenDetector {
  getFullscreenState(): Promise<FullscreenState>;
  onFullscreenChanged(callback: (state: FullscreenState) => void): () => void;
  dispose(): void;
}
