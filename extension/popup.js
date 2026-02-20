/* global chrome */

(() => {
  'use strict';

  const statusEl = document.getElementById('status');
  const originalEl = document.getElementById('original');
  const cleanedEl = document.getElementById('cleaned');
  const copyButtons = Array.from(document.querySelectorAll('.copy'));

  function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#b91c1c' : '#2563eb';
  }

  async function getActiveTabUrl() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    return tab && tab.url ? tab.url : '';
  }

  function updateButtons(enabled) {
    copyButtons.forEach((button) => {
      button.disabled = !enabled;
    });
  }

  function fallbackCopy(value) {
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

  async function copyText(value) {
    if (!value) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_error) {
      const copied = fallbackCopy(value);
      if (!copied) {
        console.error('URL Locale Cleaner: popup copy failed');
      }
      return copied;
    }
  }

  async function handleCopyClick(event) {
    const target = event.currentTarget;
    const source = target.getAttribute('data-copy');
    const value = source === 'cleaned' ? cleanedEl.value : originalEl.value;

    const success = await copyText(value);
    if (success) {
      setStatus('Copied to clipboard.');
    } else {
      setStatus('Copy failed. Check clipboard permissions.', true);
    }
  }

  async function init() {
    updateButtons(false);
    setStatus('Loading...');

    const url = await getActiveTabUrl();
    if (!url) {
      originalEl.value = 'No active tab URL.';
      cleanedEl.value = 'No active tab URL.';
      setStatus('Open a tab with a URL to use the cleaner.', true);
      return;
    }

    originalEl.value = url;

    const cleaner = window.urlLocaleCleaner;
    const result = cleaner ? cleaner.sanitizeUrl(url) : null;
    if (result) {
      cleanedEl.value = result.value;
      setStatus(result.changed ? 'Ready to copy cleaned URL.' : 'URL already clean.');
    } else {
      cleanedEl.value = url;
      setStatus('URL not eligible for cleaning.', true);
    }

    updateButtons(true);
  }

  copyButtons.forEach((button) => {
    button.addEventListener('click', handleCopyClick);
  });

  init();
})();
