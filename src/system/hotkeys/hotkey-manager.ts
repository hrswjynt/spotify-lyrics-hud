import { HotkeyAction, HotkeyBinding } from '../types.js';

export type HotkeyHandler = () => void | Promise<void>;

/**
 * Normalizes an accelerator string into a canonical representation
 * e.g. "ctrl + shift + x" -> "Ctrl+Shift+X"
 */
export function normalizeAccelerator(accelerator: string): string {
  const parts = accelerator
    .split('+')
    .map((p) => p.trim())
    .filter(Boolean);

  const modifiers: string[] = [];
  let key = '';

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'ctrl' || lower === 'control' || lower === 'commandorcontrol') {
      modifiers.push('Ctrl');
    } else if (lower === 'shift') {
      modifiers.push('Shift');
    } else if (lower === 'alt' || lower === 'option') {
      modifiers.push('Alt');
    } else if (lower === 'super' || lower === 'meta' || lower === 'cmd' || lower === 'command') {
      modifiers.push('Super');
    } else {
      key = part.toUpperCase();
    }
  }

  // Deduplicate and sort modifiers for stable comparison
  const uniqueModifiers = Array.from(new Set(modifiers)).sort();
  if (key) {
    uniqueModifiers.push(key);
  }

  return uniqueModifiers.join('+');
}

export class HotkeyManager {
  private registry = new Map<
    string,
    {
      binding: HotkeyBinding;
      handler?: HotkeyHandler;
    }
  >();

  public register(binding: HotkeyBinding, handler?: HotkeyHandler): void {
    const normalized = normalizeAccelerator(binding.accelerator);
    this.registry.set(normalized, {
      binding: {
        ...binding,
        accelerator: normalized,
      },
      handler,
    });
  }

  public unregister(accelerator: string): void {
    const normalized = normalizeAccelerator(accelerator);
    this.registry.delete(normalized);
  }

  public setHandler(actionOrAccelerator: string | HotkeyAction, handler: HotkeyHandler): void {
    // Check by normalized accelerator
    const normalized = normalizeAccelerator(actionOrAccelerator);
    const entry = this.registry.get(normalized);
    if (entry) {
      entry.handler = handler;
      return;
    }

    // Check by action name
    for (const item of this.registry.values()) {
      if (item.binding.action === actionOrAccelerator) {
        item.handler = handler;
      }
    }
  }

  public async trigger(acceleratorOrAction: string | HotkeyAction): Promise<boolean> {
    const normalized = normalizeAccelerator(acceleratorOrAction);
    const byAcc = this.registry.get(normalized);
    if (byAcc && byAcc.handler) {
      await byAcc.handler();
      return true;
    }

    // Search by action
    for (const item of this.registry.values()) {
      if (item.binding.action === acceleratorOrAction && item.handler) {
        await item.handler();
        return true;
      }
    }

    return false;
  }

  public getBindings(): HotkeyBinding[] {
    return Array.from(this.registry.values()).map((v) => ({ ...v.binding }));
  }

  public registerDefaultBindings(): void {
    this.register({
      accelerator: 'Ctrl+Shift+X',
      action: 'toggle_click_through',
      description: 'Toggle Click-Through / Interactivity',
    });

    this.register({
      accelerator: 'Ctrl+Shift+H',
      action: 'toggle_visibility',
      description: 'Hide / Show Overlay HUD',
    });

    this.register({
      accelerator: 'Ctrl+Shift+M',
      action: 'cycle_monitor',
      description: 'Cycle Overlay to Next Monitor',
    });

    this.register({
      accelerator: 'Ctrl+Shift+Space',
      action: 'play_pause',
      description: 'Toggle Spotify Play/Pause',
    });

    this.register({
      accelerator: 'Ctrl+Shift+K',
      action: 'toggle_karaoke',
      description: 'Toggle Karaoke Wipe Animation',
    });
  }

  public dispose(): void {
    this.registry.clear();
  }
}
