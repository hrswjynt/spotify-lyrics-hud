import { describe, expect, it, vi } from 'vitest';
import { HotkeyManager } from '../../src/system/hotkeys/hotkey-manager.js';

describe('HotkeyManager & Action Dispatcher', () => {
  it('registers hotkey bindings and triggers associated handlers', async () => {
    const manager = new HotkeyManager();
    const handler = vi.fn();

    manager.register(
      {
        accelerator: 'Ctrl+Shift+X',
        action: 'toggle_click_through',
        description: 'Toggle Click-Through',
      },
      handler
    );

    expect(manager.getBindings()).toHaveLength(1);

    // Trigger by accelerator
    await manager.trigger('Ctrl+Shift+X');
    expect(handler).toHaveBeenCalledTimes(1);

    // Trigger by action name
    await manager.trigger('toggle_click_through');
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('normalizes accelerator key combinations (case and spacing)', async () => {
    const manager = new HotkeyManager();
    const handler = vi.fn();

    manager.register(
      {
        accelerator: 'Ctrl + Shift + x',
        action: 'toggle_click_through',
        description: 'Toggle Click-Through',
      },
      handler
    );

    // Trigger with different case / spacing
    await manager.trigger('ctrl+shift+X');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('unregisters hotkey cleanly', async () => {
    const manager = new HotkeyManager();
    const handler = vi.fn();

    manager.register(
      {
        accelerator: 'Ctrl+Shift+H',
        action: 'toggle_visibility',
        description: 'Toggle Visibility',
      },
      handler
    );

    manager.unregister('Ctrl+Shift+H');
    expect(manager.getBindings()).toHaveLength(0);

    await manager.trigger('Ctrl+Shift+H');
    expect(handler).not.toHaveBeenCalled();
  });

  it('registers default standard overlay hotkeys', () => {
    const manager = new HotkeyManager();
    manager.registerDefaultBindings();

    const bindings = manager.getBindings();
    expect(bindings.some((b) => b.action === 'toggle_click_through')).toBe(true);
    expect(bindings.some((b) => b.action === 'toggle_visibility')).toBe(true);
    expect(bindings.some((b) => b.action === 'cycle_monitor')).toBe(true);
  });
});
