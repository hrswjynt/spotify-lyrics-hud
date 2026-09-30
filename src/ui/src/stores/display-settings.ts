import { writable } from 'svelte/store';

export type FontSizeOption = 'sm' | 'md' | 'lg';
export type FontFamilyOption = 'sans' | 'rounded' | 'mono';
export type TextAlignmentOption = 'left' | 'center' | 'right';
export type LineModeOption = 'single' | 'triple' | 'scroller';
export type LineSpacingOption = 'compact' | 'balanced' | 'relaxed';
export type HighlightThemeOption = 'emerald' | 'cyan' | 'violet' | 'white';
export type InactiveOpacityOption = 'subtle' | 'balanced' | 'clear';
export type BackgroundStyleOption = 'glass' | 'minimal' | 'solid';
export type ScaleOption = '0.5' | '0.75' | '1' | '1.25' | '1.5';

export interface DisplaySettings {
  fontSize: FontSizeOption;
  fontFamily: FontFamilyOption;
  alignment: TextAlignmentOption;
  lineMode: LineModeOption;
  lineSpacing: LineSpacingOption;
  highlightTheme: HighlightThemeOption;
  inactiveOpacity: InactiveOpacityOption;
  backgroundStyle: BackgroundStyleOption;
  scale: ScaleOption;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  fontSize: 'md',
  fontFamily: 'sans',
  alignment: 'center',
  lineMode: 'triple',
  lineSpacing: 'balanced',
  highlightTheme: 'emerald',
  inactiveOpacity: 'balanced',
  backgroundStyle: 'glass',
  scale: '1',
};

const STORAGE_KEY = 'overlay_display_settings';

function loadInitialSettings(): DisplaySettings {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_DISPLAY_SETTINGS, ...parsed };
      }
    } catch {}
  }
  return { ...DEFAULT_DISPLAY_SETTINGS };
}

export const displaySettings = writable<DisplaySettings>(loadInitialSettings());

export function updateDisplaySettings(partial: Partial<DisplaySettings>): void {
  displaySettings.update((curr) => {
    const next = { ...curr, ...partial };
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
    }
    return next;
  });
}

export function resetDisplaySettings(): void {
  displaySettings.set({ ...DEFAULT_DISPLAY_SETTINGS });
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}
