# URL Locale Cleaner Extension

A lightweight Manifest V3 browser extension that watches for copy or cut events inside webpages and automatically removes common language or marketing segments from URLs before they reach your clipboard. When you highlight a link such as `https://learn.microsoft.com/en-gb/azure/virtual-machines/overview` and press **Ctrl+C**, the extension rewrites it to `https://learn.microsoft.com/azure/virtual-machines/overview` so the server can redirect recipients to their preferred locale.

## Features

- Strips leading locale path segments (for example `en-us`, `pt-br`, `zh-hant`) on popular documentation domains such as `learn.microsoft.com` and `developer.mozilla.org`.
- Removes noisy marketing query parameters (e.g., `WT.mc_id`, `ocid`, `gclid`, `msclkid`) so shared links stay clean and privacy-friendly.
- Runs entirely on the client: no network calls, analytics, or storage.
- Works anywhere inside a webpage (static text, editable fields, rich text editors) without requiring any UI.
- Adds a toolbar button and page context-menu entry labeled **Copy Clean URL** that instantly copies the current tab's normalized URL and flashes a badge confirmation so you know it hit the clipboard.

> **Limitations**
>
> - Browser extensions cannot intercept copies that originate from the address bar, context-menu "Copy link address", or other browser chrome. The extension only sees copy/cut events that happen inside the document itself.

## Installation

1. Clone or download this repository.
2. Open your browser's extension page and enable **Developer mode**.
3. Choose **Load unpacked** (Chrome / Edge) or **Load Temporary Add-on** (Firefox) and select the `extension` folder in this repo.
4. Reload any open tabs that should use the cleaner.

## Using the Toolbar Action

1. Navigate to any supported documentation page (for example, a localized Microsoft Learn article).
2. Click the extension's toolbar icon or right-click the page and choose **Copy Clean URL**.
3. Watch the icon briefly display **CLEAN** (or **OK** if nothing changed), then paste anywhere—the clipboard now carries the normalized link.
4. If the URL was already clean, the original value is copied unchanged.

## Customizing Domains or Parameters

- The domain allowlist, locale pattern, and query-parameter blocklist live in `extension/url-cleaner.js`.
- Add or remove entries to tailor the cleaner to your own documentation sources.
- After editing the file, reload the extension from the browser's extension page to apply the changes.

## Development Tips

- All logic currently resides in the content script so you can iterate quickly without bundlers.
- If you need background logic (e.g., popup UI, options page), extend the manifest and keep scripts in the `extension` directory.
- For production distribution, remember to bump the version in `manifest.json` and package the folder as instructed by the target browser store.
