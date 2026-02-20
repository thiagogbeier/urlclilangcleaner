# URL Locale Cleaner Extension

A lightweight Manifest V3 browser extension that watches for copy or cut events inside webpages and automatically removes common language or marketing segments from URLs before they reach your clipboard. When you highlight a link such as `https://learn.microsoft.com/en-gb/azure/virtual-machines/overview` and press **Ctrl+C**, the extension rewrites it to `https://learn.microsoft.com/azure/virtual-machines/overview` so the server can redirect recipients to their preferred locale.

## Features

- Strips leading locale path segments (for example `en-us`, `pt-br`, `zh-hant`) on popular documentation domains such as `learn.microsoft.com` and `developer.mozilla.org`.
- Removes noisy marketing query parameters (e.g., `WT.mc_id`, `ocid`, `gclid`, `msclkid`) so shared links stay clean and privacy-friendly.
- Runs entirely on the client: no network calls, analytics, or storage.
- Works anywhere inside a webpage (static text, editable fields, rich text editors) without requiring any UI.
- Adds a toolbar popup that shows the original vs. cleaned URL with quick-copy buttons for each.
- Keeps the page context-menu entry labeled **Copy Clean URL** for one-click copying and flashes a badge confirmation so you know it hit the clipboard.

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
2. Click the extension's toolbar icon to open the popup.
3. Review the **Original** and **Cleaned** URLs, then press **Copy** on the one you want.
4. Right-click the page and choose **Copy Clean URL** for a one-click copy with a badge confirmation.

## Customizing Domains or Parameters

- The domain allowlist, locale pattern, and query-parameter blocklist live in `extension/url-cleaner.js`.
- Add or remove entries to tailor the cleaner to your own documentation sources.
- After editing the file, reload the extension from the browser's extension page to apply the changes.

## Development Tips

- All logic currently resides in the content script so you can iterate quickly without bundlers.
- If you need background logic (e.g., popup UI, options page), extend the manifest and keep scripts in the `extension` directory.
- For production distribution, remember to bump the version in `manifest.json` and package the folder as instructed by the target browser store.
