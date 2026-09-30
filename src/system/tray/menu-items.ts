import { Anchor, Display, InputMode } from '../../core/types.js';
import { SpotifyTrack } from '../../data/types.js';
import { TrayMenu, TrayMenuItem } from '../types.js';

export interface TrayDisplaySettings {
  alignment?: 'left' | 'center' | 'right';
  lineMode?: 'single' | 'triple' | 'scroller';
  highlightTheme?: 'emerald' | 'cyan' | 'violet' | 'white';
}

export interface TrayMenuCallbacks {
  onToggleClickThrough: () => void;
  onToggleVisibility: () => void;
  onToggleKaraoke?: () => void;
  onSelectDisplay: (displayId: string) => void;
  onSelectAnchor: (anchor: Anchor) => void;
  onSelectAlignment?: (alignment: 'left' | 'center' | 'right') => void;
  onSelectLineMode?: (mode: 'single' | 'triple' | 'scroller') => void;
  onSelectTheme?: (theme: 'emerald' | 'cyan' | 'violet' | 'white') => void;
  onPlayPause: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onQuit: () => void;
}

export interface TrayMenuBuildOptions {
  displays: Display[];
  currentDisplayId: string;
  inputMode: InputMode;
  visible: boolean;
  currentAnchor: Anchor;
  karaokeMode?: boolean;
  displaySettings?: TrayDisplaySettings;
  isPlaying: boolean;
  currentTrack?: SpotifyTrack | null;
  callbacks: TrayMenuCallbacks;
}

