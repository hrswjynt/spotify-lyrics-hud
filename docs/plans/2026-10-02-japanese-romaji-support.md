# Japanese Lyrics Romaji Support Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement full offline transliteration of Japanese lyrics (Kanji/Kana) into spaced Hepburn Romaji with a flexible display setting (Dual, Romaji Only, Original) and simultaneous karaoke sweeping.

**Architecture:** A native Rust transliteration engine using `sabiyomi` (Lindera morphological analyzer + IPADIC dictionary) converts lyrics lines on demand via Tauri IPC. The Svelte frontend stores the setting in `DisplaySettings`, attaches `romaji` to each `LyricLine`, and `LyricsLine.svelte` renders synchronized simultaneous karaoke sweeps for both lines when in Dual mode.

**Tech Stack:** Rust (sabiyomi, Lindera, IPADIC), Tauri v2 IPC, Svelte 5, Tailwind CSS, TypeScript, Vitest.

---

### Task 1: Add `sabiyomi` to `src-tauri/Cargo.toml` and Implement `romaji.rs`

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/romaji.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Add dependency to Cargo.toml**
Add `sabiyomi = "0.1.0"` to `[dependencies]`.

**Step 2: Implement `src-tauri/src/romaji.rs`**
- Check if text contains Japanese characters (`[\u3040-\u30FF\u4E00-\u9FFF]`).
- Convert lines using a singleton `Sabiyomi` instance with `Mode::Spaced`, `RomajiSystem::Hepburn`, and `LongVowels::Spelled`.
- Add unit tests inside `romaji.rs` testing Kanji and Kana lyrics.

**Step 3: Run `cargo test --bin spotify-lyrics-hud` or `cargo test --lib`**
Verify tests pass.

**Step 4: Commit**
`git add src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/src/romaji.rs src-tauri/src/lib.rs`
`git commit -m "feat(rust): add sabiyomi romaji transliteration module"`

---

### Task 2: Register Tauri IPC Command `convert_lyrics_to_romaji`

**Files:**
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Add command to `commands.rs`**
```rust
#[tauri::command]
pub fn convert_lyrics_to_romaji(lines: Vec<String>) -> Result<Vec<Option<String>>, String> {
    Ok(crate::romaji::transliterate_lines(&lines))
}
```

**Step 2: Register command in `lib.rs` generate_handler!**

**Step 3: Run `cargo check` to verify compilation**

**Step 4: Commit**
`git add src-tauri/src/commands.rs src-tauri/src/lib.rs`
`git commit -m "feat(rust): expose convert_lyrics_to_romaji Tauri command"`

---

### Task 3: Update `DisplaySettings` Store & Add Tests

**Files:**
- Modify: `src/ui/src/stores/display-settings.ts`
- Modify: `tests/ui/display-settings.test.ts`

**Step 1: Write test for `japaneseMode` in `tests/ui/display-settings.test.ts`**
Verify default is `'dual'` and setting can be changed to `'romaji'` or `'original'`.

**Step 2: Run `npm test tests/ui/display-settings.test.ts` to see failure**

**Step 3: Update `src/ui/src/stores/display-settings.ts`**
Add `japaneseMode: 'original' | 'romaji' | 'dual'` to `DisplaySettings` interface and defaults.

**Step 4: Run `npm test tests/ui/display-settings.test.ts` to verify pass**

**Step 5: Commit**
`git add src/ui/src/stores/display-settings.ts tests/ui/display-settings.test.ts`
`git commit -m "feat(settings): add japaneseMode to displaySettings store"`

---

### Task 4: Update `LyricLine` Types and Lyrics Loader

**Files:**
- Modify: `src/ui/src/sync/lyrics-sync.ts`
- Modify: `src/data/types.ts`
- Modify: `src/tauri-bootstrap.ts`
- Modify: `src/ui/src/stores/playback.ts`

**Step 1: Update `LyricLine` to include `romaji?: string`**

**Step 2: In `tauri-bootstrap.ts`, call `convert_lyrics_to_romaji` when track lyrics are loaded**
Attach resulting Romaji text to corresponding `LyricLine`.

**Step 3: Run `npm test` to verify no regressions**

**Step 4: Commit**
`git add src/ui/src/sync/lyrics-sync.ts src/data/types.ts src/tauri-bootstrap.ts src/ui/src/stores/playback.ts`
`git commit -m "feat(data): attach romaji transliteration to LyricLine"`

---

### Task 5: Update `LyricsLine.svelte` for Dual Mode & Simultaneous Sweep

**Files:**
- Modify: `src/ui/src/components/LyricsLine.svelte`

**Step 1: Update component props to accept `romaji?: string`**

**Step 2: Implement rendering logic:**
- If `$displaySettings.japaneseMode === 'original'` or no `romaji`: render only original text.
- If `$displaySettings.japaneseMode === 'romaji'` and `romaji`: render `romaji` as main line.
- If `$displaySettings.japaneseMode === 'dual'` and `romaji`:
  - Render original Kanji/Kana text as line 1.
  - Render Romaji as line 2 (spaced font, ~85% scale).
  - Apply the exact same `gradientBackground` / `fillPercent` styling to both lines simultaneously.

**Step 3: Run `npm run build:ui` to ensure Svelte compiles cleanly**

**Step 4: Commit**
`git add src/ui/src/components/LyricsLine.svelte`
`git commit -m "feat(ui): render dual-line lyrics with simultaneous karaoke sweep"`

---

### Task 6: Add Japanese Lyrics Option to `SettingsModal.svelte`

**Files:**
- Modify: `src/ui/src/components/SettingsModal.svelte`

**Step 1: Add "Japanese Lyrics" section under Display settings**
Dropdown options:
- Dual (Asli + Romaji)
- Romaji Only
- Original Only

**Step 2: Bind selection to `$displaySettings.japaneseMode`**

**Step 3: Run `npm run build:ui` and `npm test`**

**Step 4: Commit**
`git add src/ui/src/components/SettingsModal.svelte`
`git commit -m "feat(ui): add Japanese lyrics mode selector to SettingsModal"`

---

### Task 7: Full Verification & Release Build

**Step 1: Run all unit and integration tests**
`npm test` (all 109+ tests pass)

**Step 2: Run `cargo check --manifest-path src-tauri/Cargo.toml`**

**Step 3: Build UI and test binary locally**

**Step 4: Commit and finalize**
