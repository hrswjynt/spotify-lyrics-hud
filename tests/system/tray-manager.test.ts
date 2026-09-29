import { describe, expect, it, vi } from 'vitest';
import { Display } from '../../src/core/types.js';
import { buildTrayMenu } from '../../src/system/tray/menu-items.js';
import { TrayManager } from '../../src/system/tray/tray-manager.js';

describe('Dynamic Tray Menu Builder & TrayManager', () => {
  const displays: Display[] = [
    {
      id: 'eDP-1',
      name: 'Laptop Screen',
      bounds: { x: 0, y: 1080, width: 1920, height: 1080 },
      workArea: { x: 0, y: 1120, width: 1920, height: 1040 },
      scaleFactor: 1.0,
      primary: false,
    },
    {
      id: 'HDMI-A-1',
      name: 'External Monitor',
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      workArea: { x: 0, y: 40, width: 1920, height: 1040 },
      scaleFactor: 1.0,
      primary: true,
    },
  ];

  it('builds dynamic tray menu containing mode states, monitors, and playback controls', () => {
    const onToggleClickThrough = vi.fn();
    const onSelectDisplay = vi.fn();

    const menu = buildTrayMenu({
      displays,
      currentDisplayId: 'HDMI-A-1',
      inputMode: 'passthrough',
      visible: true,
      currentAnchor: 'bottom-center',
      isPlaying: true,
      currentTrack: {
        title: 'Spotlight',
        artist: 'Marshmello',
        album: 'Spotlight',
        durationMs: 178000,
      },
      callbacks: {
        onToggleClickThrough,
        onToggleVisibility: vi.fn(),
        onSelectDisplay,
        onSelectAnchor: vi.fn(),
        onPlayPause: vi.fn(),
        onNextTrack: vi.fn(),
        onPrevTrack: vi.fn(),
        onQuit: vi.fn(),
      },
    });

    expect(menu.items.length).toBeGreaterThan(5);

    // 1. Check title item
    const trackItem = menu.items.find((i) => i.id === 'track_info');
    expect(trackItem?.label).toContain('Spotlight - Marshmello');

    // 2. Check Click-Through checkbox
    const clickThroughItem = menu.items.find((i) => i.id === 'click_through');
    expect(clickThroughItem?.checked).toBe(true);

    // Click it
    clickThroughItem?.action?.();
    expect(onToggleClickThrough).toHaveBeenCalled();

    // 3. Check Displays submenu
    const displaysSubmenu = menu.items.find((i) => i.id === 'displays_submenu');
    expect(displaysSubmenu?.children).toHaveLength(2);
    expect(displaysSubmenu?.children?.[1].checked).toBe(true); // HDMI-A-1

    // Click first display
    displaysSubmenu?.children?.[0].action?.();
    expect(onSelectDisplay).toHaveBeenCalledWith('eDP-1');
  });

  it('TrayManager manages menu state and event routing', () => {
    const tray = new TrayManager();
    const mockMenu = {
      items: [
        {
          id: 'test_item',
          label: 'Test Item',
          action: vi.fn(),
        },
      ],
    };

    tray.setMenu(mockMenu);
    expect(tray.getMenu()?.items).toHaveLength(1);

    tray.triggerItem('test_item');
    expect(mockMenu.items[0].action).toHaveBeenCalled();
  });
});
