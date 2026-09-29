# Svelte + Tailwind CSS Lyrics HUD Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a transparent, glassmorphic Svelte + Tailwind CSS desktop overlay UI for synchronized Spotify lyrics with smooth auto-centering scrolling, karaoke line progress, track metadata header, and bridge to the native OverlayEngine.

**Architecture:** A Vite-powered Svelte application running in the overlay webview surface, connected to the core OverlayEngine via reactive stores. A high-frequency `requestAnimationFrame` karaoke synchronization engine calculates active line indices and percentage completion without jitter.

**Tech Stack:** Svelte, Vite, Tailwind CSS, PostCSS, TypeScript, Vitest.

---

### Task 1: Setup Svelte, Vite, and Tailwind CSS Dependencies & Config

**Files:**
- Modify: `package.json`
- Create: `src/ui/vite.config.ts`
- Create: `src/ui/tailwind.config.js`
- Create: `src/ui/postcss.config.js`
- Create: `src/ui/src/styles/app.css`

**Step 1: Install frontend dependencies**
Install `svelte`, `@sveltejs/vite-plugin-svelte`, `tailwindcss`, `postcss`, `autoprefixer`, and `vite`.

**Step 2: Create configuration files**
Configure `vite.config.ts` with svelte plugin, `tailwind.config.js` with glassmorphic transparency colors, and `postcss.config.js`.

**Step 3: Create base CSS styles**
Configure `src/ui/src/styles/app.css` with `@tailwind base; @tailwind components; @tailwind utilities;` and transparency resets for desktop overlays.

**Step 4: Verify build configuration**
Verify configuration builds cleanly.

**Step 5: Commit**
```bash
git add package.json package-lock.json src/ui/
git commit -m "feat(ui): setup svelte, vite, and tailwind css infrastructure"
```

---

### Task 2: Karaoke Timing & Synchronization Engine

**Files:**
- Create: `src/ui/src/sync/lyrics-sync.ts`
- Test: `tests/ui/lyrics-sync.test.ts`

**Step 1: Write the failing test**
Create test cases for:
- Binary search finding active line for given timestamp
- Edge cases: before first line, between lines, after last line
- Calculating line progress fraction (`0.0` to `1.0`)

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/ui/lyrics-sync.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement `LyricsSyncEngine`**
Implement binary search algorithm and smooth progress interpolation.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/ui/lyrics-sync.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/ui/src/sync/lyrics-sync.ts tests/ui/lyrics-sync.test.ts
git commit -m "feat(ui): implement karaoke synchronization engine with binary search"
```

---

### Task 3: Reactive State Stores & OverlayEngine Bridge

**Files:**
- Create: `src/ui/src/stores/playback.ts`
- Create: `src/ui/src/stores/overlay.ts`
- Test: `tests/ui/stores.test.ts`

**Step 1: Write the failing test**
Test playback state updates, simulated progress ticker, and overlay mode toggling.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/ui/stores.test.ts`
Expected: FAIL

**Step 3: Implement `playback.ts` and `overlay.ts`**
Implement Svelte readable/writable stores for:
- Track info (title, artist, album art, duration)
- Playback clock (`currentTimeMs`, `isPlaying`)
- Synced lyrics lines
- Overlay intent bridge (inputMode `passthrough` vs `interactive`, monitor ID, anchor)

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/ui/stores.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/ui/src/stores/ tests/ui/stores.test.ts
git commit -m "feat(ui): implement playback and overlay bridge stores"
```

---

### Task 4: Svelte UI Components

**Files:**
- Create: `src/ui/src/components/StatusBadge.svelte`
- Create: `src/ui/src/components/TrackHeader.svelte`
- Create: `src/ui/src/components/LyricsLine.svelte`
- Create: `src/ui/src/components/LyricsScroller.svelte`
- Create: `src/ui/src/components/LyricsHUD.svelte`

**Step 1: Implement `StatusBadge.svelte`**
Renders mode indicator (`PASSTHROUGH` vs `INTERACTIVE`) with click-to-toggle when interactive.

**Step 2: Implement `TrackHeader.svelte`**
Renders album art, track title, artist, play/pause state, and thin progress bar.

**Step 3: Implement `LyricsLine.svelte`**
Renders lyric line with active glow, karaoke gradient fill, and smooth scaling.

**Step 4: Implement `LyricsScroller.svelte`**
Auto-centers the active line vertically using hardware-accelerated CSS `translate3d`.

**Step 5: Implement `LyricsHUD.svelte`**
Combines header, scroller, and status badge inside a glassmorphic container.

**Step 6: Commit**
```bash
git add src/ui/src/components/
git commit -m "feat(ui): build Svelte lyrics HUD components with glassmorphism"
```

---

### Task 5: App Entry Point, HTML Shell & Transparent Setup

**Files:**
- Create: `src/ui/src/App.svelte`
- Create: `src/ui/src/main.ts`
- Create: `src/ui/index.html`

**Step 1: Create `App.svelte`**
Mounts `LyricsHUD` with sample track data ("Bohemian Rhapsody" or "Starboy") and simulated playback clock.

**Step 2: Create `main.ts`**
Bootstraps Svelte application.

**Step 3: Create `index.html`**
HTML shell with transparent background, anti-aliased font rendering, and zero margins.

**Step 4: Test build**
Run: `npx vite build --config src/ui/vite.config.ts`
Expected: PASS, outputs to `dist-ui/`

**Step 5: Commit**
```bash
git add src/ui/
git commit -m "feat(ui): complete Svelte application shell and transparent HTML entry"
```

---

### Task 6: End-to-End Verification & Integration

**Files:**
- Modify: `docs/plans/task.md`
- Run: Full test suite (`npm test`) and frontend build check.

**Step 1: Execute all unit and UI tests**
Run: `npm test`
Expected: All tests pass.

**Step 2: Build both Core and UI**
Run: `npm run build && npx vite build --config src/ui/vite.config.ts`
Expected: Both exit code 0.

**Step 3: Update documentation and tracker**
Update `docs/plans/task.md` with UI milestone completed.

**Step 4: Commit**
```bash
git commit -am "feat(ui): verify and complete Svelte + Tailwind lyrics overlay frontend"
```
