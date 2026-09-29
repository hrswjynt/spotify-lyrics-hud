import { Display, DisplayProvider } from '../../core/types.js';
import { NativeMonitorDto, TauriInvokeFn } from './types.js';

export interface TauriDisplayProviderOptions {
  invoke?: TauriInvokeFn;
}

export class TauriDisplayProvider implements DisplayProvider {
  private invoke: TauriInvokeFn;
  private changeListeners: Array<(displays: Display[]) => void> = [];

  constructor(options?: TauriDisplayProviderOptions) {
    this.invoke = options?.invoke || (async (cmd, args) => {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        return invoke(cmd, args);
      }
      return [];
    });
  }

  public async getDisplays(): Promise<Display[]> {
    const rawMonitors: NativeMonitorDto[] = await this.invoke('get_native_monitors');
    if (!rawMonitors || !Array.isArray(rawMonitors)) {
      return [];
    }

    return rawMonitors.map((mon) => ({
      id: mon.id,
      name: mon.name,
      bounds: { ...mon.bounds },
      workArea: { ...mon.workArea },
      scaleFactor: mon.scaleFactor,
      primary: mon.primary,
    }));
  }

  public async getPrimaryDisplay(): Promise<Display> {
    const displays = await this.getDisplays();
    const primary = displays.find((d) => d.primary);
    if (primary) return primary;
    if (displays.length > 0) return displays[0];

    return {
      id: 'default',
      name: 'Default Display',
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 0, width: 1920, height: 1080 },
      scaleFactor: 1.0,
      primary: true,
    };
  }

  public async getActiveDisplay(): Promise<Display | undefined> {
    return this.getPrimaryDisplay();
  }

  public onDisplaysChanged(callback: (displays: Display[]) => void): () => void {
    this.changeListeners.push(callback);
    return () => {
      this.changeListeners = this.changeListeners.filter((cb) => cb !== callback);
    };
  }

  public dispose(): void {
    this.changeListeners = [];
  }
}
