# ⚡ AnkiPomo — Pomodoro Timer & Anki Reviews Integration

**AnkiPomo** is a minimalist and modern serverless Pomodoro web application designed to run side-by-side with **Anki Desktop**. It connects to Anki via the *AnkiConnect* add-on to track your card reviews in real-time during focus sessions, rewarding you with an elegant, number-free progress visual.

---

## 🚀 Key Features

- ⏱️ **Fluid Pomodoro Timer**: Alternates between **Focus** (indigo) and **Break** (purple) sessions with browser tab countdowns.
- 🔔 **Web Audio Synthesizer Chimes**: Crystal-clear bell sounds synthesized directly by the browser at the end of each session (no external audio assets required).
- 🎈 **"Air Balloon Cruise" Visual Reward**: An elegant weather-themed sky capsule featuring minimalist hills, a crescent moon, and a radiating sunset. Each reviewed card launches a hot air balloon with dynamic 3D depth parallax (speed and vertical layers scale realistically with size).
- 🖱️ **Interactive Easter Egg**: Hover and click anywhere inside the sky capsule to manually launch hot air balloons!
- 📊 **Collapsible Stats Dashboard**: Track total reviews, unique cards, average speed, and card rating breakdown (Again, Hard, Good, Easy). Quickly collapse the panel with a clean toggle arrow.
- 📦 **PWA & Offline Capability**: Fully installable as a standalone application on macOS or Windows (click the install icon in Chrome/Brave/Safari). Caches all assets via a Service Worker for 100% offline usage.
- 🖥️ **macOS Window Tiling & Server Auto-Start (`launch.command`)**: A double-clickable script that starts the local server in the background, opens Anki and AnkiPomo, and automatically tiles them side-by-side (Anki occupying the left 2/3, and AnkiPomo on the right 1/3).

---

## 🛠️ Installation & Setup

### 1. Anki Desktop Configuration
To link your review data with AnkiPomo, you must install and configure **AnkiConnect**:

1. In Anki Desktop, go to **Tools** > **Add-ons** > **Get Add-ons...** and paste the code: **`2055492159`**.
2. Select `AnkiConnect`, click **Config**, and add `http://localhost:5173` to the `webCorsOriginList` array:
   ```json
   {
       "webCorsOriginList": [
           "http://localhost",
           "http://localhost:5173"
       ]
   }
   ```
3. **Restart Anki** to apply the changes.

---

### 2. Local Setup & Running
Clone the repository and install the dependencies:

```bash
git clone https://github.com/mmxm/ankipomo.git
cd ankipomo
npm install
```

Start the local development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in Google Chrome.

---

### 3. Install as a Standalone App (PWA)
For a native, browser-less app feel:
1. In Chrome, click the **Install App** icon on the far right of the address bar (omnibox).
2. The application will be added to your macOS Applications folder/Launchpad and open in its own clean window.

---

## 🖥️ macOS Automation Script (`launch.command`)

To start your review session in one click:
1. Double-click the [launch.command](./launch.command) file in your project folder.
2. The script will automatically:
   - Start the local server in the background (if it isn't running).
   - Launch Anki Desktop.
   - Open AnkiPomo in its standalone app window.
   - Tile them side-by-side (Anki on the left 2/3, AnkiPomo on the right 1/3).

> *Note: On the first run, macOS will prompt you to grant Accessibility permissions to the Terminal in **System Settings > Privacy & Security > Accessibility** to allow window resizing.*
