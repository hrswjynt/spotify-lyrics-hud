# Display Settings & 3-Line Lyric Centering Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `executing-plans` to execute this plan in single-flow mode.

**Goal:** Implement comprehensive Display Settings (typography, alignment, line spacing, inactive line dimming, highlight theme, HUD background) with an interactive modal, 3-line dead-center lyric layout, and system tray quick toggles.

**Architecture:** Reactive Svelte store `displaySettings` persisted to `localStorage`, wired to `LyricsLine.svelte`, `LyricsScroller.svelte`, and `LyricsHUD.svelte`. Interactive glass `SettingsModal.svelte` opened via gear icon in `TrackHeader.svelte`. Quick display toggles exposed in system tray menu.

**Tech Stack:** Svelte 5, TypeScript, Tailwind CSS v4, Tauri v2 (Rust IPC), Vitest.

---

### Task 1: Display Settings Svelte Store & Unit Tests
**Files:**
- Create: `src/ui/src/stores/display-settings.ts`
- Create: `tests/ui/display-settings.test.ts`

**Step 1: Write the failing test**
In `tests/ui/display-settings.test.ts`, test that `displaySettings` initializes with defaults, persists updates to `localStorage`, allows partial updates via `updateDisplaySettings()`, and can be reset with `resetDisplaySettings()`.

**Step 2: Run test to verify it fails**
`npx vitest run tests/ui/display-settings.test.ts`

**Step 3: Implement minimal code**
In `src/ui/src/stores/display-settings.ts`, implement `DisplaySettings` interface, `DEFAULT_DISPLAY_SETTINGS`, `displaySettings` writable store with `localStorage` persistence, `updateDisplaySettings(partial)`, and `resetDisplaySettings()`.

**Step 4: Run test to verify it passes**
`npx vitest run tests/ui/display-settings.test.ts`

**Step 5: Commit**
`git commit -m "feat(ui): add displaySettings store with localStorage persistence"`

---

### Task 2: 3-Line Vertical Centering & Line Spacing in `LyricsScroller.svelte`
**Files:**
- Modify: `src/ui/src/components/LyricsScroller.svelte`

**Step 1: Implement 3-line sliding window**
- In `LyricsScroller.svelte`, subscribe to `displaySettings`.
- When `lineMode === 'triple'` (or `'single'`), calculate visible slice `[prev, active, next]`.
- Place in a `flex flex-col justify-center items-center h-full` container so active line is mathematically dead-center.
- Apply dynamic gap based on `$displaySettings.lineSpacing`:
  - `compact`: `gap-1`
  - `balanced`: `gap-2.5`
  - `relaxed`: `gap-4`
- Support fallback to full scroller if `lineMode === 'scroller'`.

**Step 2: Verify with tests and build**
`npm run build && npm run build:ui`

**Step 3: Commit**
`git commit -m "feat(ui): implement 3-line dead-center layout and configurable line spacing"`

---

### Task 3: Typography, Alignment, Theme Colors & Dimming in `LyricsLine.svelte`
**Files:**
- Modify: `src/ui/src/components/LyricsLine.svelte`

**Step 1: Consume `displaySettings` in `LyricsLine.svelte`**
- **Alignment:** apply `text-left items-start`, `text-center items-center`, or `text-right items-end`.
- **Font size (Active):**
  - `sm`: `text-lg md:text-xl`
  - `md`: `text-xl md:text-2xl`
  - `lg`: `text-2xl md:text-3xl`
- **Font family:** apply `font-sans`, `font-mono`, or rounded styling.
- **Highlight theme colors:**
  - `emerald`: gradient `#34d399` to `#38bdf8`, solid glow `#34d399`
  - `cyan`: gradient `#38bdf8` to `#818cf8`, solid glow `#38bdf8`
  - `violet`: gradient `#c084fc` to `#f472b6`, solid glow `#c084fc`
  - `white`: gradient `#ffffff` to `#94a3b8`, solid glow `#ffffff`
- **Inactive line opacity:**
  - `subtle`: `opacity-25`
  - `balanced`: `opacity-45`
  - `clear`: `opacity-70`

**Step 2: Verify build**
`npm run build && npm run build:ui`

**Step 3: Commit**
`git commit -m "feat(ui): support configurable typography, alignment, themes, and dimming"`

---

### Task 4: Interactive `SettingsModal.svelte` & Gear Button in Header
**Files:**
- Create: `src/ui/src/components/SettingsModal.svelte`
- Modify: `src/ui/src/components/TrackHeader.svelte`
- Modify: `src/ui/src/components/LyricsHUD.svelte`

**Step 1: Create `SettingsModal.svelte`**
- Design sleek glassmorphism modal with tabs or compact sections:
  1. Tipografi (Ukuran, Jenis Font)
  2. Alignment & Layout (Rata teks, Jumlah baris, Jarak baris)
  3. Warna & Visual (Tema lirik, Redup lirik non-aktif, Background HUD)
- Quick buttons to choose options with immediate live preview.
- Reset to Default button and Close (×) button.

**Step 2: Add Gear Button in `TrackHeader.svelte`**
- Add button next to Karaoke toggle button to toggle `isSettingsOpen`.

**Step 3: Wire into `LyricsHUD.svelte`**
- Show `SettingsModal` when open.
- Apply dynamic HUD background style (`glass`, `minimal`, `solid`) based on `$displaySettings.backgroundStyle`.

**Step 4: Verify build**
`npm run build && npm run build:ui`

**Step 5: Commit**
`git commit -m "feat(ui): add interactive SettingsModal and HUD background themes"`

---

### Task 5: System Tray Quick Settings Submenus
**Files:**
- Modify: `src/system/tray/menu-items.ts`
- Modify: `tests/system/tray-manager.test.ts`

**Step 1: Write test for display settings tray items**
In `tests/system/tray-manager.test.ts`, verify that "Display Settings" submenu exists with options for Alignment, Lines, and Theme.

**Step 2: Update `menu-items.ts`**
Add Display Settings submenu to tray menu.

**Step 3: Verify tests pass**
`npx vitest run tests/system/tray-manager.test.ts`

**Step 4: Commit**
`git commit -m "feat(system): add display settings quick submenu in system tray"`

---

### Task 6: Compilation, Deployment & Live Verification
**Files:**
- Binary: `~/.local/bin/desktop-overlay`
- Tracker: `docs/plans/task.md`

**Step 1: Compile Tauri release binary**
`npm run build && npm run build:ui && npx tauri build --no-bundle`

**Step 2: Deploy to ~/.local/bin/desktop-overlay**
`cp -f src-tauri/target/release/desktop-overlay ~/.local/bin/desktop-overlay`

**Step 3: Live Verification & Screenshot Capture**
- Launch `desktop-overlay`.
- Capture screenshot of 3-line layout (dead-center active lyric).
- Open Settings modal and capture screenshot.
- Change an option (e.g. alignment / theme) and verify live reflection.
- Update `docs/plans/task.md` marking TASK-34 as Completed.