const ALL_ANCHORS: Array<{ id: Anchor; label: string }> = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'center-left', label: 'Center Left' },
  { id: 'center', label: 'Center' },
  { id: 'center-right', label: 'Center Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

/**
 * Builds dynamic system tray menu items based on active monitors, overlay state, and Spotify track.
 */
export function buildTrayMenu(options: TrayMenuBuildOptions): TrayMenu {
  const {
    displays,
    currentDisplayId,
    inputMode,
    visible,
    currentAnchor,
    karaokeMode,
    isPlaying,
    currentTrack,
    callbacks,
  } = options;

  const items: TrayMenuItem[] = [];

  // 1. Current track title header
  if (currentTrack) {
    items.push({
      id: 'track_info',
      label: `♫ ${currentTrack.title} - ${currentTrack.artist}`,
      enabled: false,
    });
  } else {
    items.push({
      id: 'track_info',
      label: '♫ Spotify Overlay (Idle)',
      enabled: false,
    });
  }

  items.push({ id: 'sep_1', label: '', type: 'separator' });

  // 2. Click-through toggle
  items.push({
    id: 'click_through',
    label: 'Click-Through (Passthrough)',
    type: 'checkbox',
    checked: inputMode === 'passthrough',
    shortcut: 'Ctrl+Shift+X',
    action: callbacks.onToggleClickThrough,
  });

  // 3. Visibility toggle
  items.push({
    id: 'visibility',
    label: 'Visible',
    type: 'checkbox',
    checked: visible,
    shortcut: 'Ctrl+Shift+H',
    action: callbacks.onToggleVisibility,
  });

  // 3b. Karaoke Wipe mode toggle
  items.push({
    id: 'karaoke_mode',
    label: karaokeMode !== false ? '🎤 Karaoke Wipe (ON)' : '🎤 Karaoke Wipe (OFF)',
    type: 'checkbox',
    checked: karaokeMode !== false,
    shortcut: 'Ctrl+Shift+K',
    action: callbacks.onToggleKaraoke,
  });

  items.push({ id: 'sep_2', label: '', type: 'separator' });

  // 4. Displays submenu
  const displayItems: TrayMenuItem[] = displays.map((d) => ({
    id: `display_${d.id}`,
    label: `${d.name || d.id} (${d.bounds.width}x${d.bounds.height})`,
    type: 'checkbox',
    checked: d.id === currentDisplayId,
    action: () => callbacks.onSelectDisplay(d.id),
  }));

  items.push({
    id: 'displays_submenu',
    label: 'Target Display',
    type: 'submenu',
    children: displayItems,
  });

  // 5. Anchor positioning submenu
  const anchorItems: TrayMenuItem[] = ALL_ANCHORS.map((a) => ({
    id: `anchor_${a.id}`,
    label: a.label,
    type: 'checkbox',
    checked: a.id === currentAnchor,
    action: () => callbacks.onSelectAnchor(a.id),
  }));

  items.push({
    id: 'anchor_submenu',
    label: 'Position Anchor',
    type: 'submenu',
    children: anchorItems,
  });

  // 5b. Display Settings submenu
  const alignment = options.displaySettings?.alignment || 'center';
  const lineMode = options.displaySettings?.lineMode || 'three';
  const highlightTheme = options.displaySettings?.highlightTheme || 'emerald';

  const alignmentItems: TrayMenuItem[] = [
    {
      id: 'align_left',
      label: 'Left (Rata Kiri)',
      type: 'checkbox',
      checked: alignment === 'left',
      action: () => callbacks.onSelectAlignment?.('left'),
    },
    {
      id: 'align_center',
      label: 'Center (Rata Tengah)',
      type: 'checkbox',
      checked: alignment === 'center',
      action: () => callbacks.onSelectAlignment?.('center'),
    },
    {
      id: 'align_right',
      label: 'Right (Rata Kanan)',
      type: 'checkbox',
      checked: alignment === 'right',
      action: () => callbacks.onSelectAlignment?.('right'),
    },
  ];

  const lineModeItems: TrayMenuItem[] = [
    {
      id: 'lines_single',
      label: '1 Baris (Focus)',
      type: 'checkbox',
      checked: lineMode === 'single',
      action: () => callbacks.onSelectLineMode?.('single'),
    },
    {
      id: 'lines_three',
      label: '3 Baris (Dead Center)',
      type: 'checkbox',
      checked: lineMode === 'triple',
      action: () => callbacks.onSelectLineMode?.('triple'),
    },
    {
      id: 'lines_scroller',
      label: 'Continuous Scroller',
      type: 'checkbox',
      checked: lineMode === 'scroller',
      action: () => callbacks.onSelectLineMode?.('scroller'),
    },
  ];

  const themeItems: TrayMenuItem[] = [
    {
      id: 'theme_emerald',
      label: 'Spotify Emerald (Hijau)',
      type: 'checkbox',
      checked: highlightTheme === 'emerald',
      action: () => callbacks.onSelectTheme?.('emerald'),
    },
    {
      id: 'theme_cyan',
      label: 'Sky Cyan (Biru Langit)',
      type: 'checkbox',
      checked: highlightTheme === 'cyan',
      action: () => callbacks.onSelectTheme?.('cyan'),
    },
    {
      id: 'theme_violet',
      label: 'Neon Violet (Ungu)',
      type: 'checkbox',
      checked: highlightTheme === 'violet',
      action: () => callbacks.onSelectTheme?.('violet'),
    },
    {
      id: 'theme_white',
      label: 'Pure White (Putih Bersih)',
      type: 'checkbox',
      checked: highlightTheme === 'white',
      action: () => callbacks.onSelectTheme?.('white'),
    },
  ];

  items.push({
    id: 'display_settings_submenu',
    label: 'Pengaturan Tampilan (Display)',
    type: 'submenu',
    children: [
      {
        id: 'alignment_submenu',
        label: 'Rata Teks (Alignment)',
        type: 'submenu',
        children: alignmentItems,
      },
      {
        id: 'line_mode_submenu',
        label: 'Mode Baris (Layout)',
        type: 'submenu',
        children: lineModeItems,
      },
      {
        id: 'theme_submenu',
        label: 'Tema Highlight (Warna)',
        type: 'submenu',
        children: themeItems,
      },
    ],
  });

  items.push({ id: 'sep_3', label: '', type: 'separator' });

  // 6. Spotify controls
  items.push({
    id: 'spotify_play_pause',
    label: isPlaying ? 'Pause Spotify' : 'Play Spotify',
    shortcut: 'Ctrl+Shift+Space',
    action: callbacks.onPlayPause,
  });

  items.push({
    id: 'spotify_next',
    label: 'Next Track',
    action: callbacks.onNextTrack,
  });

  items.push({
    id: 'spotify_prev',
    label: 'Previous Track',
    action: callbacks.onPrevTrack,
  });

  items.push({ id: 'sep_4', label: '', type: 'separator' });

  // 7. Quit
  items.push({
    id: 'quit',
    label: 'Quit Overlay',
    action: callbacks.onQuit,
  });

  return {
    title: 'Spotify Lyrics Overlay',
    tooltip: currentTrack
      ? `${currentTrack.title} - ${currentTrack.artist}`
      : 'Spotify Lyrics Overlay',
    items,
  };
}
