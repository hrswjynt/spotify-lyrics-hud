# 🎵 Spotify Lyrics HUD

A sleek, modern, and lightweight transparent desktop karaoke lyrics overlay for Spotify, built with **Tauri v2**, **Rust**, **Svelte**, and **Tailwind CSS**.

Designed for power users, gamers, and music lovers on **Linux (Wayland / Hyprland / X11)** and **Windows**.

---

## ✨ Features

- 🎤 **Synchronized Karaoke Mode**: Smooth progressive gradient wipe as vocals are sung, with an instant toggle (`Ctrl+Shift+K` or header button).
- 📐 **3-Line Dead-Center Layout**: The active lyric line is mathematically guaranteed locked dead-center vertically, with previous lines dimmed above and upcoming lines dimmed below. No scroll drift, ever.
- ⚙️ **In-Place Glass Settings Modal**:
  - **Typography**: Configurable font size (*Small*, *Medium*, *Large*), font family (*Modern Sans*, *Rounded*, *Monospace*), and text alignment (*Left*, *Center*, *Right*).
  - **Layout & Spacing**: 1-Line Focus mode, 3-Line Centered mode, Continuous Scroller mode, customizable line gap spacing, and configurable inactive lyric dimming (25%, 45%, 70%).
  - **Themes & Colors**: 4 highlight themes (*Spotify Emerald*, *Sky Cyan*, *Neon Violet*, *Pure White*) and 3 HUD background styles (*Glass Blur*, *Ultra Minimal*, *Solid Dark*).
- 🖱️ **Click-Through (Passthrough)**: Overlay allows all mouse clicks and inputs to pass directly through to games, coding editors, or full-screen apps without focus stealing.
- 🖥️ **Multi-Monitor & Hyprland Native**: Automatically integrates with Hyprland IPC sockets to detect monitor geometry, active monitors, and fullscreen windows.
- 🗂️ **Dynamic System Tray**: Complete control menu with live track info, playback controls, monitor selection, anchor positioning, and quick display presets.

---

## ⌨️ Global Shortcuts

| Shortcut | Action | Description |
|---|---|---|
| `Ctrl + Shift + X` | **Toggle Click-Through** | Switch between interactive HUD and mouse passthrough |
| `Ctrl + Shift + H` | **Toggle Visibility** | Show or hide the overlay window |
| `Ctrl + Shift + K` | **Toggle Karaoke Mode** | Switch between smooth karaoke wipe and solid theme glow |
| `Ctrl + Shift + Space`| **Play / Pause** | Control Spotify playback |
| `Ctrl + Shift + M` | **Cycle Monitor** | Switch HUD between connected displays |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Rust** & **Cargo** (latest stable)
- **Spotify** desktop client running
- Linux: `playerctl` and `dbus` (for MPRIS playback integration)

### Installation & Build

```bash
# Clone repository
git clone https://github.com/<your-username>/spotify-lyrics-hud.git
cd spotify-lyrics-hud

# Install dependencies
npm install

# Run unit & integration test suite (105 tests)
npm test

# Build frontend and Rust native binary
npm run build && npm run build:ui && npx tauri build --no-bundle

# Install binary to ~/.local/bin
cp src-tauri/target/release/desktop-overlay ~/.local/bin/spotify-lyrics-hud
```

### Running

```bash
~/.local/bin/spotify-lyrics-hud &
```

---

## 🛠️ Architecture & Tech Stack

- **Framework**: [Tauri v2](https://v2.tauri.app/) (Rust backend + Web frontend)
- **Frontend**: [Svelte](https://svelte.dev/) with TypeScript & [Tailwind CSS v4](https://tailwindcss.com/)
- **Lyrics Provider**: Synchronized LRC parser powered by [LRCLIB](https://lrclib.net/)
- **IPC & Media**: Linux D-Bus MPRIS client with zero external dependencies
- **Window Management**: Wayland layer-shell protocol & Hyprland UNIX domain socket IPC

---

## 📄 License

MIT License © 2026
