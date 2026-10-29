# Internee Scout 🇪🇬 — Feed Internship Detector Extension

A lightweight, privacy-friendly Manifest V3 browser extension for Google Chrome, Brave, Edge, and Arc that passively scouts and self-reports Egyptian internship opportunities while you scroll LinkedIn and X (Twitter).

---

## ⚡ How It Works

1. **Passive Feed Monitoring**:
   - Uses a non-intrusive `MutationObserver` operating at human scroll speeds (~1.2s debounce).
   - Monitors your feed for posts matching internship keywords (`intern`, `internship`, `تدريب`, `متدرب`) alongside Egyptian location signals (`Cairo`, `Egypt`, `Giza`, `Maadi`, `New Cairo`, `Alexandria`, `6th of October`, `Google Forms`, etc.).
2. **Instant Local Reporting**:
   - When a matching post is found, it automatically submits the URL to your local or deployed Internee tracker via `/api/community/quick-drop`.
   - Displays a sleek matte-black floating toast in the lower right corner confirming the sighting.
3. **Smart Deduplication**:
   - Strips tracking query parameters (`?refId=...`, `?s=...`) and caches seen IDs locally in `chrome.storage.local` to prevent duplicate submissions.

---

## 🚀 Installation Guide (Chrome / Brave / Edge)

1. Open your Chromium-based browser and navigate to the Extensions page:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
2. Enable **Developer mode** (toggle switch located at the top right corner).
3. Click **Load unpacked** in the top left.
4. Select the `extension/` folder inside this repository:
   ```
   /home/abdulrahman/Internee/extension
   ```
5. The extension **Internee Scout 🇪🇬** will now appear in your browser extension toolbar!

---

## ⚙️ Configuration & Settings

Click on the extension icon in your browser toolbar to open the settings popup:

- **Target API Endpoint**:
  - Default: `http://localhost:3000` (for local development).
  - Can be updated to your deployed production URL (e.g. `https://your-domain.vercel.app`).
- **Scout Handle / Credit**:
  - Enter your handle or name (e.g., `@ahmed_dev`) so submissions are credited to you in the Internee community feed.
- **Spotted Counter**:
  - Live count of postings detected and submitted during your browsing sessions.

---

## 🛡️ Privacy & Permissions

- **Local Processing**: All regex analysis happens directly inside your browser on the DOM.
- **No Background Polling or Scraping**: The extension does not perform automated requests to LinkedIn or Twitter servers; it only listens to what is rendered on your active feed as you scroll.
- **Permissions**:
  - `storage`: For remembering your settings and deduplicated URLs.
  - `host_permissions`: Access limited to `linkedin.com`, `x.com`, `twitter.com`, and your target Internee API host.
