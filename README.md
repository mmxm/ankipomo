# ⚡ AnkiPomo

AnkiPomo is a minimalist, offline-capable Pomodoro timer web app designed to run side-by-side with Anki Desktop. It tracks card reviews in real-time and launches hot air balloons as a visual reward for each completed card.

![AnkiPomo Screenshot](./screenshot.png)

## ✨ Features

- **Pomodoro Timer**: Focus & Break cycles with Web Audio synthesizer chimes.
- **Visual Rewards**: Sunset sky pill with 3D parallax balloon flights triggered per review.
- **Interactive Sky**: Click the sky capsule to manually launch balloons.
- **Collapsible Stats**: Real-time review metrics, easily hidden via a toggle arrow.
- **PWA & Offline**: Fully installable standalone app, caching all assets offline.
- **macOS Automation (`launch.command`)**: Double-click shortcut to run the local server, open Anki, and tile both windows side-by-side (2/3 Anki, 1/3 Timer).

## 🛠️ Setup

### 1. Configure AnkiConnect
1. Install Anki Desktop add-on **`2055492159`**.
2. Add `http://localhost:5173` to `webCorsOriginList` in the add-on configuration.
3. Restart Anki.

### 2. Run Locally
```bash
npm install
npm run dev
```

### 3. Standalone App (PWA)
Open `http://localhost:5173` in Google Chrome and click the **Install App** icon in the address bar.
