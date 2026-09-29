import * as net from 'net';
import * as path from 'path';
import { Display, FullscreenState, Point } from '../../core/types.js';

export interface HyprlandMonitorJSON {
  id: number;
  name: string;
  description: string;
  make: string;
  model: string;
  serial: string;
  width: number;
  height: number;
  refreshRate: number;
  x: number;
  y: number;
  activeWorkspace: { id: number; name: string };
  specialWorkspace: { id: number; name: string };
  reserved: [number, number, number, number]; // [left, top, right, bottom]
  scale: number;
  transform: number;
  focused: boolean;
  dpmsStatus: boolean;
  disabled: boolean;
}

export interface HyprlandActiveWindowJSON {
  address: string;
  mapped: boolean;
  hidden: boolean;
  at: [number, number];
  size: [number, number];
  workspace: { id: number; name: string };
  floating: boolean;
  pseudo: boolean;
  monitor: number;
  class: string;
  title: string;
  initialClass: string;
  initialTitle: string;
  pid: number;
  xwayland: boolean;
  pinned: boolean;
  fullscreen: boolean;
  fullscreenClient: number;
  grouped: any[];
  tags: string[];
  swallowing: string;
  focusHistoryID: number;
}

export interface HyprlandEventListener {
  onFullscreen?: (isFullscreen: boolean, monitorName?: string) => void;
  onFocusedMonitor?: (monitorName: string) => void;
  onMonitorChanged?: () => void;
  onActiveWindow?: () => void;
}

/**
 * Native Hyprland UNIX domain socket IPC client.
 * Connects to .socket.sock (commands) and .socket2.sock (events).
 */
export class HyprlandIPC {
  private signature: string | null = null;
  private socketDir: string | null = null;
  private eventSocket: net.Socket | null = null;
  private listeners: HyprlandEventListener[] = [];
  private isConnected = false;
  private buffer = '';

  constructor() {
    this.signature = process.env.HYPRLAND_INSTANCE_SIGNATURE || null;
    const xdgRuntime = process.env.XDG_RUNTIME_DIR || '/tmp';
    if (this.signature) {
      this.socketDir = path.join(xdgRuntime, 'hypr', this.signature);
    }
  }

  public isAvailable(): boolean {
    return Boolean(this.signature && this.socketDir);
  }

  public getSignature(): string | null {
    return this.signature;
  }

  /**
   * Sends a request to Hyprland's command socket (.socket.sock)
   */
  public async sendCommand(cmd: string): Promise<string> {
    if (!this.isAvailable() || !this.socketDir) {
      throw new Error('Hyprland IPC is not available in current environment.');
    }

    const socketPath = path.join(this.socketDir, '.socket.sock');

    return new Promise((resolve, reject) => {
      const client = net.createConnection(socketPath, () => {
        client.write(cmd);
      });

      let response = '';

      client.on('data', (data) => {
        response += data.toString('utf-8');
      });

      client.on('end', () => {
        resolve(response);
      });

      client.on('error', (err) => {
        reject(new Error(`Hyprland command socket error: ${err.message}`));
      });
    });
  }

  /**
   * Starts listening to real-time events on .socket2.sock
   */
  public connectEventStream(): void {
    if (!this.isAvailable() || !this.socketDir || this.isConnected) {
      return;
    }

    const socketPath = path.join(this.socketDir, '.socket2.sock');

    try {
      this.eventSocket = net.createConnection(socketPath, () => {
        this.isConnected = true;
        this.eventSocket?.unref();
      });

      this.eventSocket.on('data', (chunk) => {
        this.buffer += chunk.toString('utf-8');
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.trim()) {
            this.handleEventLine(line.trim());
          }
        }
      });

      this.eventSocket.on('error', (err) => {
        this.isConnected = false;
      });

      this.eventSocket.on('close', () => {
        this.isConnected = false;
      });
    } catch (e) {
      this.isConnected = false;
    }
  }

  private handleEventLine(line: string): void {
    const separatorIdx = line.indexOf('>>');
    if (separatorIdx === -1) return;

    const eventName = line.slice(0, separatorIdx);
    const eventData = line.slice(separatorIdx + 2);

    switch (eventName) {
      case 'fullscreen': {
        const isFs = eventData === '1';
        for (const l of this.listeners) {
          l.onFullscreen?.(isFs);
        }
        break;
      }
      case 'focusedmon': {
        const [monName] = eventData.split(',');
        for (const l of this.listeners) {
          l.onFocusedMonitor?.(monName);
        }
        break;
      }
      case 'monitoradded':
      case 'monitorremoved': {
        for (const l of this.listeners) {
          l.onMonitorChanged?.();
        }
        break;
      }
      case 'activewindowv2':
      case 'activewindow': {
        for (const l of this.listeners) {
          l.onActiveWindow?.();
        }
        break;
      }
    }
  }

  public addListener(listener: HyprlandEventListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public async getMonitors(): Promise<Display[]> {
    const raw = await this.sendCommand('j/monitors');
    const list = JSON.parse(raw) as HyprlandMonitorJSON[];

    return list.map((mon) => {
      // reserved is [left, top, right, bottom]
      const reserved = mon.reserved || [0, 0, 0, 0];
      const workArea = {
        x: mon.x + reserved[0],
        y: mon.y + reserved[1],
        width: Math.max(100, mon.width - reserved[0] - reserved[2]),
        height: Math.max(100, mon.height - reserved[1] - reserved[3]),
      };

      return {
        id: mon.name,
        name: mon.description || mon.name,
        bounds: {
          x: mon.x,
          y: mon.y,
          width: mon.width,
          height: mon.height,
        },
        workArea,
        scaleFactor: mon.scale || 1.0,
        primary: mon.id === 0 || mon.focused,
      };
    });
  }

  public async getActiveWindow(): Promise<HyprlandActiveWindowJSON | null> {
    try {
      const raw = await this.sendCommand('j/activewindow');
      const data = JSON.parse(raw);
      if (!data || Object.keys(data).length === 0 || !data.class) {
        return null;
      }
      return data as HyprlandActiveWindowJSON;
    } catch {
      return null;
    }
  }

  public async getCursorPos(): Promise<Point | null> {
    try {
      const raw = await this.sendCommand('j/cursorpos');
      return JSON.parse(raw) as Point;
    } catch {
      return null;
    }
  }

  public async getFullscreenState(): Promise<FullscreenState> {
    const win = await this.getActiveWindow();
    if (!win) {
      return { state: 'windowed' };
    }

    if (win.fullscreen) {
      // Match monitor ID to monitor name
      const monitors = await this.getMonitors();
      const targetMon = monitors[win.monitor] || monitors[0];

      return {
        state: 'fullscreen',
        displayId: targetMon ? targetMon.id : undefined,
        applicationId: win.class || win.initialClass,
      };
    }

    return { state: 'windowed' };
  }

  public dispose(): void {
    if (this.eventSocket) {
      this.eventSocket.destroy();
      this.eventSocket = null;
    }
    this.listeners = [];
    this.isConnected = false;
  }
}
