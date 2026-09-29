# Spotify Integration & Synchronized Lyrics Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement real-time Spotify playback detection via DBus MPRIS on Linux (and platform fallbacks), automatic synchronized lyrics fetching from LRCLIB, high-precision playback position clock, and state streaming to the Svelte UI stores.

**Architecture:** A native DBus MPRIS event listener queries metadata and position from the active Spotify instance, tracks high-frequency elapsed time via local monotonic clock, fetches `.lrc` lyrics from the LRCLIB API, parses them into `LyricLine[]`, and streams updates directly into the UI layer.

**Tech Stack:** TypeScript, DBus MPRIS (`playerctl` / DBus interface), Fetch API, Svelte stores, Vitest.

---

### Task 1: Core Data Models & LRC Parser

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/lyrics/lrc-parser.ts`
- Test: `tests/data/lrc-parser.test.ts`

**Step 1: Write the failing test**
Test cases for:
- Standard timestamp `[mm:ss.xx]` parsing
- 3-digit millisecond `[mm:ss.xxx]` parsing
- Multiple timestamps per line
- Filtering metadata headers (`[ti:...]`, `[ar:...]`)
- Sorting lines chronologically

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/data/lrc-parser.test.ts`
Expected: FAIL

**Step 3: Implement `types.ts` and `lrc-parser.ts`**
Parse timestamps to milliseconds and produce clean `LyricLine[]`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/data/lrc-parser.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/data/types.ts src/data/lyrics/lrc-parser.ts tests/data/lrc-parser.test.ts
git commit -m "feat(data): implement LRC synchronized lyrics parser"
```

---

### Task 2: LRCLIB Lyrics Provider

**Files:**
- Create: `src/data/lyrics/lrclib-provider.ts`
- Test: `tests/data/lrclib-provider.test.ts`

**Step 1: Write the failing test**
Mock HTTP response from `https://lrclib.net/api/get` and verify:
- Successful fetch and parsing of `syncedLyrics`
- Fallback to `plainLyrics` if synced not available
- Graceful error handling on HTTP 404 (not found) or network error

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/data/lrclib-provider.test.ts`
Expected: FAIL

**Step 3: Implement `lrclib-provider.ts`**
Fetch from LRCLIB using native fetch and parse via `parseLrc`.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/data/lrclib-provider.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/data/lyrics/lrclib-provider.ts tests/data/lrclib-provider.test.ts
git commit -m "feat(data): implement LRCLIB synchronized lyrics provider"
```

---

### Task 3: High-Precision Playback Clock

**Files:**
- Create: `src/data/mpris/playback-clock.ts`
- Test: `tests/data/playback-clock.test.ts`

**Step 1: Write the failing test**
Test:
- Setting base position and play/pause state
- Monotonic elapsed time interpolation between sync ticks
- Seeking and clamping to duration bounds

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/data/playback-clock.test.ts`
Expected: FAIL

**Step 3: Implement `playback-clock.ts`**
Interpolates playback position based on `performance.now()` with drift correction.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/data/playback-clock.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/data/mpris/playback-clock.ts tests/data/playback-clock.test.ts
git commit -m "feat(data): implement high-precision monotonic playback clock"
```

---

### Task 4: Linux DBus MPRIS Client

**Files:**
- Create: `src/data/mpris/dbus-mpris.ts`
- Test: `tests/data/dbus-mpris.test.ts`
- Test: `tests/integration/live-spotify-mpris.test.ts`

**Step 1: Write the failing test**
Test metadata parsing from raw MPRIS key-value map and command execution (`playPause`, `next`, `previous`).

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/data/dbus-mpris.test.ts`
Expected: FAIL

**Step 3: Implement `dbus-mpris.ts`**
Connects to `org.mpris.MediaPlayer2.spotify` using `playerctl` / DBus calls, extracts metadata and position.

**Step 4: Run tests to verify pass (including live check)**
Run: `npx vitest run tests/data/dbus-mpris.test.ts tests/integration/live-spotify-mpris.test.ts`
Expected: PASS (and queries the real Spotify running on the machine)

**Step 5: Commit**
```bash
git add src/data/mpris/dbus-mpris.ts tests/data/dbus-mpris.test.ts tests/integration/live-spotify-mpris.test.ts
git commit -m "feat(data): implement native Linux DBus MPRIS client"
```

---

### Task 5: SpotifyService Orchestrator & UI Bridge

**Files:**
- Create: `src/data/spotify-service.ts`
- Create: `src/data/index.ts`
- Test: `tests/data/spotify-service.test.ts`

**Step 1: Write the failing test**
Test coordinating playback events, automatic lyrics fetching, and emitting updates to Svelte stores.

**Step 2: Run test to verify it fails**
Run: `npx vitest run tests/data/spotify-service.test.ts`
Expected: FAIL

**Step 3: Implement `spotify-service.ts` and `src/data/index.ts`**
Orchestrates MPRIS client, LRCLIB provider, PlaybackClock, and Svelte stores.

**Step 4: Run test to verify it passes**
Run: `npx vitest run tests/data/spotify-service.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/data/spotify-service.ts src/data/index.ts tests/data/spotify-service.test.ts
git commit -m "feat(data): implement centralized SpotifyService orchestrator"
```

---

### Task 6: Full Verification & Live Demonstration

**Files:**
- Create: `src/examples/live-spotify-hud.ts`
- Modify: `docs/plans/task.md`

**Step 1: Create live demonstration script**
Connects real Spotify playback with `SpotifyService` and logs synchronized lyric lines as they play.

**Step 2: Run full test suite and build verification**
Run: `npm test && npm run build && npm run build:ui`
Expected: All tests pass, build code 0.

**Step 3: Update documentation and tracker**
Update `docs/plans/task.md` with all completed tasks.

**Step 4: Commit**
```bash
git commit -am "feat(data): complete Spotify integration and lyrics data layer"
```
