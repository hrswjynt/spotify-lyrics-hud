# Contributing to Spotify Lyrics HUD

Thank you for considering contributing to **Spotify Lyrics HUD**!

---

## 🛠️ Development Setup

1. **Fork and clone the repo**:
   ```bash
   git clone https://github.com/hrswjynt/spotify-lyrics-hud.git
   cd spotify-lyrics-hud
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

4. **Run Vite development server**:
   ```bash
   npm run dev:ui
   ```

5. **Run Tauri in development mode**:
   ```bash
   npm run dev:tauri
   ```

---

## 📋 Guidelines

- **Code Quality**: Follow existing TypeScript and Rust formatting standards.
- **Testing**: Ensure all 105 tests pass (`npm test`) before submitting PRs. If adding new features, write corresponding tests under `tests/`.
- **Commits**: Use conventional commits (e.g. `feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).

---

## 🐛 Reporting Bugs & Suggestions

Open an issue on GitHub with:
- Desktop environment (e.g. Hyprland, Sway, KDE, GNOME, or Windows)
- Spotify version and output of `playerctl metadata`
- Clear steps to reproduce the issue
