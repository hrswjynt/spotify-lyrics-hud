import { FullscreenDetector, FullscreenState, Rect } from '../../core/types.js';

export interface Win32ForegroundWindowInfo {
  hwnd: number | bigint;
  rect: Rect;
  style: number;
  monitorName: string;
  processName: string;
}

export interface Win32FullscreenBridge {
  getForegroundWindow(): Promise<Win32ForegroundWindowInfo | null>;
  queryUserNotificationState?(): Promise<number>; // SHQueryUserNotificationState
  onForegroundChanged(callback: () => void): () => void;
}

export class Win32FullscreenDetector implements FullscreenDetector {
  private bridge: Win32FullscreenBridge;
  private listeners: Array<(state: FullscreenState) => void> = [];
  private unsubBridge?: () => void;
  private timer?: NodeJS.Timeout;
  private lastState: FullscreenState = { state: 'windowed' };

  constructor(bridge?: Win32FullscreenBridge) {
    this.bridge = bridge || this.createDefaultBridge();

    this.unsubBridge = this.bridge.onForegroundChanged(async () => {
      await this.checkState();
    });

    // Also periodic poll every 500ms to catch game window transitions
    this.timer = setInterval(async () => {
      await this.checkState();
    }, 500);
  }

  private createDefaultBridge(): Win32FullscreenBridge {
    let mockFullscreen = false;
    return {
      getForegroundWindow: async () => {
        if (!mockFullscreen) {
          return {
            hwnd: 0x2001,
            rect: { x: 100, y: 100, width: 800, height: 600 },
            style: 0x14cf0000, // WS_OVERLAPPEDWINDOW
            monitorName: '\\\\.\\DISPLAY1',
            processName: 'explorer.exe',
          };
        }
        return {
          hwnd: 0x3001,
          rect: { x: 0, y: 0, width: 1920, height: 1080 },
          style: 0x90000000, // WS_POPUP | WS_VISIBLE (no WS_CAPTION)
          monitorName: '\\\\.\\DISPLAY1',
          processName: 'game.exe',
        };
      },
      onForegroundChanged: () => () => {},
    };
  }

  public async getFullscreenState(): Promise<FullscreenState> {
    try {
      const fg = await this.bridge.getForegroundWindow();
      if (!fg) {
        return { state: 'windowed' };
      }

      // Check if window is borderless and matches full resolution
      const WS_CAPTION = 0x00c00000;
      const hasCaption = (fg.style & WS_CAPTION) === WS_CAPTION;

      // In Win32, fullscreen applications have no caption/border and cover the full monitor rect
      if (!hasCaption && fg.rect.width >= 1024 && fg.rect.height >= 720) {
        return {
          state: 'fullscreen',
          displayId: fg.monitorName,
          applicationId: fg.processName,
        };
      }

      return { state: 'windowed' };
    } catch {
      return { state: 'unknown' };
    }
  }

  public onFullscreenChanged(callback: (state: FullscreenState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private async checkState(): Promise<void> {
    const newState = await this.getFullscreenState();
    if (
      newState.state !== this.lastState.state ||
      (newState.state === 'fullscreen' &&
        this.lastState.state === 'fullscreen' &&
        newState.displayId !== this.lastState.displayId)
    ) {
      this.lastState = newState;
      for (const listener of this.listeners) {
        listener(newState);
      }
    }
  }

  public dispose(): void {
    if (this.unsubBridge) {
      this.unsubBridge();
      this.unsubBridge = undefined;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.listeners = [];
  }
}
