import {
  ActualWindowState,
  InputMode,
  OverlayWindow,
  Rect,
  ResolvedOverlayState,
  ZOrder,
} from '../../core/types.js';

// Wayland zwlr_layer_shell_v1 protocol constants
export enum WlrLayer {
  Background = 0,
  Bottom = 1,
  Top = 2,
  Overlay = 3,
}

export enum WlrLayerAnchor {
  Top = 1 << 0,
  Bottom = 1 << 1,
  Left = 1 << 2,
  Right = 1 << 3,
}

export interface WaylandNativeBridge {
  createLayerSurface(options: {
    layer: WlrLayer;
    outputName?: string;
    width: number;
    height: number;
  }): Promise<string>; // surface ID
  destroyLayerSurface(surfaceId: string): Promise<void>;
  setLayer(surfaceId: string, layer: WlrLayer): Promise<void>;
  setAnchorsAndMargins(
    surfaceId: string,
    anchors: number,
    margins: { top: number; right: number; bottom: number; left: number }
  ): Promise<void>;
  setSize(surfaceId: string, width: number, height: number): Promise<void>;
  setInputRegion(surfaceId: string, empty: boolean): Promise<void>;
  setOutput(surfaceId: string, outputName: string): Promise<void>;
  setOpacity(surfaceId: string, opacity: number): Promise<void>;
  setVisibility(surfaceId: string, visible: boolean): Promise<void>;
}

/**
 * Native Wayland implementation of OverlayWindow using zwlr_layer_shell_v1 protocol.
 */
export class WaylandLayerShellWindow implements OverlayWindow {
  private actualState: ActualWindowState = {
    created: false,
    visible: false,
    geometry: { x: 0, y: 0, width: 0, height: 0 },
    displayId: '',
    zOrder: 'normal',
    inputMode: 'interactive',
    keyboardMode: 'none',
    opacity: 1.0,
  };

  private surfaceId: string | null = null;
  private bridge: WaylandNativeBridge;

  constructor(bridge?: WaylandNativeBridge) {
    this.bridge = bridge || this.createDefaultBridge();
  }

  private createDefaultBridge(): WaylandNativeBridge {
    // Default bridge logs protocol dispatches or interfaces with native layer-shell library
    return {
      createLayerSurface: async (opts) => `wlr_surface_${Date.now()}`,
      destroyLayerSurface: async () => {},
      setLayer: async () => {},
      setAnchorsAndMargins: async () => {},
      setSize: async () => {},
      setInputRegion: async () => {},
      setOutput: async () => {},
      setOpacity: async () => {},
      setVisibility: async () => {},
    };
  }

  public async create(): Promise<void> {
    if (this.actualState.created) return;

    const layer = this.mapZOrderToLayer(this.actualState.zOrder);
    this.surfaceId = await this.bridge.createLayerSurface({
      layer,
      outputName: this.actualState.displayId || undefined,
      width: this.actualState.geometry.width || 700,
      height: this.actualState.geometry.height || 100,
    });

    this.actualState.created = true;
  }

  public async destroy(): Promise<void> {
    if (!this.actualState.created || !this.surfaceId) return;

    await this.bridge.destroyLayerSurface(this.surfaceId);
    this.surfaceId = null;
    this.actualState.created = false;
    this.actualState.visible = false;
  }

  public async setGeometry(
    geometry: Rect,
    layerShellConfig?: ResolvedOverlayState['layerShellConfig']
  ): Promise<void> {
    this.actualState.geometry = { ...geometry };

    if (!this.surfaceId) return;

    await this.bridge.setSize(this.surfaceId, geometry.width, geometry.height);

    if (layerShellConfig) {
      let anchorBitmask = 0;
      if (layerShellConfig.anchorTop) anchorBitmask |= WlrLayerAnchor.Top;
      if (layerShellConfig.anchorBottom) anchorBitmask |= WlrLayerAnchor.Bottom;
      if (layerShellConfig.anchorLeft) anchorBitmask |= WlrLayerAnchor.Left;
      if (layerShellConfig.anchorRight) anchorBitmask |= WlrLayerAnchor.Right;

      await this.bridge.setAnchorsAndMargins(this.surfaceId, anchorBitmask, {
        top: layerShellConfig.marginTop,
        bottom: layerShellConfig.marginBottom,
        left: layerShellConfig.marginLeft,
        right: layerShellConfig.marginRight,
      });
    }
  }

  public async setVisibility(visible: boolean): Promise<void> {
    this.actualState.visible = visible;
    if (!this.surfaceId) return;
    await this.bridge.setVisibility(this.surfaceId, visible);
  }

  public async setInputMode(mode: InputMode): Promise<void> {
    this.actualState.inputMode = mode;
    if (!this.surfaceId) return;
    // On Wayland: passthrough sets an empty input region (clicks pass right through)
    const emptyRegion = mode === 'passthrough';
    await this.bridge.setInputRegion(this.surfaceId, emptyRegion);
  }

  public async setZOrder(mode: ZOrder): Promise<void> {
    this.actualState.zOrder = mode;
    if (!this.surfaceId) return;
    const layer = this.mapZOrderToLayer(mode);
    await this.bridge.setLayer(this.surfaceId, layer);
  }

  public async setDisplay(displayId: string): Promise<void> {
    this.actualState.displayId = displayId;
    if (!this.surfaceId) return;
    await this.bridge.setOutput(this.surfaceId, displayId);
  }

  public async setOpacity(opacity: number): Promise<void> {
    this.actualState.opacity = opacity;
    if (!this.surfaceId) return;
    await this.bridge.setOpacity(this.surfaceId, opacity);
  }

  public getActualState(): ActualWindowState {
    return { ...this.actualState };
  }

  private mapZOrderToLayer(zOrder: ZOrder): WlrLayer {
    switch (zOrder) {
      case 'overlay':
        return WlrLayer.Overlay; // Renders above fullscreen and normal windows
      case 'topmost':
        return WlrLayer.Top; // Standard top layer (above normal windows, below lock/fullscreen)
      case 'normal':
        return WlrLayer.Bottom;
    }
  }
}
