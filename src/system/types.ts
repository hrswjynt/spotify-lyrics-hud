import { Anchor, Display } from '../core/types.js';

export type HotkeyAction =
  | 'toggle_click_through'
  | 'toggle_visibility'
  | 'cycle_monitor'
  | 'play_pause'
  | 'next_track'
  | 'prev_track'
  | 'toggle_karaoke'
  | 'toggle-karaoke';

export interface HotkeyBinding {
  accelerator: string; // e.g. "Ctrl+Shift+X"
  action: HotkeyAction;
  description: string;
}

export type TrayMenuItemType = 'normal' | 'separator' | 'checkbox' | 'submenu';

export interface TrayMenuItem {
  id: string;
  label: string;
  type?: TrayMenuItemType;
  checked?: boolean;
  enabled?: boolean;
  shortcut?: string;
  children?: TrayMenuItem[];
  action?: () => void | Promise<void>;
}

export interface TrayMenu {
  title?: string;
  tooltip?: string;
  items: TrayMenuItem[];
}

export interface SystemControllerConfig {
  defaultHotkeys?: HotkeyBinding[];
}
