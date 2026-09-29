# Tauri Native Packaging Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Package the Cross-Platform Desktop Overlay into a native desktop executable via Tauri v2 (`src-tauri/`) with hardware-accelerated transparent webview, click-through toggling, dynamic OS tray, and global shortcuts.

**Architecture:** A Rust backend manages OS-level transparent windows, pointer hit-testing ignore flags, and desktop tray icon, while exposing IPC commands to our platform adapter `TauriPlatformAdapter`. The existing TypeScript `OverlayEngine`, `SystemController`, and Svelte 5 UI remain 100% platform-independent and reusable.

**Tech Stack:** Tauri v2, Rust 1.98, GTK3 / WebKit2GTK-4.1 / Ayatana AppIndicator, TypeScript, Svelte 5, Tailwind CSS v4.

---

### Task 27: Tauri 2 Project Configuration & Scaffolding
**Files:**
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`
- Create: `src-tauri/src/main.rs`
- Modify: `package.json`

**Step 1:** Setup `src-tauri/Cargo.toml` with `tauri = { version = "2.1", features = ["tray-icon"] }`, `serde`, `serde_json`.
**Step 2:** Configure `src-tauri/tauri.conf.json` with transparent frameless window (`width: 750, height: 120`), `frontendDist: "../dist-ui"`.
**Step 3:** Define permissions in `src-tauri/capabilities/default.json`.
**Step 4:** Add `tauri` CLI commands to `package.json` scripts (`"tauri": "tauri"`).
**Step 5:** Commit: `chore(tauri): scaffold Tauri v2 configuration and project structure`.

---

### Task 28: Rust Native Window & Display IPC Commands
**Files:**
- Create: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/main.rs`

**Step 1:** Implement `set_click_through(window: WebviewWindow, passthrough: bool)` in Rust.
**Step 2:** Implement `set_overlay_geometry(window: WebviewWindow, x: i32, y: i32, width: u32, height: u32)`.
**Step 3:** Implement `set_overlay_visibility(window: WebviewWindow, visible: bool)`.
**Step 4:** Implement `get_native_monitors(app: AppHandle) -> Vec<NativeMonitorInfo>`.
**Step 5:** Register commands in `tauri::Builder::default().invoke_handler(...)`.
**Step 6:** Run `cargo check --manifest-path src-tauri/Cargo.toml` to verify compilation.
**Step 7:** Commit: `feat(tauri): implement native window and display IPC commands in Rust`.

---

### Task 29: Rust Native Tray & Global Shortcut Integration
**Files:**
- Create: `src-tauri/src/tray.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/src/commands.rs`

**Step 1:** Implement `create_tray(app: &AppHandle)` with initial menu and tooltip.
**Step 2:** Implement `update_tray_menu(app: AppHandle, items: Vec<TrayMenuItemDto>)`.
**Step 3:** Setup hotkey event forwarding (`hotkey-pressed` event payload).
**Step 4:** Run `cargo check --manifest-path src-tauri/Cargo.toml` to verify compilation.
**Step 5:** Commit: `feat(tauri): implement native system tray and event forwarding`.

---

### Task 30: TypeScript Tauri Platform Adapter
**Files:**
- Create: `src/platform/tauri/tauri-window.ts`
- Create: `src/platform/tauri/tauri-display-provider.ts`
- Create: `src/platform/tauri/tauri-fullscreen-detector.ts`
- Create: `src/platform/tauri/tauri-adapter.ts`
- Create: `tests/platform/tauri-adapter.test.ts`
- Modify: `src/platform/factory.ts`

**Step 1:** Write unit tests for `TauriPlatformAdapter` verifying mapping of `setInputMode("passthrough")` -> `invoke("set_click_through", { passthrough: true })`.
**Step 2:** Implement `TauriOverlayWindow`, `TauriDisplayProvider`, and `TauriPlatformAdapter`.
**Step 3:** Run `npx vitest run tests/platform/tauri-adapter.test.ts` to verify all tests pass.
**Step 4:** Export `TauriPlatformAdapter` from `src/platform/index.ts` and register in `createPlatformAdapter({ platform: 'tauri' })`.
**Step 5:** Commit: `feat(platform): implement TypeScript TauriPlatformAdapter bridge`.

---

### Task 31: Full Integration, UI Bootstrap & Compilation Verification
**Files:**
- Modify: `src/ui/src/App.svelte`
- Modify: `src/index.ts`
- Create: `src/tauri-bootstrap.ts`

**Step 1:** Add automatic environment detection: if `window.__TAURI_INTERNALS__` exists, bootstrap via `TauriPlatformAdapter`.
**Step 2:** Run `npm run build && npm run build:ui`.
**Step 3:** Run `npm test` across all 24+ test suites to ensure 0 regressions.
**Step 4:** Run `cargo check --manifest-path src-tauri/Cargo.toml` or `npm run tauri build -- --no-bundle` to verify complete native compilation.
**Step 5:** Commit: `feat(tauri): wire UI bootstrap and verify end-to-end native build`.
