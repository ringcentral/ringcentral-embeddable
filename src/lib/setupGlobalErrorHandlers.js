// Global safety net for otherwise-unhandled errors and promise rejections.
// Without this, failures like a webphone channel timeout only reach the console
// and the widget appears "unresponsive" with no user-visible feedback.

// Identifies logs as coming from this widget, which matters when it is embedded
// in a third-party host page alongside other scripts.
const LOG_PREFIX = '[RingCentral Embeddable]';

const DEFAULT_MESSAGE =
  'Something went wrong and your last action may not have completed. Please try again, and reload the page if the problem continues.';

// Benign browser noise with no user impact. These must never surface a banner
// (or a log) so we don't alarm users or bury real errors. The list mirrors the
// benign entries commonly filtered by error-monitoring tools (Sentry, TrackJS).
const IGNORED_ERRORS = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i, // opaque cross-origin errors with no actionable detail
  /Extension context invalidated/i,
];

// Suppress by origin, not just message: most long-tail noise comes from code
// that isn't ours (browser extensions, injected third-party scripts). Filtering
// the source is stable and avoids chasing individual error strings over time.
const IGNORED_ERROR_SOURCES = [
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  /safari-web-extension:\/\//i,
  /safari-extension:\/\//i,
];

// Map known technical errors to friendlier, actionable text. Keep this small;
// per-feature messaging still belongs at the relevant call sites.
const FRIENDLY_MESSAGES = [
  {
    match: (text) => text.includes('rc-widget-webphone-channel-v2-timeout'),
    message:
      'The phone did not respond in time. It may be active in another browser tab, or the connection was lost. Please reload the page and try again.',
  },
];

function extractText(error) {
  if (!error) {
    return '';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error.message) {
    return error.message;
  }
  try {
    return String(error);
  } catch (e) {
    return '';
  }
}

function isIgnored(text) {
  return IGNORED_ERRORS.some((pattern) => pattern.test(text));
}

function isIgnoredSource(source) {
  if (!source) {
    return false;
  }
  return IGNORED_ERROR_SOURCES.some((pattern) => pattern.test(source));
}

function getFriendlyMessage(text) {
  const matched = FRIENDLY_MESSAGES.find((item) => item.match(text));
  return matched ? matched.message : DEFAULT_MESSAGE;
}

/**
 * @param {{
 *   target?: any,
 *   getAlert?: () => any,
 *   logger?: { error: (...args: any[]) => void },
 *   throttleMs?: number,
 * }} [options]
 * @returns {() => void} cleanup that removes the listeners
 */
export function setupGlobalErrorHandlers({
  target = typeof window !== 'undefined' ? window : undefined,
  getAlert,
  logger = console,
  throttleMs = 5000,
} = {}) {
  if (!target || typeof target.addEventListener !== 'function') {
    return () => {};
  }
  const lastShownMap = new Map();

  const surface = (kind, error, sourceHint) => {
    const text = extractText(error);
    const source = `${sourceHint || ''}\n${(error && error.stack) || ''}`;
    if (isIgnored(text) || isIgnoredSource(source)) {
      return;
    }
    logger.error(`${LOG_PREFIX} ${kind}:`, error);

    const friendly = getFriendlyMessage(text);
    const now = Date.now();
    const lastShown = lastShownMap.get(friendly);
    if (lastShown !== undefined && now - lastShown < throttleMs) {
      return;
    }
    lastShownMap.set(friendly, now);

    let alert;
    try {
      alert = typeof getAlert === 'function' ? getAlert() : null;
    } catch (e) {
      alert = null;
    }
    if (!alert || typeof alert.alert !== 'function') {
      return;
    }
    try {
      alert.alert({
        level: 'danger',
        message: 'showCustomAlertMessage',
        ttl: 0,
        payload: {
          alertMessage: friendly,
          details: text
            ? [
                {
                  title: 'Technical details',
                  items: [{ type: 'text', text }],
                },
              ]
            : undefined,
        },
      });
    } catch (e) {
      logger.error(`${LOG_PREFIX} failed to surface alert`, e);
    }
  };

  const onUnhandledRejection = (event) => {
    surface('unhandledrejection', event && 'reason' in event ? event.reason : event);
  };
  const onError = (event) => {
    // Ignore resource load errors (img/script), which carry no JS error object.
    const error = event && (event.error || event.message);
    if (!error) {
      return;
    }
    surface('error', error, event && event.filename);
  };

  target.addEventListener('unhandledrejection', onUnhandledRejection);
  target.addEventListener('error', onError);

  return () => {
    target.removeEventListener('unhandledrejection', onUnhandledRejection);
    target.removeEventListener('error', onError);
  };
}
