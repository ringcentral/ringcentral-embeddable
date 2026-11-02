/**
 * Failure diagnostics for e2e runs. CI logs are public, so everything
 * recorded here is structural (routes, data-sign names, statuses) or
 * redacted text; page content, query strings and headers are never logged.
 */
const MAX_EVENTS = 30;
const MAX_TEXT_LENGTH = 160;
const SNAPSHOT_TIMEOUT_MS = 5000;
const WORKER_RESUME_INTERVAL_MS = 200;

// React dev warnings and resource errors (already logged as responses) would
// crowd out the events that explain a failure.
const IGNORED_CONSOLE_ERROR = /^(Warning:|Failed to load resource)/;

const eventsByContext = new WeakMap();

function redact(text) {
  return String(text)
    .replace(/%c/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '<email>')
    .replace(/\b(bearer|basic)\s+\S+/gi, '$1 <token>')
    .replace(/[\w~+/=.-]{24,}/g, '<token>')
    .replace(/\+?\d[\d\s().-]{5,}\d/g, '<number>')
    .slice(0, MAX_TEXT_LENGTH);
}

/** Keeps the path only, with ids masked, so hosts and query values stay out. */
function redactUrl(url) {
  try {
    const { pathname } = new URL(url);
    return pathname
      .split('/')
      .map((segment) =>
        /\d{3,}/.test(segment) || segment.length > 24 ? ':id' : segment,
      )
      .join('/');
  } catch {
    return '<invalid url>';
  }
}

function getEvents(context) {
  let events = eventsByContext.get(context);
  if (!events) {
    events = [];
    eventsByContext.set(context, events);
  }
  return events;
}

function record(context, source, message) {
  const events = getEvents(context);
  events.push(`${new Date().toISOString()} [${source}] ${message}`);
  if (events.length > MAX_EVENTS) {
    events.shift();
  }
}

function watchPage(context, page) {
  page.on('response', (response) => {
    if (response.status() >= 400) {
      record(
        context,
        'page',
        `${response.status()} ${response.request().method()} ${redactUrl(
          response.url(),
        )}`,
      );
    }
  });
  page.on('requestfailed', (request) => {
    record(
      context,
      'page',
      `failed ${request.method()} ${redactUrl(request.url())}: ${
        request.failure()?.errorText
      }`,
    );
  });
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !IGNORED_CONSOLE_ERROR.test(message.text())
    ) {
      record(context, 'page', `console.error ${redact(message.text())}`);
    }
  });
  page.on('pageerror', (error) => {
    record(context, 'page', `uncaught ${redact(error.message)}`);
  });
}

/** API traffic runs in the app's SharedWorker, which page events do not see. */
async function watchSharedWorker(context, target) {
  const session = await target.createCDPSession();
  const requests = new Map();
  session.on('Network.requestWillBeSent', ({ requestId, request }) => {
    requests.set(requestId, `${request.method} ${redactUrl(request.url)}`);
  });
  session.on('Network.responseReceived', ({ requestId, response }) => {
    if (response.status >= 400) {
      record(
        context,
        'worker',
        `${response.status} ${
          requests.get(requestId) ?? redactUrl(response.url)
        }`,
      );
    }
  });
  session.on('Network.loadingFinished', ({ requestId }) => {
    requests.delete(requestId);
  });
  session.on('Network.loadingFailed', ({ requestId, errorText, canceled }) => {
    if (!canceled) {
      record(
        context,
        'worker',
        `failed ${requests.get(requestId) ?? '<unknown>'}: ${errorText}`,
      );
    }
    requests.delete(requestId);
  });
  session.on('Runtime.consoleAPICalled', ({ type, args }) => {
    if (type === 'error') {
      const text = args
        .map((arg) => arg.value ?? arg.description ?? arg.type)
        .join(' ');
      record(context, 'worker', `console.error ${redact(text)}`);
    }
  });
  session.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
    record(
      context,
      'worker',
      `uncaught ${redact(
        exceptionDetails.exception?.description ?? exceptionDetails.text,
      )}`,
    );
  });
  await Promise.all([
    session.send('Network.enable'),
    session.send('Runtime.enable'),
  ]);
  // Chrome keeps the worker's target across restarts (such as a page reload),
  // and while this session stays attached a restarted worker waits for the
  // debugger before running its script, which leaves the app on a spinner.
  // Resuming is a no-op for a running worker, so keep sending it until the
  // session closes.
  const resume = () =>
    session.send('Runtime.runIfWaitingForDebugger').catch(() => {
      clearInterval(resumeTimer);
    });
  const resumeTimer = setInterval(resume, WORKER_RESUME_INTERVAL_MS);
  resumeTimer.unref();
  await resume();
}

