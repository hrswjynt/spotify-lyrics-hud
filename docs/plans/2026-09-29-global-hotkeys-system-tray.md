# Global Hotkeys & System Tray Controller Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement a unified system controller managing global keyboard shortcuts (`Ctrl+Shift+X`, `Ctrl+Shift+H`, `Ctrl+Shift+M`) and dynamic system tray menu for the desktop overlay and Spotify playback.

**Architecture:** A platform-abstracted `HotkeyManager` listens for global shortcut triggers and dispatches actions to `OverlayEngine` and `SpotifyService`. A `TrayManager` builds a dynamic menu reflecting connected displays, current mode, and playback controls.

**Tech Stack:** TypeScript, Event Emitter, Vitest.

---

### Task 1: System Types & Contracts

**Files:**
- Create: `src/system/types.ts`

**Step 1: Define system types**
Define `HotkeyAction`, `HotkeyBinding`, `TrayMenuItem`, `TrayMenu`, and `SystemControllerConfig`.

**Step 2: Commit**
```bash
git add src/system/types.ts
git commit -m "feat(system): define types for hotkeys and tray menu"
```

---

### Task 2: HotkeyManager & Action Dispatcher

**Files:**
- Create: `src/system/hotkeys/hotkey-manager.ts`
- Test: `tests/system/hotkey-manager.test.ts`

**Step 1: Write the failing test**
Test registering shortcuts, mapping to actions (`toggle_click_through`, `toggle_visibility`, `cycle_monitor`, `play_pause`), and executing registered callbacks.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/system/hotkey-manager.test.ts`
Expected: FAIL

**Step 3: Implement `hotkey-manager.ts`**
Manages key combinations and triggers action handlers.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/system/hotkey-manager.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/system/hotkeys/hotkey-manager.ts tests/system/hotkey-manager.test.ts
git commit -m "feat(system): implement HotkeyManager and action dispatcher"
```

---

### Task 3: Dynamic Tray Menu Builder & Manager

**Files:**
- Create: `src/system/tray/menu-items.ts`
- Create: `src/system/tray/tray-manager.ts`
- Test: `tests/system/tray-manager.test.ts`

**Step 1: Write the failing test**
Test generating dynamic menu items from:
- Overlay state (click-through checked/unchecked, visibility checked/unchecked)
- Connected displays list (sub-items for selecting each monitor)
- Semantic positioning anchors

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/system/tray-manager.test.ts`
Expected: FAIL

**Step 3: Implement `menu-items.ts` and `tray-manager.ts`**
Constructs menu structure and routes item clicks to engine actions.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/system/tray-manager.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/system/tray/ tests/system/tray-manager.test.ts
git commit -m "feat(system): implement dynamic TrayManager and menu builder"
```

---

### Task 4: SystemController Orchestrator

**Files:**
- Create: `src/system/system-controller.ts`
- Create: `src/system/index.ts`
- Test: `tests/system/system-controller.test.ts`

**Step 1: Write the failing test**
Test `SystemController` binding hotkeys and tray menu to `OverlayEngine` and `SpotifyService`.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/system/system-controller.test.ts`
Expected: FAIL

**Step 3: Implement `system-controller.ts` and `src/system/index.ts`**
Wired together:
- `toggle_click_through` -> updates `OverlayIntent.interaction.pointer`
- `toggle_visibility` -> updates `OverlayIntent.visible`
- `cycle_monitor` -> updates `OverlayIntent.display` to next monitor in `Display[]`
- `play_pause` -> calls `SpotifyService.playPause()`

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/system/system-controller.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/system/system-controller.ts src/system/index.ts tests/system/system-controller.test.ts
git commit -m "feat(system): implement unified SystemController"
```

---

### Task 5: Full Verification & Demonstration

**Files:**
- Create: `src/examples/hotkeys-tray-demo.ts`
- Modify: `docs/plans/task.md`

**Step 1: Create interactive demonstration script**
Simulates hotkeys (`Ctrl+Shift+X`, `Ctrl+Shift+H`, `Ctrl+Shift+M`) and inspects tray menu and engine reactions.

**Step 2: Run full test suite and build verification**
Run: `npm test && npm run build && npm run build:ui`
Expected: All tests pass, build code 0.

**Step 3: Update documentation and tracker**
Update `docs/plans/task.md` with all completed tasks.

**Step 4: Commit**
```bash
git commit -am "feat(system): complete Global Hotkeys and System Tray controller"
```
