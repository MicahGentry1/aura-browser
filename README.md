# 🌐 Aura Browser (Chromium Desktop Web Browser)

A modern, fast, and feature-rich desktop web browser powered by the **Chromium** rendering engine (Blink & V8) built with Electron and HTML5/CSS3/JS.

![Chromium Engine](https://img.shields.io/badge/Engine-Chromium%20Blink-6366f1?style=for-the-badge)
![Extensions](https://img.shields.io/badge/Extensions-Chrome%20Web%20Store-818cf8?style=for-the-badge)
![Release](https://img.shields.io/badge/Release-v1.0.3-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20x64-0284c7?style=for-the-badge)

---

### 📦 [Download AuraBrowserSetup.exe (v1.0.3)](https://github.com/MicahGentry1/aura-browser/releases/download/v1.0.3/AuraBrowserSetup.exe)

> [!NOTE]
> **Windows SmartScreen / Defender Notice**:
> If Windows SmartScreen displays a *"Windows protected your PC"* or *"Unknown Publisher"* alert when running the installer or executable, **it is 100% safe and NOT a virus**.
> This warning appears on new open-source software that does not use a paid commercial Code Signing Certificate.
> 
> **How to bypass**: Click **"More info"** $\rightarrow$ **"Run anyway"**.

---

## ✨ Features

- ⚡ **Chromium Engine Core**: Powered by Electron's native Blink rendering engine and V8 JavaScript engine with isolated sandboxing.
- 🛒 **Direct Chrome Web Store Extension Installation**: Download and install extensions directly from the Chrome Web Store with automatic CRX extraction and persistent loading. Includes one-click banner detection when visiting Web Store pages!
- 🔒 **Tab Pinning**: Right-click any tab to pin it. Pinned tabs shrink to a compact favicon-only view and stay locked to the left side of the tab bar.
- 📸 **Page Screenshot (`Ctrl+Shift+S`)**: Instantly capture and download the current page as a PNG image with visual flash feedback.
- 🖼️ **Picture-in-Picture Mode**: Pop out any video on the current page into a floating PiP window that stays on top.
- 📖 **Reading Mode**: Strip away page clutter and view articles in clean, distraction-free serif typography on a dark background.
- 🔄 **Auto-Updater**: Built-in update checker that polls GitHub Releases for new versions with one-click download and install.
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
| `Ctrl + Shift + S` | Screenshot Current Page |
| `Ctrl + +` / `Ctrl + =` | Zoom In |
| `Ctrl + -` | Zoom Out |
| `Ctrl + 0` | Reset Zoom to 100% |
| `Ctrl + H` | Toggle Browsing History |
| `Ctrl + Shift + B` | Toggle Bookmarks Bar |
| `F12` | Open Chromium DevTools |
| `Escape` | Dismiss Find in Page Bar |
| `Right-Click Tab` | Pin / Unpin Tab |

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