/**
 * Starts recording failed requests and errors for the page's browser context,
 * including its SharedWorker.
 */
function startDiagnostics(page) {
  const context = page.browserContext();
  if (eventsByContext.has(context)) {
    return;
  }
  getEvents(context);
  watchPage(context, page);
  const onTarget = (target) => {
    if (target.type() === 'shared_worker') {
      watchSharedWorker(context, target).catch((error) => {
        record(context, 'diagnostics', `worker watch failed: ${error.message}`);
      });
    }
  };
  context.targets().forEach(onTarget);
  context.on('targetcreated', onTarget);
}

/** Reads the route, navigation and visible structure of a page or frame. */
function snapshotTarget(target, selector) {
  return target.evaluate((selector) => {
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      return (
        getComputedStyle(element).visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const app = globalThis.app;
    const routerState =
      app && typeof app.then !== 'function'
        ? app.store?.getState?.()?.router
        : undefined;
    const element = document.querySelector(selector);
    const rect = element?.getBoundingClientRect();
    return {
      route: routerState?.location?.pathname ?? null,
      appCreated: Boolean(app && typeof app.then !== 'function'),
      selector: element
        ? {
            visible: isVisible(element),
            visibility: getComputedStyle(element).visibility,
            size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
          }
        : 'missing',
      navigation: [
        ...document.querySelectorAll('button[data-sign$="Tab"]'),
      ].map((button) => {
        const tabRect = button.getBoundingClientRect();
        const state =
          button.getAttribute('aria-selected') ??
          button.getAttribute('aria-current') ??
          '';
        return `${button.dataset.sign}@${Math.round(tabRect.x)}+${Math.round(
          tabRect.width,
        )}${state ? `:${state}` : ''}`;
      }),
      visibleSigns: [
        ...new Set(
          [...document.querySelectorAll('[data-sign]')]
            .filter(isVisible)
            .map((node) => node.dataset.sign),
        ),
      ].slice(0, 80),
      alerts: [...document.querySelectorAll('[role="alert"], [role="status"]')]
        .filter(isVisible)
        .map((node) => node.textContent?.trim() ?? '')
        .filter(Boolean),
      documentState: document.visibilityState,
    };
  }, selector);
}

/**
 * Describes why a wait on `target` may have failed, without page content.
 */
async function describeFailure(target, selector) {
  const page = typeof target.page === 'function' ? target.page() : target;
  const lines = [];
  try {
    const snapshot = await Promise.race([
      snapshotTarget(target, selector),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('snapshot timed out')),
          SNAPSHOT_TIMEOUT_MS,
        ),
      ),
    ]);
    lines.push(
      `route: ${snapshot.route} (app created: ${snapshot.appCreated}, document: ${snapshot.documentState})`,
      `selector: ${JSON.stringify(snapshot.selector)}`,
      `navigation: ${snapshot.navigation.join(', ') || '<none>'}`,
      `visible data-signs: ${snapshot.visibleSigns.join(', ') || '<none>'}`,
      `alerts: ${snapshot.alerts.map(redact).join(' | ') || '<none>'}`,
    );
  } catch (error) {
    lines.push(`snapshot unavailable: ${redact(error.message)}`);
  }
  const events = eventsByContext.get(page.browserContext()) ?? [];
  lines.push(
    `recent errors (${events.length}):`,
    ...(events.length ? events.map((event) => `  ${event}`) : ['  <none>']),
  );
  return lines.join('\n');
}

module.exports = {
  describeFailure,
  redact,
  redactUrl,
  startDiagnostics,
};
