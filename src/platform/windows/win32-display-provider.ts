import { Display, DisplayProvider, Rect } from '../../core/types.js';

export interface Win32MonitorInfo {
  hMonitor: number | bigint;
  deviceName: string;
  rcMonitor: Rect;
  rcWork: Rect;
  isPrimary: boolean;
  dpiScale: number;
}

export interface Win32DisplayNativeBridge {
  enumDisplayMonitors(): Promise<Win32MonitorInfo[]>;
  onDisplayChangeMessage(callback: () => void): () => void;
}

export class Win32DisplayProvider implements DisplayProvider {
  private bridge: Win32DisplayNativeBridge;
  private cachedDisplays: Display[] = [];
  private listeners: Array<(displays: Display[]) => void> = [];
  private unsubBridge?: () => void;

  constructor(bridge?: Win32DisplayNativeBridge) {
    this.bridge = bridge || this.createDefaultBridge();

    this.unsubBridge = this.bridge.onDisplayChangeMessage(async () => {
      await this.refresh();
    });
  }

  private createDefaultBridge(): Win32DisplayNativeBridge {
    // Default fallback simulating dual monitor on Windows:
    // Display 1: Primary at 0, 0
    // Display 2: Secondary to the left at -1920, 0
    return {
      enumDisplayMonitors: async () => [
        {
          hMonitor: 0x10001,
          deviceName: '\\\\.\\DISPLAY1',
          rcMonitor: { x: 0, y: 0, width: 1920, height: 1080 },
          rcWork: { x: 0, y: 0, width: 1920, height: 1040 }, // Taskbar 40px at bottom
          isPrimary: true,
          dpiScale: 1.0,
        },
        {
          hMonitor: 0x10002,
          deviceName: '\\\\.\\DISPLAY2',
          rcMonitor: { x: -1920, y: 0, width: 1920, height: 1080 },
          rcWork: { x: -1920, y: 0, width: 1920, height: 1080 },
          isPrimary: false,
          dpiScale: 1.0,
        },
      ],
      onDisplayChangeMessage: () => () => {},
    };
  }

  public async getDisplays(): Promise<Display[]> {
    try {
      const winMonitors = await this.bridge.enumDisplayMonitors();
      this.cachedDisplays = winMonitors.map((m) => ({
        id: m.deviceName,
        name: `Windows Display (${m.deviceName})`,
        bounds: { ...m.rcMonitor },
        workArea: { ...m.rcWork },
        scaleFactor: m.dpiScale,
        primary: m.isPrimary,
      }));
      return [...this.cachedDisplays];
    } catch {
      return [...this.cachedDisplays];
    }
  }

  public async getPrimaryDisplay(): Promise<Display> {
    const displays = await this.getDisplays();
    return displays.find((d) => d.primary) || displays[0];
  }

  public async getActiveDisplay(): Promise<Display | undefined> {
    const displays = await this.getDisplays();
    return displays.find((d) => d.primary) || displays[0];
  }

  public onDisplaysChanged(callback: (displays: Display[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private async refresh(): Promise<void> {
    const displays = await this.getDisplays();
    for (const listener of this.listeners) {
      listener(displays);
    }
  }

  public dispose(): void {
    if (this.unsubBridge) {
      this.unsubBridge();
      this.unsubBridge = undefined;
    }
    this.listeners = [];
  }
}
