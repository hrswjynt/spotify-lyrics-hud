import { describe, expect, it, beforeEach } from 'vitest';
import {
  displaySettings,
  DEFAULT_DISPLAY_SETTINGS,
  updateDisplaySettings,
  resetDisplaySettings,
} from '../../src/ui/src/stores/display-settings.js';

describe('displaySettings Store', () => {
  beforeEach(() => {
    resetDisplaySettings();
  });

  it('initializes with default settings', () => {
    let current: any;
    const unsub = displaySettings.subscribe((val) => {
      current = val;
    });
    unsub();

    expect(current).toEqual(DEFAULT_DISPLAY_SETTINGS);
    expect(current.fontSize).toBe('md');
    expect(current.fontFamily).toBe('sans');
    expect(current.alignment).toBe('center');
    expect(current.lineMode).toBe('triple');
    expect(current.lineSpacing).toBe('balanced');
    expect(current.highlightTheme).toBe('emerald');
    expect(current.inactiveOpacity).toBe('balanced');
    expect(current.backgroundStyle).toBe('glass');
  });

  it('updates specific settings and preserves others', () => {
    updateDisplaySettings({
      fontSize: 'lg',
      alignment: 'left',
      highlightTheme: 'cyan',
    });

    let current: any;
    const unsub = displaySettings.subscribe((val) => {
      current = val;
    });
    unsub();

    expect(current.fontSize).toBe('lg');
    expect(current.alignment).toBe('left');
    expect(current.highlightTheme).toBe('cyan');
    expect(current.fontFamily).toBe('sans'); // preserved
    expect(current.lineMode).toBe('triple'); // preserved
  });

  it('supports right and center alignments seamlessly', () => {
    updateDisplaySettings({ alignment: 'right' });
    let current: any;
    let unsub = displaySettings.subscribe((val) => {
      current = val;
    });
    unsub();
    expect(current.alignment).toBe('right');

    updateDisplaySettings({ alignment: 'center' });
    unsub = displaySettings.subscribe((val) => {
      current = val;
    });
    unsub();
    expect(current.alignment).toBe('center');
  });

  it('resets to default settings cleanly', () => {
    updateDisplaySettings({
      fontSize: 'sm',
      fontFamily: 'mono',
      lineMode: 'single',
      scale: '0.75',
    });

    resetDisplaySettings();

    let current: any;
    const unsub = displaySettings.subscribe((val) => {
      current = val;
    });
    unsub();

    expect(current).toEqual(DEFAULT_DISPLAY_SETTINGS);
    expect(current.scale).toBe('1');
  });

  it('supports scale presets seamlessly', () => {
    expect(DEFAULT_DISPLAY_SETTINGS.scale).toBe('1');

    for (const s of ['0.5', '0.75', '1', '1.25', '1.5'] as const) {
      updateDisplaySettings({ scale: s });
      let current: any;
      const unsub = displaySettings.subscribe((val) => {
        current = val;
      });
      unsub();
      expect(current.scale).toBe(s);
    }
  });

  it('supports japaneseMode options (dual, romaji, original)', () => {
    expect(DEFAULT_DISPLAY_SETTINGS.japaneseMode).toBe('dual');

    for (const mode of ['dual', 'romaji', 'original'] as const) {
      updateDisplaySettings({ japaneseMode: mode });
      let current: any;
      const unsub = displaySettings.subscribe((val) => {
        current = val;
      });
      unsub();
      expect(current.japaneseMode).toBe(mode);
    }
  });
});
