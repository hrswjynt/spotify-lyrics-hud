# Design Document: Display Settings & 3-Line Centered Lyric Layout

**Date:** 2026-09-30  
**Status:** Approved  
**Topic:** Essential Display Settings Panel & 3-Line Vertical Centering Layout

---

## 1. Problem Statement & Motivation

1. **Customization & Usability:** Users listen in diverse desktop environments (gaming, coding, ambient work) and have different visual preferences for font size, font family, text alignment, highlight color, and HUD background transparency.
2. **Lyric Vertical Centering:** Continuous scroll containers can suffer from vertical offset drift when lines wrap or font sizes vary. A 3-line sliding window layout (`[previous, active, next]`) guarantees that the active lyric line (index `[1]`) is always 100% vertically centered via CSS flexbox, while maintaining sleek, non-distracting past and upcoming context.
3. **Inactive Line Legibility:** Users need control over how dimmed the upcoming and past lines appear (e.g. subtle 25% for high focus vs 70% for reading ahead) and the spacing between lines.

---

## 2. Architecture & Components

```
+--------------------------------------------------------------------------+
| System Tray Menu (Quick Toggles: Alignment, Lines, Theme)                |
+--------------------------------------------------------------------------+
                               |
                      updates store state
                               v
+--------------------------------------------------------------------------+
| Svelte Reactive Store: displaySettings (localStorage persisted)          |
+--------------------------------------------------------------------------+
      |                   |                     |                    |
      v                   v                     v                    v
+------------------+ +-------------------+ +------------------+ +---------------+
| LyricsHUD.svelte | | TrackHeader.svelte| |LyricsScroller.sve| |LyricsLine.sve |
| - Background     | | - Gear (⚙️) Button| | - 3-line window  | | - Font size   |
|   style (glass / | | - Karaoke button  | | - Vertical gap   | | - Alignment   |
|   minimal /      | | - Play / Pause    | | - Dead-center    | | - Highlight   |
|   solid)         | +-------------------+ |   flex layout    | |   color theme |
| - Settings Modal |                       +------------------+ | - Dimming     |
+------------------+                                            +---------------+
```

---

## 3. Data Model & State (`src/ui/src/stores/display-settings.ts`)

```typescript
export type FontSizeOption = 'sm' | 'md' | 'lg';
export type FontFamilyOption = 'sans' | 'rounded' | 'mono';
export type TextAlignmentOption = 'left' | 'center' | 'right';
export type LineModeOption = 'single' | 'triple' | 'scroller';
export type LineSpacingOption = 'compact' | 'balanced' | 'relaxed';
export type HighlightThemeOption = 'emerald' | 'cyan' | 'violet' | 'white';
export type InactiveOpacityOption = 'subtle' | 'balanced' | 'clear';
export type BackgroundStyleOption = 'glass' | 'minimal' | 'solid';

export interface DisplaySettings {
  fontSize: FontSizeOption;           // sm (text-lg), md (text-2xl), lg (text-3xl)
  fontFamily: FontFamilyOption;       // sans, rounded, mono
  alignment: TextAlignmentOption;     // left, center, right
  lineMode: LineModeOption;           // single (1 line), triple (3 lines), scroller (all)
  lineSpacing: LineSpacingOption;     // compact (gap-1), balanced (gap-2.5), relaxed (gap-4)
  highlightTheme: HighlightThemeOption; // emerald, cyan, violet, white
  inactiveOpacity: InactiveOpacityOption; // subtle (25%), balanced (45%), clear (70%)
  backgroundStyle: BackgroundStyleOption; // glass, minimal, solid
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
};
```

---

## 4. Component Design & Interactivity

### 4.1 Settings Drawer / Modal (`SettingsModal.svelte`)
- Opens when clicking the ⚙️ icon in `TrackHeader.svelte`.
- Renders as a sleek, semi-transparent frosted glass sheet sliding in smoothly over the HUD.
- Features categorized segmented controls / pills:
  - **Tipografi:** Font Size (Kecil / Sedang / Besar) & Font Family (Modern Sans / Rounded / Monospace).
  - **Tata Letak:** Alignment (Kiri / Tengah / Kanan) & Jumlah Baris (1 Baris / 3 Baris / Scroller).
  - **Spasi & Keredupan:** Jarak Baris (Rapat / Normal / Renggang) & Redup Lirik Non-Aktif (25% / 45% / 70%).
  - **Tema Visual:** Warna Lirik (Spotify Emerald / Cyan / Violet / Putih) & Background HUD (Glass / Minimal / Solid).
- Real-time updates: changing an option reflects immediately on the underlying lyrics and persists to `localStorage`.
- Includes a "Reset Default" button and a clean [Tutup] button.

### 4.2 3-Line Vertical Centering (`LyricsScroller.svelte`)
When `lineMode === 'triple'` (default):
- Computes `[previousLine, currentActiveLine, nextLine]` based on `$activeLineIndex`.
- Uses a CSS flexbox container:
  ```svelte
  <div class="w-full flex flex-col justify-center items-center h-full {spacingClass}">
  ```
- Index `[1]` is mathematically and visually guaranteed to be dead-center vertically.
- At the start of a song (`activeIdx === 0`), line `[0]` renders as an invisible height-matched spacer.
- At the end of a song, line `[2]` renders as an invisible height-matched spacer.

### 4.3 Typography & Highlight Themes (`LyricsLine.svelte`)
- **Themes:**
  - `emerald`: `#34d399` to `#38bdf8` gradient wipe / `#34d399` solid glow.
  - `cyan`: `#38bdf8` to `#818cf8` gradient wipe / `#38bdf8` solid glow.
  - `violet`: `#c084fc` to `#f472b6` gradient wipe / `#c084fc` solid glow.
  - `white`: `#ffffff` to `#94a3b8` gradient wipe / `#ffffff` solid glow.
- **Alignment:** Dynamically applies `text-left items-start`, `text-center items-center`, or `text-right items-end`.
- **Inactive Lines:** Opacity class dynamically set to `opacity-25`, `opacity-45`, or `opacity-70`.

### 4.4 HUD Glassmorphism (`LyricsHUD.svelte`)
- `glass`: standard backdrop blur with semi-transparent dark tint (`bg-black/60 backdrop-blur-md`).
- `minimal`: ultra-clean transparent HUD (`bg-black/15 backdrop-blur-xs border-transparent`).
- `solid`: deep opaque dark panel (`bg-[#121212] border-white/10`).

---

## 5. Verification Plan

1. **Automated Unit Tests:**
   - Store unit tests in `tests/ui/display-settings.test.ts` verifying default values, updating each property, persistence, and reset.
   - Hotkey and system tray tests in `tests/system/`.
2. **TypeScript & Vite Compilation:**
   - `npm run build && npm run build:ui` passing with zero errors.
3. **Live UI Verification via Tauri:**
   - Launch native desktop overlay.
   - Take `grim` screenshots of:
     - 3-Line centered layout in action.
     - Settings modal opened via gear button.
     - Custom typography / alignment / theme applied in real time.
