# LinkVault browser extension

Save the current tab to your LinkVault library with one click, or right-click any link → "Save to LinkVault". Reuses the same `/api/save` token-authenticated endpoint built for the iOS Shortcut — no backend changes required.

## Install (unpacked, Chrome/Edge/Brave)

1. Go to `chrome://extensions` (or `edge://extensions`), enable **Developer mode**.
2. Click **Load unpacked**, select this `browser-extension/` folder.
3. Click the LinkVault icon in the toolbar → **Open options**.
4. On your LinkVault deployment, go to **Settings** and generate an API token.
5. In the extension's options page, enter your deployment URL (e.g. `https://your-app.vercel.app`) and paste the token. Save.
6. Approve the permission prompt for that domain — the extension only requests access to the one URL you configure, not all sites.

## Use

- Click the toolbar icon on any page → **Save to LinkVault** (optionally add a note first).
- Or right-click a page or a specific link → **Save to LinkVault**. A notification confirms success/failure.

## Notes

- The API token is stored in `chrome.storage.local` (this device only, never synced) — the same threat model as any other password manager or API-key-holding extension.
- `icons/generate-icons.mjs` regenerates the toolbar icons from code (no binary assets to hand-edit), matching the main app's `next/og`-generated icons.
