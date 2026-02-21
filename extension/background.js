/* global chrome */

// Inline URL cleaner logic
(() => {
  'use strict';

  const LOCALE_DOMAINS = new Set([
    'experienceleague.adobe.com',
    'developer.mozilla.org',
    'help.sap.com',
    'support.google.com',
    'aws.amazon.com'
  ]);

  const QUERY_PARAMS_TO_DROP = new Set([
    'wt.mc_id',
    'ocid',
    'cjid',
    'ef_id',
    'mkt',
    'gclid',
    'msclkid',
    'fbclid'
  ]);

  const HTTP_PROTOCOLS = new Set(['http:', 'https:']);
  const localeSegmentPattern = /^[a-z]{2}(?:-[a-z0-9]{2,8}){0,2}$/i;

  function normalizeHost(host) {
    return host.replace(/^www\./i, '').toLowerCase();
  }

  function hostSupportsLocaleStripping(host) {
    const normalized = normalizeHost(host);
    
    // Check for Microsoft domains
    if (normalized === 'microsoft.com' || normalized.endsWith('.microsoft.com')) {
      return true;
    }
    
    if (LOCALE_DOMAINS.has(normalized)) {
      return true;
    }

    const parts = normalized.split('.');
    if (parts.length > 2) {
      const withoutFirst = parts.slice(1).join('.');
      return LOCALE_DOMAINS.has(withoutFirst);
    }

    return false;
  }

  function dropLocaleSegment(url) {
    if (!hostSupportsLocaleStripping(url.host)) {
      return false;
    }

    const segments = url.pathname.split('/');
    if (segments.length <= 1) {
      return false;
    }

    const firstSegmentIndex = segments.findIndex((segment, index) => index > 0 && segment.length > 0);
    if (firstSegmentIndex === -1) {
      return false;
    }

    const candidate = segments[firstSegmentIndex];
    if (!localeSegmentPattern.test(candidate)) {
      return false;
    }

    segments.splice(firstSegmentIndex, 1);
    let newPath = segments.join('/');
    if (newPath === '') {
      newPath = '/';
    }

    url.pathname = newPath;
    return true;
  }

  function dropNoiseQueryParams(url) {
    const params = Array.from(url.searchParams.keys());
    let changed = false;

    params.forEach((key) => {
      if (QUERY_PARAMS_TO_DROP.has(key.toLowerCase())) {
        url.searchParams.delete(key);
        changed = true;
      }
    });

    return changed;
  }

  function cleanUrlObject(url) {
    let mutated = dropLocaleSegment(url);
    mutated = dropNoiseQueryParams(url) || mutated;

    return {
      changed: mutated,
      value: url.toString()
    };
  }

  function sanitizeUrl(rawText) {
    if (!rawText) {
      return null;
    }

    const trimmed = rawText.trim();
    if (!trimmed || /\s/.test(trimmed)) {
      return null;
    }

    let url;
    try {
      url = new URL(trimmed);
    } catch (_error) {
      return null;
    }

    if (!HTTP_PROTOCOLS.has(url.protocol)) {
      return null;
    }

    const { changed, value } = cleanUrlObject(url);
    return { changed, value };
  }

  self.urlLocaleCleaner = {
    sanitizeUrl
  };
})();

const MENU_ID = 'copy-clean-url';
const BADGE_CLEAR_DELAY_MS = 1500;
const badgeTimers = new Map();

function showCopyFeedback(tabId, changed) {
  if (!tabId) {
    return;
  }

  const text = changed ? 'CLEAN' : 'OK';
  const color = changed ? '#2563eb' : '#16a34a';

  chrome.action.setBadgeBackgroundColor({ tabId, color });
  chrome.action.setBadgeText({ tabId, text });

  const previousTimer = badgeTimers.get(tabId);
  if (previousTimer) {
    clearTimeout(previousTimer);
  }

  const timer = setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: '' });
    badgeTimers.delete(tabId);
  }, BADGE_CLEAR_DELAY_MS);

  badgeTimers.set(tabId, timer);
}

async function copyTextViaPage(tabId, text) {
  if (!tabId || !text) {
    return false;
  }

  try {
    const [injectionResult] = await chrome.scripting.executeScript({
      target: { tabId },
      func: async (value) => {
        try {
          await navigator.clipboard.writeText(value);
          return true;
        } catch (_error) {
          const textarea = document.createElement('textarea');
          textarea.value = value;
          textarea.style.position = 'fixed';
          textarea.style.top = '0';
          textarea.style.left = '0';
          textarea.style.width = '1px';
          textarea.style.height = '1px';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          const copied = document.execCommand('copy');
          textarea.remove();
          return copied;
        }
      },
      args: [text],
      injectImmediately: false
    });

    return Boolean(injectionResult && injectionResult.result);
  } catch (error) {
    console.error('URL Locale Cleaner: failed to copy to clipboard', error);
    return false;
  }
}

async function copyCleanUrlForTab(tab) {
  if (!tab || !tab.url) {
    return;
  }

  const cleaner = self.urlLocaleCleaner;
  if (!cleaner) {
    return;
  }

  const result = cleaner.sanitizeUrl(tab.url);
  if (!result) {
    return;
  }

  const copied = await copyTextViaPage(tab.id, result.value);
  if (copied) {
    showCopyFeedback(tab.id, Boolean(result.changed));
  }
}

async function initializeExtension() {
  chrome.action.onClicked.addListener((tab) => {
    copyCleanUrlForTab(tab);
  });

  chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Copy Clean URL',
      contexts: ['action', 'page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_ID) {
      copyCleanUrlForTab(tab);
    }
  });
}

initializeExtension();
