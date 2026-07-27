# 🌐 Aura Browser (Chromium Desktop Web Browser)

A modern, fast, and feature-rich desktop web browser powered by the **Chromium** rendering engine (Blink & V8) built with Electron and HTML5/CSS3/JS.

![Chromium Engine](https://img.shields.io/badge/Engine-Chromium%20Blink-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20x64-0284c7?style=for-the-badge)

---

## ✨ Features

- ⚡ **Chromium Engine Core**: Powered by Electron's native Blink rendering engine and V8 JavaScript engine with isolated sandboxing.
- 🎨 **Glassmorphic Dark Theme**: Modern dark aesthetic with smooth micro-animations, glow accents, and responsive layout.
- 🗂️ **Multi-Tab System**: Dynamic tab creation (`+`), switching, titles, favicons, text clipping, and tab closing (`×`).
- 🛡️ **Privacy & Ad Shield**: Intercepts known ad/tracker network requests with a live blocked count counter badge and toggle button.
- 🔍 **Find in Page (`Ctrl+F`)**: Floating search widget with active match ordinal counter ("1 of 8"), next/prev navigation, and ESC shortcut.
- 🔎 **Page Zoom Controls**: Adjust magnification dynamically (`100%`, `+`, `-`) or reset via `Ctrl+0`.
- 🔊 **Tab Audio Muting**: Detects audio playback on any tab with a click-to-mute speaker indicator (`🔊` / `🔇`).
- 🔖 **Bookmarks Bar**: Toggle star button (`★`) to bookmark sites, with a quick access bookmark toolbar.
- 📜 **Browsing History Drawer**: Searchable history drawer with date/time timestamps and one-click clear history.
- 📥 **Downloads Tracker**: Progress indicator drawer for active and completed file downloads.
- 🛠️ **Chromium DevTools (`F12`)**: Full Developer Tools inspector integration for web pages.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + T` | Open New Tab |
| `Ctrl + W` | Close Active Tab |
| `Ctrl + Tab` | Switch to Next Tab |
| `Ctrl + L` | Focus Address Bar |
| `Ctrl + R` / `F5` | Reload Current Page |
| `Ctrl + F` | Open Find in Page Bar |
| `Ctrl + +` / `Ctrl + =` | Zoom In |
| `Ctrl + -` | Zoom Out |
| `Ctrl + 0` | Reset Zoom to 100% |
| `Ctrl + H` | Toggle Browsing History |
| `Ctrl + Shift + B` | Toggle Bookmarks Bar |
| `F12` | Open Chromium DevTools |
| `Escape` | Dismiss Find in Page Bar |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ and npm installed

### Development Mode

```bash
# Clone the repository
git clone https://github.com/MicahGentry1/aura-browser.git
cd aura-browser

# Install dependencies
npm install

# Start the application
npm start
```

### Packaging into Standalone Windows Executable (.exe)

```bash
# Build standalone Windows .exe package
npm run build:exe
```

The compiled standalone application will be generated in `dist/Aura Browser-win32-x64/Aura Browser.exe`.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
