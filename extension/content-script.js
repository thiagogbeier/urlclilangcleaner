(() => {
  'use strict';

  const cleaner = window.urlLocaleCleaner;
  if (!cleaner) {
    return;
  }

  function maybeCleanUrl(rawText) {
    const result = cleaner.sanitizeUrl(rawText);
    if (!result || !result.changed) {
      return null;
    }

    return result.value;
  }

  function getActiveInputSelection() {
    const activeElement = document.activeElement;
    if (!activeElement) {
      return '';
    }

    const isTextInput = activeElement instanceof HTMLInputElement && activeElement.type !== 'password';
    const isTextarea = activeElement instanceof HTMLTextAreaElement;

    if (!isTextInput && !isTextarea) {
      return '';
    }

    const start = activeElement.selectionStart ?? 0;
    const end = activeElement.selectionEnd ?? 0;
    if (end <= start) {
      return '';
    }

    return activeElement.value.slice(start, end);
  }

  function getClipboardCandidate(event) {
    const fromInput = getActiveInputSelection();
    if (fromInput) {
      return fromInput;
    }

    const selection = window.getSelection();
    if (selection && selection.toString()) {
      return selection.toString();
    }

    const data = event.clipboardData?.getData('text/plain');
    return data || '';
  }

  function handleCopyEvent(event) {
    if (!event.clipboardData) {
      return;
    }

    const candidate = getClipboardCandidate(event);
    const cleaned = maybeCleanUrl(candidate);
    if (!cleaned) {
      return;
    }

    event.preventDefault();
    event.clipboardData.setData('text/plain', cleaned);
    try {
      event.clipboardData.setData('text/html', cleaned);
    } catch (_error) {
      // Some browsers may block writing HTML; fall through.
    }
  }

  ['copy', 'cut'].forEach((type) => {
    document.addEventListener(type, handleCopyEvent, true);
  });
})();
