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

