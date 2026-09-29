# Svelte + Tailwind CSS Spotify Lyrics Overlay Design

## 1. Overview
This specification details the frontend UI layer for the cross-platform native desktop overlay.
Built with **Svelte** and styled with **Tailwind CSS**, it renders a hardware-accelerated, transparent, glassmorphic HUD for synchronized Spotify lyrics with karaoke line-level timing, smooth auto-centering scrolling, and seamless integration with the platform `OverlayEngine`.

---

## 2. Technology Stack
- **Framework**: Svelte 5 / Svelte with Vite
- **Styling**: Tailwind CSS (with glassmorphism, transparent backdrop, smooth transitions)
- **Animation**: CSS hardware-accelerated transforms (`translate3d`), requestAnimationFrame interpolation, Svelte spring/tweened stores
- **Core Integration**: Direct bidirectional bridge to `OverlayEngine` (intent, click-through, monitor info)

---

## 3. UI Component Architecture

```text
src/ui/
├── index.html                   # Transparent webview entry point
├── vite.config.ts               # Vite + Svelte + Tailwind build configuration
├── tailwind.config.js           # Custom transparent colors, blur utilities, animations
├── postcss.config.js            # PostCSS configuration
├── src/
│   ├── main.ts                  # Svelte app mounting
│   ├── App.svelte               # Root glassmorphic HUD container
│   ├── components/
│   │   ├── LyricsHUD.svelte     # Main lyrics view wrapper
│   │   ├── LyricsScroller.svelte# Auto-centering smooth scroll viewport
│   │   ├── LyricsLine.svelte    # Individual lyrics line with karaoke glow & progress fill
│   │   ├── TrackHeader.svelte   # Album art, song title, artist, seek progress bar
│   │   └── StatusBadge.svelte   # Interactive vs Passthrough indicator badge
│   ├── stores/
│   │   ├── playback.ts          # Track metadata, currentTimeMs, isPlaying, lyrics lines
│   │   └── overlay.ts           # OverlayEngine state bridge (intent, monitor, pointer mode)
│   └── styles/
│       └── app.css              # Tailwind base, components, utilities & transparency resets
```

---

## 4. Key Functional Features

### 4.1 Transparent & Glassmorphic Visuals
- Root background is fully transparent (`background: transparent;`).
- HUD container uses modern frosted glass styling:
  - `bg-neutral-950/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl`
- Subtle glow effects around active lyrics and album art.

### 4.2 Karaoke Synchronized Scrolling
- **Binary Search Line Finder**: High-performance timestamp lookup finding the active lyric line for `currentPlaybackMs`.
- **Auto-Centering**: The active line is always centered vertically in the viewport with smooth CSS easing (`cubic-bezier(0.25, 1, 0.5, 1)`).
- **Karaoke Highlight**:
  - Active line: `text-white font-bold text-2xl scale-105 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]`
  - Previous lines: `text-white/40 scale-95`
  - Next lines: `text-white/60 scale-98`
- **Line Progress Fill**: A smooth linear gradient sweep filling the text color from left to right as the line progresses.

### 4.3 Track Header & Progress Bar
- Displays album cover thumbnail, track title, artist name, and a thin animated progress bar (`0% -> 100%`).
- Shows playback status (playing/paused).

### 4.4 Overlay Engine Bridge & Input Mode Indicator
- Interactivity status badge:
  - `PASSTHROUGH` (default): Small unobtrusive green badge indicating mouse clicks pass through to background windows.
  - `INTERACTIVE`: Highlighted amber badge indicating hoverable and clickable controls (play/pause, manual scroll, resize, monitor switch).
- Clicking or triggering hotkeys toggles the mode in the native platform adapter.

---

## 5. Verification & Testing
- Vitest unit tests for the karaoke sync engine (binary search, progress interpolation, line calculation).
- Component mounting test.
- Build verification via `vite build`.
