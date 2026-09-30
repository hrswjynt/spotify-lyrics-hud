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

    const onSelectAlignment = vi.fn();
    const onSelectLineMode = vi.fn();
    const onSelectTheme = vi.fn();

    const menu = buildTrayMenu({
      displays,
      currentDisplayId: 'HDMI-A-1',
      inputMode: 'passthrough',
      visible: true,
      currentAnchor: 'bottom-center',
      displaySettings: {
        alignment: 'center',
        lineMode: 'triple',
        highlightTheme: 'emerald',
      },
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
        onSelectAlignment,
        onSelectLineMode,
        onSelectTheme,
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

    // 4. Check Karaoke Mode checkbox
    const karaokeItem = menu.items.find((i) => i.id === 'karaoke_mode');
    expect(karaokeItem).toBeDefined();
    expect(karaokeItem?.checked).toBe(true);
    expect(karaokeItem?.shortcut).toBe('Ctrl+Shift+K');

    // 5. Check Display Settings submenu
    const settingsSubmenu = menu.items.find((i) => i.id === 'display_settings_submenu');
    expect(settingsSubmenu).toBeDefined();
    expect(settingsSubmenu?.children?.length).toBe(3);

    // Check Alignment child
    const alignSub = settingsSubmenu?.children?.find((c) => c.id === 'alignment_submenu');
    expect(alignSub?.children).toHaveLength(3);
    const leftItem = alignSub?.children?.find((c) => c.id === 'align_left');
    leftItem?.action?.();
    expect(onSelectAlignment).toHaveBeenCalledWith('left');

    // Check Line Mode child
    const modeSub = settingsSubmenu?.children?.find((c) => c.id === 'line_mode_submenu');
    expect(modeSub?.children).toHaveLength(3);
    const scrollerItem = modeSub?.children?.find((c) => c.id === 'lines_scroller');
    scrollerItem?.action?.();
    expect(onSelectLineMode).toHaveBeenCalledWith('scroller');

    // Check Theme child
    const themeSub = settingsSubmenu?.children?.find((c) => c.id === 'theme_submenu');
    expect(themeSub?.children).toHaveLength(4);
    const cyanItem = themeSub?.children?.find((c) => c.id === 'theme_cyan');
    cyanItem?.action?.();
    expect(onSelectTheme).toHaveBeenCalledWith('cyan');
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
