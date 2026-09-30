# HUD Global Scale Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement global scale settings (0.5x, 0.75x, 1.0x, 1.25x, 1.5x) across the HUD UI and native window geometry.

**Architecture:** Add `scale` property to `DisplaySettings` store persisted in `localStorage`. In `SettingsModal.svelte`, provide 5 preset buttons under Layout tab. In `App.svelte`, apply CSS scale/zoom to scale the entire interface proportionally. In `tauri-bootstrap.ts`, synchronize changes to `OverlayEngine` intent geometry to resize and re-anchor the native window at screen bottom-center.

**Tech Stack:** Svelte, TypeScript, Tailwind CSS, Tauri 2.0 (Rust), Vitest.

---

### Task 1: Update DisplaySettings Store & Unit Tests

**Files:**
- Modify: `src/ui/src/stores/display-settings.ts`
- Modify: `tests/ui/display-settings.test.ts`

**Step 1: Write the failing tests**
Update `tests/ui/display-settings.test.ts` to test scale defaulting to `'1'`, updating to `'0.75'`, and resetting.

**Step 2: Run test to verify it fails**
Run: `npm test tests/ui/display-settings.test.ts`
Expected: FAIL due to missing `scale` property.

**Step 3: Write minimal implementation**
In `src/ui/src/stores/display-settings.ts`:
- Define `export type ScaleOption = '0.5' | '0.75' | '1' | '1.25' | '1.5';`
- Add `scale: ScaleOption;` to `DisplaySettings`
- Add `scale: '1'` to `DEFAULT_DISPLAY_SETTINGS`.

**Step 4: Run test to verify it passes**
Run: `npm test tests/ui/display-settings.test.ts`
Expected: PASS (all tests pass).

**Step 5: Commit**
```bash
git add src/ui/src/stores/display-settings.ts tests/ui/display-settings.test.ts
git commit -m "feat(store): add scale option to display settings"
```

---

### Task 2: Implement Scale Preset Selector in SettingsModal

**Files:**
- Modify: `src/ui/src/components/SettingsModal.svelte`

**Step 1: Implement UI in SettingsModal**
Add the "Skala Tampilan (Scale)" section to the Layout & Spasi tab with 5 buttons (`0.5x`, `0.75x`, `1.0x`, `1.25x`, `1.5x`).

**Step 2: Run tests to verify no regressions**
Run: `npm test`
Expected: All 107 tests pass.

**Step 3: Commit**
```bash
git add src/ui/src/components/SettingsModal.svelte
git commit -m "feat(ui): add global scale presets to settings modal"
```

---

### Task 3: Dynamic Window Resizing & CSS Zoom in App / Tauri-Bootstrap

**Files:**
- Modify: `src/ui/src/App.svelte`
- Modify: `src/tauri-bootstrap.ts`

**Step 1: Update App.svelte**
Apply scale factor to root HUD container via CSS `zoom` or transform scale:
`const scaleFactor = parseFloat($displaySettings.scale || '1');`

**Step 2: Update tauri-bootstrap.ts**
Subscribe to `displaySettings`: when `scale` changes, compute new window dimensions (`750 * scaleFactor`, `275 * scaleFactor`), and call `engine.setIntent` with updated placement size.

**Step 3: Run full test suite**
Run: `npm test`
Expected: All tests pass.

**Step 4: Commit**
```bash
git add src/ui/src/App.svelte src/tauri-bootstrap.ts
git commit -m "feat(engine): synchronize global scale to OverlayEngine placement and CSS zoom"
```

---

### Task 4: Build, Deploy & Live Verification

**Files:**
- Modify: `docs/plans/task.md`

**Step 1: Build Tauri release binary**
Run: `npm run tauri:build` or `cargo build --release --manifest-path src-tauri/Cargo.toml`
Expected: Success build output in `src-tauri/target/release/desktop-overlay`.

**Step 2: Deploy binary**
Copy binary to `~/.local/bin/desktop-overlay` and `~/.local/bin/spotify-lyrics-hud`.

**Step 3: Restart daemon & live screenshot verification**
Restart background task daemon, verify with `grim` screenshot.

**Step 4: Update task.md and commit**
```bash
git add docs/plans/task.md
git commit -m "docs(plans): mark TASK-39 global scale completed"
git push origin main
```
