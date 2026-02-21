/* global chrome */

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
  await import('./url-cleaner.js');

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

initializeExtension();
