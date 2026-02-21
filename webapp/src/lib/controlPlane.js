const CONTROL_API_BASE = (import.meta.env.VITE_AXION_CONTROL_URL || 'https://api.axionenterprise.cloud/api').replace(/\/+$/, '');
const APP_ID = 'axion-pay';
const SESSION_KEY = `${APP_ID}:session-id`;
const START_KEY = `${APP_ID}:session-start`;

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`).toString();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getSessionStartedAt() {
  let raw = sessionStorage.getItem(START_KEY);
  if (!raw) {
    raw = String(Date.now());
    sessionStorage.setItem(START_KEY, raw);
  }
  return Number(raw);
}

function normalizeUtm() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
    gclid: params.get('gclid') || '',
    fbclid: params.get('fbclid') || '',
    ttclid: params.get('ttclid') || '',
  };
}

export async function trackEvent(eventType, eventName, metadata = {}) {
  const body = {
    appId: APP_ID,
    sessionId: getSessionId(),
    eventType,
    eventName,
    path: window.location.pathname,
    referrer: document.referrer || '',
    ...normalizeUtm(),
    metadata,
  };
  try {
    await fetch(`${CONTROL_API_BASE}/control/ingest/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(body),
    });
  } catch {
  }
}

export async function loadPublicConfig(env = 'prod', locale = 'pt-BR') {
  try {
    const resp = await fetch(`${CONTROL_API_BASE}/control/config/${APP_ID}?env=${encodeURIComponent(env)}&locale=${encodeURIComponent(locale)}`);
    if (!resp.ok) return {};
    const data = await resp.json();
    return data?.payload || {};
  } catch {
    return {};
  }
}

export function getCopy(payload, namespace, key, fallback) {
  const ns = payload?.[namespace];
  if (ns && Object.prototype.hasOwnProperty.call(ns, key)) {
    return ns[key];
  }
  return fallback;
}

export function setupGlobalTracking() {
  getSessionId();
  getSessionStartedAt();

  const onClick = (event) => {
    const target = event.target instanceof Element ? event.target.closest('a,button,[data-axion-track]') : null;
    if (!target) return;
    const label =
      target.getAttribute('data-axion-track') ||
      target.getAttribute('aria-label') ||
      (target.textContent || '').trim().slice(0, 120) ||
      'unknown';
    trackEvent('click', 'ui_click', { label, tag: target.tagName.toLowerCase(), href: target.getAttribute('href') || '' });
  };

  const onBeforeUnload = () => {
    const startedAt = getSessionStartedAt();
    const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    const payload = {
      appId: APP_ID,
      sessionId: getSessionId(),
      eventType: 'session',
      eventName: 'session_end',
      path: window.location.pathname,
      referrer: document.referrer || '',
      ...normalizeUtm(),
      metadata: { durationSec },
    };
    try {
      navigator.sendBeacon?.(`${CONTROL_API_BASE}/control/ingest/events`, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    } catch {
    }
  };

  const onError = (event) => {
    const message = event?.message || event?.error?.message || 'window_error';
    trackEvent('error', 'window_error', {
      message: String(message).slice(0, 500),
      stack: String(event?.error?.stack || '').slice(0, 1000),
      source: event?.filename || '',
      line: event?.lineno || null,
      column: event?.colno || null,
    });
  };

  const onUnhandledRejection = (event) => {
    const reason = event?.reason;
    trackEvent('error', 'unhandled_rejection', {
      message: String(reason?.message || reason || 'unhandled_rejection').slice(0, 500),
      stack: String(reason?.stack || '').slice(0, 1000),
    });
  };

  document.addEventListener('click', onClick, true);
  window.addEventListener('beforeunload', onBeforeUnload);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  return () => {
    document.removeEventListener('click', onClick, true);
    window.removeEventListener('beforeunload', onBeforeUnload);
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onUnhandledRejection);
  };
}
