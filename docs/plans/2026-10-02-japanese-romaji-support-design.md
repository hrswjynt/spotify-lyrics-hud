# Japanese Lyrics Romaji Support Design

**Date:** 2026-10-02  
**Feature:** Japanese Lyrics Romaji Support (Offline Morphological Transliteration)  
**Status:** Approved  

---

## 1. Goal
Provide seamless, offline transliteration of Japanese lyrics (Kanji, Hiragana, Katakana) into spaced Hepburn Romaji, allowing users to sing along without needing to read Kanji, with flexible display modes (Dual, Romaji Only, or Original Only) and synchronized simultaneous karaoke sweep animations.

---

## 2. Architecture & Data Flow

```
[Spotify / LRCLIB]
       │
       ▼ (Raw LRC text with Kanji/Kana)
[SpotifyService / LrclibProvider]
       │
       ▼ (IPC invoke: 'convert_lyrics_to_romaji')
[Rust Backend: sabiyomi (Lindera + IPADIC)] ───► Offline Morphological Analysis
       │
       ▼ (LyricLine[] with text & romaji)
[Svelte Store (playback.ts / display-settings.ts)]
       │
       ▼
[LyricsLine.svelte]
   ├─ Mode: 'dual'     ──► Line 1: Original Kanji/Kana (Sweeping)
   │                       Line 2: Romaji (Sweeping simultaneously)
   ├─ Mode: 'romaji'   ──► Line 1: Romaji only (Sweeping)
   └─ Mode: 'original' ──► Line 1: Original Kanji/Kana only
```

---

## 3. Component Details

### A. Rust Transliteration Service (`src-tauri/src/romaji.rs`)
* **Dependency:** `sabiyomi = "0.1.0"` (utilizes embedded IPADIC dictionary in Lindera).
* **Detection:** Checks if input string contains CJK/Japanese codepoints (`[\u3040-\u30FF\u4E00-\u9FFF]`).
* **Conversion:**
  * Mode: `Mode::Spaced` (words separated by spaces for natural singing cadence).
  * System: `RomajiSystem::Hepburn`.
  * Long Vowels: `LongVowels::Spelled` (e.g. `teeze`, `ou`, `aa` to match lyric singing rhythm).
* **Concurrency & Performance:** `once_cell::sync::Lazy` instance of `Sabiyomi` to initialize the dictionary once upon first use and convert hundreds of lines in <1ms.
* **IPC Command:** `convert_lyrics_to_romaji(lines: Vec<String>) -> Result<Vec<Option<String>>, String>`.

### B. UI Stores & Configuration (`src/ui/src/stores/display-settings.ts`)
* Add `japaneseMode: 'original' | 'romaji' | 'dual'` to `DisplaySettings`.
* Default value: `'dual'`.
* Persisted in `localStorage` under `spotify_hud_display_settings`.

### C. Lyrics Line & Synchronized Sweep (`src/ui/src/components/LyricsLine.svelte`)
* Supports optional `romaji?: string` on `LyricLine`.
* In `'dual'` mode with active Romaji:
  * Top sub-line: Original Kanji/Kana text.
  * Bottom line: Romaji text (font scaled at ~80% of main text).
  * Both lines apply identical `fillPercent` gradient fill using `background-clip: text` and `-webkit-text-fill-color: transparent` for a synchronized sweep animation.
* In `'romaji'` mode: Replaces main text directly with `romaji`.
* In `'original'` mode (or non-Japanese songs): Displays standard text with no layout changes.

### D. Settings Modal UI (`src/ui/src/components/SettingsModal.svelte`)
* Adds a new setting group: **Japanese Lyrics**:
  * Dropdown options:
    * `Dual (Original + Romaji)`
    * `Romaji Only`
    * `Original (Kanji/Kana)`

---

## 4. Verification & Testing Plan
* **Rust Unit Tests:** Validate conversion accuracy on Kanji-heavy lyrics (e.g. `残酷な天使のテーゼ` ➔ `zankoku na tenshi no teeze`).
* **TypeScript Unit Tests:** Test `DisplaySettings` store migration, `LyricLine` parsing, and store sync.
* **Regression Testing:** Run existing 109 unit & integration tests (`npm test`).
* **Visual Verification:** Test with live Japanese tracks on Spotify and capture HUD screenshots.
