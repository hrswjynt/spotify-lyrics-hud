import {
  ActualWindowState,
  InputMode,
  OverlayWindow,
  Rect,
  ResolvedOverlayState,
  ZOrder,
} from '../../core/types.js';

// Win32 Window Styles & Extended Styles constants
export const WS_POPUP = 0x80000000;
export const WS_VISIBLE = 0x10000000;

export const WS_EX_TOOLWINDOW = 0x00000080;
export const WS_EX_TOPMOST = 0x00000008;
export const WS_EX_LAYERED = 0x00080000;
export const WS_EX_TRANSPARENT = 0x00000020;
export const WS_EX_NOACTIVATE = 0x08000000;

// SetWindowPos flags
export const HWND_TOPMOST = -1;
export const HWND_NOTOPMOST = -2;
export const SWP_NOSIZE = 0x0001;
export const SWP_NOMOVE = 0x0002;
export const SWP_NOACTIVATE = 0x0010;
export const SWP_SHOWWINDOW = 0x0040;
export const SWP_HIDEWINDOW = 0x0080;

// Layered window attributes
export const LWA_ALPHA = 0x00000002;

export interface Win32NativeBridge {
  createWindow(options: {
    style: number;
    exStyle: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }): Promise<bigint | number>; // HWND handle
  destroyWindow(hwnd: bigint | number): Promise<void>;
  setWindowLongPtr(hwnd: bigint | number, nIndex: number, newLong: number): Promise<number>;
  getWindowLongPtr(hwnd: bigint | number, nIndex: number): Promise<number>;
  setWindowPos(
    hwnd: bigint | number,
    hWndInsertAfter: number,
    x: number,
    y: number,
    cx: number,
    cy: number,
    uFlags: number
  ): Promise<boolean>;
  setLayeredWindowAttributes(
    hwnd: bigint | number,
    crKey: number,
    bAlpha: number,
    dwFlags: number
  ): Promise<boolean>;
  showWindow(hwnd: bigint | number, nCmdShow: number): Promise<boolean>;
}

export class Win32OverlayWindow implements OverlayWindow {
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

  private hwnd: bigint | number | null = null;
  private currentExStyle: number = 0;
  private bridge: Win32NativeBridge;

  constructor(bridge?: Win32NativeBridge) {
    this.bridge = bridge || this.createDefaultBridge();
  }

  private createDefaultBridge(): Win32NativeBridge {
    let mockStyle = WS_POPUP;
    let mockExStyle = WS_EX_TOOLWINDOW | WS_EX_LAYERED | WS_EX_NOACTIVATE;

    return {
      createWindow: async () => 0x10042, // HWND mock
      destroyWindow: async () => {},
      setWindowLongPtr: async (_hwnd, _nIndex, newLong) => {
        const old = mockExStyle;
        mockExStyle = newLong;
        return old;
      },
      getWindowLongPtr: async () => mockExStyle,
      setWindowPos: async () => true,
      setLayeredWindowAttributes: async () => true,
      showWindow: async () => true,
    };
  }

  public async create(): Promise<void> {
    if (this.actualState.created) return;

    // Start with base styles: borderless popup, toolwindow (no alt-tab), layered
    let exStyle = WS_EX_TOOLWINDOW | WS_EX_LAYERED | WS_EX_NOACTIVATE;

    if (this.actualState.zOrder === 'topmost' || this.actualState.zOrder === 'overlay') {
      exStyle |= WS_EX_TOPMOST;
    }

    if (this.actualState.inputMode === 'passthrough') {
      exStyle |= WS_EX_TRANSPARENT;
    }

    this.currentExStyle = exStyle;

    this.hwnd = await this.bridge.createWindow({
      style: WS_POPUP,
      exStyle,
      x: this.actualState.geometry.x || 0,
      y: this.actualState.geometry.y || 0,
      width: this.actualState.geometry.width || 700,
      height: this.actualState.geometry.height || 100,
    });

    this.actualState.created = true;
    await this.setOpacity(this.actualState.opacity);
  }

  public async destroy(): Promise<void> {
    if (!this.actualState.created || !this.hwnd) return;
    await this.bridge.destroyWindow(this.hwnd);
    this.hwnd = null;
    this.actualState.created = false;
    this.actualState.visible = false;
  }

  public async setGeometry(
    geometry: Rect,
    _layerShellConfig?: ResolvedOverlayState['layerShellConfig']
  ): Promise<void> {
    this.actualState.geometry = { ...geometry };
    if (!this.hwnd) return;

    const insertAfter =
      this.actualState.zOrder === 'normal' ? HWND_NOTOPMOST : HWND_TOPMOST;

    await this.bridge.setWindowPos(
      this.hwnd,
      insertAfter,
      geometry.x,
      geometry.y,
      geometry.width,
      geometry.height,
      SWP_NOACTIVATE | (this.actualState.visible ? SWP_SHOWWINDOW : 0)
    );
  }

  public async setVisibility(visible: boolean): Promise<void> {
    this.actualState.visible = visible;
    if (!this.hwnd) return;

    const SW_HIDE = 0;
    const SW_SHOWNOACTIVATE = 4;
    await this.bridge.showWindow(this.hwnd, visible ? SW_SHOWNOACTIVATE : SW_HIDE);
  }

  public async setInputMode(mode: InputMode): Promise<void> {
    this.actualState.inputMode = mode;
    if (!this.hwnd) return;

    // GWL_EXSTYLE is -20
    const GWL_EXSTYLE = -20;
    let newExStyle = this.currentExStyle;

    if (mode === 'passthrough') {
      // Add WS_EX_TRANSPARENT: OS routes mouse events to underlying windows
      newExStyle |= WS_EX_TRANSPARENT;
    } else {
      // Remove WS_EX_TRANSPARENT: Window receives mouse events normally
      newExStyle &= ~WS_EX_TRANSPARENT;
    }

    if (newExStyle !== this.currentExStyle) {
      this.currentExStyle = newExStyle;
      await this.bridge.setWindowLongPtr(this.hwnd, GWL_EXSTYLE, newExStyle);
    }
  }

  public async setZOrder(mode: ZOrder): Promise<void> {
    this.actualState.zOrder = mode;
    if (!this.hwnd) return;

    const insertAfter = mode === 'normal' ? HWND_NOTOPMOST : HWND_TOPMOST;
    await this.bridge.setWindowPos(
      this.hwnd,
      insertAfter,
      0,
      0,
      0,
      0,
      SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE
    );
  }

  public async setDisplay(displayId: string): Promise<void> {
    this.actualState.displayId = displayId;
    // On Win32, moving to another monitor is handled through coordinate positioning in setGeometry()
  }

  public async setOpacity(opacity: number): Promise<void> {
    this.actualState.opacity = opacity;
    if (!this.hwnd) return;

    const alphaByte = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
    await this.bridge.setLayeredWindowAttributes(this.hwnd, 0, alphaByte, LWA_ALPHA);
  }

  public getActualState(): ActualWindowState {
    return { ...this.actualState };
  }
}
