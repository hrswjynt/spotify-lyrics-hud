# Design Document: Multi-Artist Metadata Enrichment for Spotify HUD

**Date**: 2026-10-06  
**Status**: Approved  
**Author**: Antigravity  

---

## 1. Problem Statement & Background

On Linux systems, the official Spotify desktop client's MPRIS (D-Bus) implementation provides only the primary artist in the `xesam:artist` field (omitting featured and collaborative artists, e.g. returning only `"Cold Hart"` instead of `"Cold Hart, Lil Peep"` for the track *"Me and You"*). While Windows exposes all artists in the Spotify window title, Linux users experience incomplete artist names on their desktop overlay HUD.

The goal is to automatically enrich Spotify track metadata on the desktop overlay to display complete, multi-artist collaboration lists across all platforms without requiring Spotify user authentication or OAuth tokens.

---

## 2. Architecture & Data Flow

```
                      +-----------------------------+
                      |   Spotify Playback Event   |
                      | (MPRIS / playerctl / Win32) |
                      +--------------+--------------+
                                     |
                       [Instant 0ms Initial Display]
                                     |
                                     v
                  +--------------------------------------+
                  | HUD displays track title + 1st artist|
                  | (SpotifyTrack in currentTrack store) |
                  +------------------+-------------------+
                                     |
                         [Asynchronous Enrichment]
                                     |
                                     v
                  +--------------------------------------+
                  | Rust IPC: enrich_track_metadata(id)  |
                  +------------------+-------------------+
                                     |
                +--------------------+--------------------+
                |                                         |
     [In-Memory Cache Hit]                     [In-Memory Cache Miss]
                |                                         |
                v                                         v
    Return cached full artist               Fetch Spotify Public Track Page
                                            (https://open.spotify.com/track/<id>)
                                                          |
                                           Extract meta tags:
                                           - music:musician_description
                                           - og:description
                                           - <title>
                                                          |
                                           +--------------+--------------+
                                           |                             |
                                      [Found]                       [Fallback]
                                           |                             |
                                  Return full artist             Check LRCLIB response
                                  (e.g. "Cold Hart, Lil Peep")   (data.artistName)
                                           |                             |
                                           +--------------+--------------+
                                                          |
                                                          v
                                       Update currentTrack.artist in UI
                                       (if trackId matches active track)
```

---

## 3. Detailed Component Design

### 3.1. Native Rust IPC Command (`src-tauri/src/commands.rs` & `src-tauri/src/enrichment.rs`)
- Expose `enrich_track_metadata(track_id: String) -> Result<Option<String>, String>`.
- Use a thread-safe in-memory cache: `Mutex<HashMap<String, String>>`.
- Execute lightweight HTTP GET request via `curl` with a 3-second timeout (`curl -s --max-time 3 -L "https://open.spotify.com/track/<track_id>"`).
- Extract artist information using regex parsing on HTML meta tags:
  1. `<meta name="music:musician_description" content="([^"]+)"/>`
  2. `<meta property="og:description" content="([^"]+?) · [^·]+ · Song · \d{4}"/>`
  3. `<title>[^<]+? - song and lyrics by ([^<]+?) \| Spotify</title>`
- Decode common HTML entities (e.g. `&amp;` -> `&`, `&#x27;` -> `'`).

### 3.2. Data Models & Interface Updates (`src/data/types.ts` & `src/data/mpris/dbus-mpris.ts`)
- Ensure `SpotifyTrack` contains `trackId` or clean Spotify ID extracted from `mpris:trackid` or `xesam:url`.
- In `src/data/mpris/dbus-mpris.ts` and `src-tauri/src/commands.rs`, ensure track ID extraction strips any `/com/spotify/track/` or `spotify:track:` prefix.

### 3.3. Frontend Enrichment Pipeline (`src/tauri-bootstrap.ts`)
- On track change (`spotify.onTrack`):
  1. Immediately push track metadata to `currentTrack` store with initial artist.
  2. Record `activeTrackId = track.id`.
  3. Invoke `enrich_track_metadata(track.id)`.
  4. Upon receiving response:
     - Verify `currentTrack.id === activeTrackId` (guard against race conditions from rapid track skips).
     - If enriched artist is present, update `currentTrack.update(t => ({ ...t, artist: enrichedArtist }))`.
  5. Fallback: If `enrich_track_metadata` returns `None` and LRCLIB returns an `artistName` containing `,`, `/`, `&`, or `feat`, use the LRCLIB artist name.

---

## 4. Error Handling & Edge Cases

1. **Offline / Network Timeout**:
   - Max 3-second timeout. If offline or timed out, fails silently.
   - Initial MPRIS artist remains displayed with zero visual disturbance.
2. **Rapid Track Skipping**:
   - Each async enrichment check verifies if the song is still actively playing before applying store updates.
   - Older responses are discarded while still cached for future plays.
3. **Long Artist Names in Header**:
   - `TrackHeader.svelte` already utilizes Tailwind's `truncate` class on the artist label, ensuring proper ellipsis clipping without overflowing the HUD.

---

## 5. Verification & Testing Strategy

1. **Rust Unit Tests**:
   - Parse Spotify HTML fragments covering single artist, multi-artist, special characters (Japanese Kanji/Kana, ampersands, accented letters), and missing tags.
   - Cache hit/miss validation.
2. **Vitest Frontend Tests**:
   - Test async enrichment update in `playback.ts` store.
   - Verify race condition protection (ignoring stale track enrichment responses).
   - Verify LRCLIB fallback formatting.
3. **Live System Verification**:
   - Build and test against real Spotify playback with collaboration tracks (e.g. Cold Hart & Lil Peep).
   - Screenshot verification via `grim` confirming multi-artist text rendered cleanly in the HUD.
