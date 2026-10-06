| Task ID | Task Description | Status | Dependencies |
|---|---|---|---|
| TASK-01 | Step 1 & 2: Repository & Framework Analysis, create docs/architecture/overlay-platform.md | Completed | None |
| TASK-02 | Step 3: Define Platform-Neutral Interfaces & Types (Core Intent, Placement, Display, Fullscreen, Capabilities) | Completed | TASK-01 |
| TASK-03 | Step 4: Core Implementation (Layout/Anchored Positioning Engine, Policies, Desired-State Reconciler) | Completed | TASK-02 |
| TASK-04 | Step 5: Linux / Wayland Adapter Implementation (layer-shell, wl_output, input region, scaling) | Completed | TASK-03 |
| TASK-05 | Step 6: Hyprland Integration Layer (IPC socket, active monitor, workspace, fullscreen client detection) | Completed | TASK-04 |
| TASK-06 | Step 7: Windows / Win32 Adapter Implementation (HWND, styles, DWM, monitor APIs, fullscreen detection) | Completed | TASK-03 |
| TASK-07 | Step 8: Comprehensive Unit & Integration Tests (Positioning, Monitors, Fullscreen, Reconciliation) | Completed | TASK-04, TASK-05, TASK-06 |
| TASK-08 | Step 9: Architecture Review, Static Analysis & Leakage Auditing | Completed | TASK-07 |
| TASK-09 | Step 10: Complete System Documentation (windowing, multi-monitor, fullscreen, linux-wayland, windows) | Completed | TASK-08 |
| TASK-10 | UI: Setup Svelte, Vite, and Tailwind CSS Dependencies & Config | Completed | TASK-09 |
| TASK-11 | UI: Karaoke Timing & Synchronization Engine | Completed | TASK-10 |
| TASK-12 | UI: Reactive State Stores & OverlayEngine Bridge | Completed | TASK-11 |
| TASK-13 | UI: Svelte UI Components (LyricsLine, Scroller, TrackHeader, StatusBadge, HUD) | Completed | TASK-12 |
| TASK-14 | UI: App Entry Point, HTML Shell & Transparent Setup | Completed | TASK-13 |
| TASK-15 | UI: End-to-End Verification & Build Check | Completed | TASK-14 |
| TASK-16 | Data: Core Data Models & LRC Parser | Completed | TASK-15 |
| TASK-17 | Data: LRCLIB Lyrics Provider | Completed | TASK-16 |
| TASK-18 | Data: High-Precision Playback Clock | Completed | TASK-17 |
| TASK-19 | Data: Linux DBus MPRIS Client | Completed | TASK-18 |
| TASK-20 | Data: SpotifyService Orchestrator & UI Bridge | Completed | TASK-19 |
| TASK-21 | Data: Full Verification & Live Demonstration | Completed | TASK-20 |
| TASK-22 | System: System Types & Contracts | Completed | TASK-21 |
| TASK-23 | System: HotkeyManager & Action Dispatcher | Completed | TASK-22 |
| TASK-24 | System: Dynamic Tray Menu Builder & Manager | Completed | TASK-23 |
| TASK-25 | System: SystemController Orchestrator | Completed | TASK-24 |
| TASK-26 | System: Full Verification & Demonstration | Completed | TASK-25 |
| TASK-27 | Tauri: Project Configuration & Rust Scaffolding | Completed | TASK-26 |
| TASK-28 | Tauri: Rust Native Window & Display IPC Commands | Completed | TASK-27 |
| TASK-29 | Tauri: Rust Native Tray & Global Shortcut Integration | Completed | TASK-28 |
| TASK-30 | Tauri: TypeScript Tauri Platform Adapter & Tests | Completed | TASK-29 |
| TASK-31 | Tauri: Full Integration & Compilation Verification | Completed | TASK-30 |
| TASK-32 | Fix missing lyrics in HUD (subscriber replay, metadata fields, lifecycle order) & verify live | Completed | TASK-31 |
| TASK-33 | Karaoke Mode Toggle (ON/OFF) & HUD Dimensions Optimization | Completed | TASK-32 |
| TASK-34 | Display Settings Panel (Typography, Alignment, Spacing, Dimming, Themes) & 3-Line Centered Layout | Completed | TASK-33 |
| TASK-35 | Refine Left and Right Lyrics Alignment, Padding & Typography Hierarchy | Completed | TASK-34 |
| TASK-36 | Auto-Prepend Intro Empty Line to Keep First Sung Lyric Centered | Completed | TASK-35 |
| TASK-37 | Native Web Anchor Scrolling (scrollIntoView to #lyric-id with scroll-smooth) | Completed | TASK-36 |
| TASK-38 | Pure CSS GPU Hardware-Accelerated Smooth Translation (600ms cubic-bezier ease-out) | Completed | TASK-37 |
| TASK-39 | HUD Global Scale Settings (0.5x, 0.75x, 1.0x, 1.25x, 1.5x) & Window Dynamic Sizing | Completed | TASK-38 |
| TASK-40 | Proportional Canvas CSS Transform Scaling (750x275 Reference) & Hyprland Window Resize | Completed | TASK-39 |
| TASK-41 | In-Place Window Resizing (set_overlay_size) Preserving User Screen Coordinates | Completed | TASK-40 |
| TASK-42 | Rust: Add sabiyomi dependency & implement romaji module with unit tests | Completed | TASK-41 |
| TASK-43 | Rust: Register convert_lyrics_to_romaji Tauri command | Completed | TASK-42 |
| TASK-44 | UI: Add japaneseMode to DisplaySettings store & tests | Completed | TASK-43 |
| TASK-45 | Data: Attach romaji property to LyricLine in tauri-bootstrap | Completed | TASK-44 |
| TASK-46 | UI: Implement Dual Mode with Simultaneous Karaoke Sweep in LyricsLine.svelte | Completed | TASK-45 |
| TASK-47 | UI: Add Japanese Lyrics mode selector to SettingsModal.svelte | Completed | TASK-46 |
| TASK-48 | Verification: End-to-end testing, local compilation & live verification | Completed | TASK-47 |
| TASK-49 | Rust: Native Multi-Artist Enrichment Module & Regex Parser with Unit Tests | Completed | TASK-48 |
| TASK-50 | Tauri: Register enrich_track_metadata IPC Command & Track ID Sanitizer | Completed | TASK-49 |
| TASK-51 | Data: Sanitize DBus MPRIS Track ID in dbus-mpris.ts & Unit Tests | Completed | TASK-50 |
| TASK-52 | UI: Asynchronous Enrichment Pipeline with Race Prevention & LRCLIB Fallback | In Progress | TASK-51 |
| TASK-53 | Release: Bump to v0.2.6, Full Verification, Local Deployment & Release Matrix Push | Pending | TASK-52 |
