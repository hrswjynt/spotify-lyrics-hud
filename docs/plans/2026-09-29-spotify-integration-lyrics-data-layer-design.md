# Spotify Integration & Synchronized Lyrics Data Layer Design

## 1. Overview
This specification defines the native Spotify playback detection and synchronized lyrics fetching data layer for the desktop overlay.
It reads real-time playback metadata and position from Spotify via **DBus MPRIS** on Linux and platform-appropriate mechanisms on Windows, automatically queries synchronized lyrics from **LRCLIB**, parses `.lrc` timestamps, and streams state directly into the Svelte UI stores.

---

## 2. Architecture & Directory Structure

```text
src/data/
├── types.ts                    # Common data models (PlaybackTrack, PlaybackStatus, LyricsResult)
├── mpris/
│   ├── dbus-mpris.ts           # Linux DBus MPRIS client (PropertiesChanged signals & queries)
│   └── playback-clock.ts       # High-precision microsecond position tracker and interpolator
├── windows/
│   └── win32-spotify.ts        # Windows Spotify playback detector
├── lyrics/
│   ├── lrc-parser.ts           # Parses LRC strings ("[00:12.34] line") into LyricLine[]
│   └── lrclib-provider.ts      # HTTP client querying LRCLIB public API
├── spotify-service.ts          # Central orchestrator coordinating playback and lyrics
└── index.ts                    # Public exports
```

---

## 3. Playback Detection (Linux / DBus MPRIS)

### 3.1 DBus Service & Interfaces
- **Destination**: `org.mpris.MediaPlayer2.spotify`
- **Object Path**: `/org/mpris/MediaPlayer2`
- **Interfaces**:
  - `org.mpris.MediaPlayer2.Player` (Metadata, PlaybackStatus, Position, PlayPause, Next, Previous)
  - `org.freedesktop.DBus.Properties` (Get, Set, GetAll, PropertiesChanged signal)

### 3.2 Metadata Extraction
- `xesam:title`: Track name (string)
- `xesam:artist`: Artist list (array of strings or single string)
- `xesam:album`: Album title (string)
- `mpris:artUrl`: Album artwork URL (e.g. `https://i.scdn.co/image/...`)
- `mpris:length`: Duration in microseconds (`durationMs = Math.round(length / 1000)`)
- `mpris:trackid`: Unique Spotify track ID URI

### 3.3 Position Tracking
- Position is reported in microseconds by `org.mpris.MediaPlayer2.Player.Position`.
- `PlaybackClock` interpolates elapsed time via local monotonic clock (`performance.now()`) while playing to provide 60/144 FPS smooth timestamps without spamming DBus calls.

---

## 4. Synchronized Lyrics Engine

### 4.1 LRC Parser (`lrc-parser.ts`)
- Parses standard LRC format strings:
  - Format: `[mm:ss.xx] Lyric text` or `[mm:ss.xxx] Lyric text`
  - Converts timestamp to milliseconds: `timeMs = (minutes * 60 + seconds) * 1000 + milliseconds`
  - Sorts lines chronologically and filters out empty metadata tags (e.g. `[ar:...]`, `[ti:...]`).

### 4.2 LRCLIB Provider (`lrclib-provider.ts`)
- Free, open, zero-authentication public API:
  - Endpoint: `https://lrclib.net/api/get`
  - Parameters:
    - `track_name`: Track title
    - `artist_name`: Artist name
    - `album_name`: Album name (optional)
    - `duration`: Track duration in seconds
- Response contains `syncedLyrics` (string with LRC timestamps) and `plainLyrics`.

---

## 5. UI Store Synchronization

The `SpotifyService` connects to the Svelte UI:
- When track changes:
  - Updates `currentTrack` store (title, artist, album, albumArtUrl, durationMs).
  - Triggers asynchronous lyrics fetch from LRCLIB.
  - On lyrics received, parses LRC and updates `lyrics` store.
- During playback:
  - Emits progress ticks to `playbackState` store (`currentTimeMs`, `isPlaying`).
- On user control:
  - Forward `togglePlayPause()`, `next()`, `previous()` to DBus MPRIS.

---

## 6. Testing Strategy
- Unit tests for LRC parsing (various timestamp formats, out-of-order tags, edge cases).
- Unit tests for LRCLIB response parsing and fallback logic.
- Unit tests for PlaybackClock interpolation and drift correction.
- Live integration test verifying connection to the active Spotify instance on this machine.
