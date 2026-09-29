import { ActualWindowState, InputMode, OverlayWindow, Rect, ZOrder } from '../../core/types.js';
import { TauriInvokeFn } from './types.js';

export interface TauriWindowOptions {
  invoke?: TauriInvokeFn;
}

export class TauriOverlayWindow implements OverlayWindow {
  private invoke: TauriInvokeFn;
  private state: ActualWindowState;

  constructor(options?: TauriWindowOptions) {
    this.invoke = options?.invoke || (async (cmd, args) => {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke(cmd, args);
      }
      return undefined;
    });

    this.state = {
      created: false,
      visible: false,
      geometry: { x: 0, y: 0, width: 750, height: 120 },
      displayId: 'primary',
      zOrder: 'overlay',
      inputMode: 'passthrough',
      keyboardMode: 'none',
      opacity: 1.0,
    };
  }

  public async create(): Promise<void> {
    this.state.created = true;
  }

  public async destroy(): Promise<void> {
    this.state.created = false;
  }

  public setGeometry(geometry: Rect): void {
    this.state.geometry = { ...geometry };
    void this.invoke('set_overlay_geometry', {
      x: Math.round(geometry.x),
      y: Math.round(geometry.y),
      width: Math.round(geometry.width),
      height: Math.round(geometry.height),
    });
  }

  public setVisibility(visible: boolean): void {
    this.state.visible = visible;
    void this.invoke('set_overlay_visibility', { visible });
  }

  public setInputMode(mode: InputMode): void {
    this.state.inputMode = mode;
    const passthrough = mode === 'passthrough';
    void this.invoke('set_click_through', { passthrough });
  }

  public setZOrder(mode: ZOrder): void {
    this.state.zOrder = mode;
    const topmost = mode === 'overlay' || mode === 'topmost';
    void this.invoke('set_overlay_z_order', { topmost });
  }

  public setDisplay(displayId: string): void {
    this.state.displayId = displayId;
  }

  public setOpacity(opacity: number): void {
    this.state.opacity = opacity;
  }

  public getActualState(): ActualWindowState {
    return { ...this.state, geometry: { ...this.state.geometry } };
  }
}
