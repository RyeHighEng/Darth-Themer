![Logo](logo.png)

# Web Themer Chrome Extension

A Manifest V3 Chrome extension that applies theme and font overrides to websites.

## Features

- Per-site enable/disable toggle.
- Theme presets (Ghostty Hotline Miami, Purple Rain, Windows 98, Slate, Paper).
- Optional font family and font size overrides (leave blank to keep site defaults).
- Optional custom CSS overrides.
- Global defaults and site-specific overrides.

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `themes/chrome-web-themer`.

## Use

1. Open a regular website tab.
2. Click the **Web Themer** extension icon.
3. Set theme/font values and click **Save for this site**.
4. Use **Open global settings** to adjust defaults and manage saved site overrides.

## Notes

- Chrome internal pages (like `chrome://`), the Chrome Web Store, and some protected pages cannot be themed.
- Aggressive site CSS can occasionally conflict with global overrides; use custom CSS to refine per site.
- `Windows 98` is a full retro restyle; `Ghostty` and `Purple Rain` are palette-focused themes.
