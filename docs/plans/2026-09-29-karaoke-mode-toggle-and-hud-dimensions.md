# Karaoke Mode Toggle & HUD Dimensions Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `executing-plans` to execute this plan in single-flow mode.

**Goal:** Implement turn ON/OFF for karaoke gradient wipe (solid glow vs gradient wipe) with hotkey (`Ctrl+Shift+K`), tray menu, and HUD header button, and fix window dimensions to 750x275 so the bottom footer is fully visible.

**Architecture:** Reactive Svelte store `karaokeMode` persisted to `localStorage`, wired to `LyricsLine.svelte` for rendering style, exposed to `TrackHeader.svelte` button, and linked to `SystemController` for global shortcut (`Ctrl+Shift+K`) and native tray menu toggle. Window geometry expanded to 750x275 across Tauri configs and Hyprland window rules.

**Tech Stack:** Svelte 5, TypeScript, Tailwind CSS v4, Tauri v2 (Rust IPC), Hyprland Lua window rules, Vitest.

---

### Task 1: Svelte Store for Karaoke Mode
**Files:**
- Modify: `src/ui/src/stores/playback.ts`
- Test: `tests/ui/stores.test.ts`

**Step 1: Write the failing test**
In `tests/ui/stores.test.ts`, add test verifying `karaokeMode` defaults to true and `toggleKaraokeMode()` toggles its boolean value and persists.

**Step 2: Run test to verify it fails**
`npx vitest run tests/ui/stores.test.ts`

**Step 3: Implement minimal code**
In `src/ui/src/stores/playback.ts`, create `karaokeMode = writable<boolean>(...)` and `toggleKaraokeMode(): boolean`.

**Step 4: Run test to verify it passes**
`npx vitest run tests/ui/stores.test.ts`

**Step 5: Commit**
`git commit -m "feat(ui): add karaokeMode store with toggle support"`

---

### Task 2: System Controller, Hotkeys, and Tray Menu Integration
**Files:**
- Modify: `src/system/types.ts`
- Modify: `src/system/hotkey-manager.ts`
- Modify: `src/system/tray-manager.ts`
- Modify: `src/system/system-controller.ts`
- Test: `tests/system/hotkey-manager.test.ts`
- Test: `tests/system/system-controller.test.ts`

**Step 1: Write the failing tests**
In `tests/system/hotkey-manager.test.ts` and `tests/system/system-controller.test.ts`, add tests for `'toggle-karaoke'` action.

**Step 2: Run tests to verify they fail**
`npx vitest run tests/system/hotkey-manager.test.ts tests/system/system-controller.test.ts`

**Step 3: Implement minimal code**
- Add `'toggle-karaoke'` to `HotkeyAction` in `src/system/types.ts`.
- Bind `Ctrl+Shift+K` to `'toggle-karaoke'` in `HotkeyManager`.
- Add dynamic tray menu item `🎤 Karaoke Wipe: [ON/OFF]` in `TrayManager`.
- Wire `toggle-karaoke` handler in `SystemController`.

**Step 4: Run tests to verify they pass**
`npx vitest run tests/system/hotkey-manager.test.ts tests/system/system-controller.test.ts`

**Step 5: Commit**
`git commit -m "feat(system): add toggle-karaoke hotkey and tray menu integration"`

---

### Task 3: UI Rendering in `LyricsLine.svelte` & Header Button in `TrackHeader.svelte`
**Files:**
- Modify: `src/ui/src/components/LyricsLine.svelte`
- Modify: `src/ui/src/components/TrackHeader.svelte`

**Step 1: Update `LyricsLine.svelte`**
Check `$karaokeMode`:
- If `isActive && $karaokeMode`: render animated linear-gradient background clip.
- If `isActive && !$karaokeMode`: render crisp solid bright emerald/teal text with soft glow.

**Step 2: Update `TrackHeader.svelte`**
Add microphone toggle button next to Play/Pause with active color state and title tooltip.

**Step 3: Verify build**
`npm run build && npm run build:ui`

**Step 4: Commit**
`git commit -m "feat(ui): support solid highlight mode and add karaoke toggle button to header"`

---

### Task 4: Window Geometry & Hyprland Rule Adjustment (Fix Bottom Footer Clipping)
**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src/platform/tauri/tauri-window.ts`
- Modify: `src/tauri-bootstrap.ts`
- Modify: `~/.config/hypr/rules.lua`

**Step 1: Update window dimensions**
- Set height from `220` to `275` in `tauri.conf.json`, `tauri-window.ts`, `tauri-bootstrap.ts`.
- Update `~/.config/hypr/rules.lua` rule `desktop-overlay-hud`: `size = "750 275"`, `move = "monitor_w/2-375 monitor_h-315"`.
- Run `hyprctl reload`.

**Step 2: Commit**
`git commit -m "fix(layout): adjust overlay height to 275px to prevent footer clipping"`

---

### Task 5: Compilation, Deployment & Live Verification
**Files:**
- Output binary: `~/.local/bin/desktop-overlay`
- Tracker: `docs/plans/task.md`

**Step 1: Compile Tauri release binary**
`npm run build && npm run build:ui && npx tauri build --no-bundle`

**Step 2: Copy to ~/.local/bin/desktop-overlay**
`cp -f src-tauri/target/release/desktop-overlay ~/.local/bin/desktop-overlay`

**Step 3: Launch live application and capture screenshots**
- Launch `desktop-overlay`.
- Capture screenshot with `grim` to verify:
  1. Bottom footer is 100% visible and unclipped.
  2. Toggle button is present.
  3. Toggling karaoke mode between ON and OFF works cleanly.
- Mark TASK-33 in `docs/plans/task.md` as Completed.
