(() => {
  'use strict';

  const LOCALE_DOMAINS = new Set([
    'learn.microsoft.com',
    'docs.microsoft.com',
    'support.microsoft.com',
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
