# Multi-Artist Metadata Enrichment Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enrich Spotify track metadata on the desktop overlay to display complete, multi-artist collaboration lists across platforms without requiring user authentication or OAuth tokens.

**Architecture:** An asynchronous pipeline that immediately renders initial MPRIS metadata, then queries Spotify public track page meta tags in Rust (`enrich_track_metadata`) with in-memory caching and LRCLIB fallback to update the UI with full artist credits.

**Tech Stack:** Rust (Tauri v2 IPC, Regex, HTML decoding), TypeScript, Svelte, Vitest.

---

### Task 1: Native Rust Metadata Enrichment Module (`src-tauri/src/enrichment.rs`)

**Files:**
- Create: `src-tauri/src/enrichment.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Write the failing unit tests in `src-tauri/src/enrichment.rs`**
Add tests verifying:
- Extraction of multi-artist from `<meta name="music:musician_description" content="Cold Hart, Lil Peep"/>`
- Extraction from `<meta property="og:description" content="Cold Hart, Lil Peep · Me and You · Song · 2020"/>`
- HTML entity decoding (e.g. `Queen &amp; David Bowie` -> `Queen & David Bowie`)
- Cache hit/miss functionality
- Handling of missing tags (returns `None`)

**Step 2: Run tests to verify they fail**
Run: `cargo test --manifest-path src-tauri/Cargo.toml enrichment::tests`
Expected: FAIL (module or function not found)

**Step 3: Implement minimal code in `src-tauri/src/enrichment.rs`**
Implement:
- `parse_artists_from_html(html: &str) -> Option<String>`
- `fetch_and_enrich(track_id: &str) -> Option<String>`
- Thread-safe caching with `LazyLock<Mutex<HashMap<String, String>>>`

**Step 4: Run tests to verify they pass**
Run: `cargo test --manifest-path src-tauri/Cargo.toml enrichment::tests`
Expected: PASS

**Step 5: Commit**
```bash
git add src-tauri/src/enrichment.rs src-tauri/src/lib.rs
git commit -m "feat(rust): add multi-artist enrichment module with unit tests"
```

---

### Task 2: Expose Tauri IPC Command `enrich_track_metadata` (`src-tauri/src/commands.rs`)

**Files:**
- Modify: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Write the failing test / check command registration**
Register `enrich_track_metadata` in Tauri builder invoke handler in `src-tauri/src/lib.rs`.

**Step 2: Implement command in `src-tauri/src/commands.rs`**
Implement:
```rust
#[tauri::command]
pub fn enrich_track_metadata(track_id: String) -> Result<Option<String>, String> {
    Ok(crate::enrichment::fetch_and_enrich(&track_id))
}
```
Ensure `poll_spotify_metadata` cleans up the track id by stripping `/com/spotify/track/` or `spotify:track:`.

**Step 3: Run `cargo check` and `cargo test`**
Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS

**Step 4: Commit**
```bash
git add src-tauri/src/commands.rs src-tauri/src/lib.rs
git commit -m "feat(tauri): expose enrich_track_metadata IPC command"
```

---

### Task 3: Data Model & DBus Track ID Sanitization (`src/data/`)

**Files:**
- Modify: `src/data/mpris/dbus-mpris.ts`
- Modify: `tests/data/dbus-mpris.test.ts`

**Step 1: Write failing test in `tests/data/dbus-mpris.test.ts`**
Verify that `track.id` strips D-Bus path prefix `/com/spotify/track/` and retains the raw Spotify alphanumeric ID.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/data/dbus-mpris.test.ts`
Expected: FAIL

**Step 3: Update `src/data/mpris/dbus-mpris.ts`**
Sanitize `trackId` so it always extracts the clean Spotify ID.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/data/dbus-mpris.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/data/mpris/dbus-mpris.ts tests/data/dbus-mpris.test.ts
git commit -m "feat(data): sanitize mpris track id for metadata enrichment"
```

---

### Task 4: Frontend Asynchronous Enrichment Pipeline & Fallback (`src/tauri-bootstrap.ts`)

**Files:**
- Modify: `src/tauri-bootstrap.ts`
- Create: `tests/ui/enrichment.test.ts`

**Step 1: Write failing test in `tests/ui/enrichment.test.ts`**
Verify:
- Asynchronous enrichment updates artist in `currentTrack` store.
- If track ID changes before enrichment completes, stale enrichment response is ignored.
- Fallback to LRCLIB artist if enrichment returns null and LRCLIB has multi-artist name.

**Step 2: Run test to verify failure**
Run: `npx vitest run tests/ui/enrichment.test.ts`
Expected: FAIL

**Step 3: Implement enrichment logic in `src/tauri-bootstrap.ts`**
Hook into `spotify.onTrack`:
- Asynchronously invoke `enrich_track_metadata`.
- Update `currentTrack.update(...)` with race condition check.
- Use LRCLIB `artistName` as fallback if multi-artist delimiters exist.

**Step 4: Run tests to verify pass**
Run: `npm test`
Expected: PASS (all tests pass)

**Step 5: Commit**
```bash
git add src/tauri-bootstrap.ts tests/ui/enrichment.test.ts
git commit -m "feat(ui): implement asynchronous multi-artist enrichment pipeline"
```

---

### Task 5: End-to-End Verification, Version Bump & Release Matrix

**Files:**
- Modify: `package.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `docs/plans/task.md`

**Step 1: Bump version to 0.2.6**
Update version in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.

**Step 2: Full verification**
Run: `npm test` and `cargo test --manifest-path src-tauri/Cargo.toml`
Run: `npm run build:ui`

**Step 3: Compile release binary & deploy locally**
Run: `npx tauri build`
Copy release binary to `~/.local/bin/spotify-lyrics-hud` and restart daemon.

**Step 4: Live E2E verification**
Verify HUD process is running cleanly and capture screen via `grim`.

**Step 5: Commit, tag and push**
```bash
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json docs/plans/task.md
git commit -m "chore(release): bump version to 0.2.6 with multi-artist metadata enrichment"
git tag v0.2.6
git push origin main && git push origin v0.2.6
```
