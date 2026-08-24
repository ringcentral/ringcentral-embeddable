const {
  setupGlobalErrorHandlers,
} = require('../../src/lib/setupGlobalErrorHandlers');

function createTarget() {
  const listeners = {};
  return {
    listeners,
    addEventListener: jest.fn((type, listener) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(listener);
    }),
    removeEventListener: jest.fn((type, listener) => {
      listeners[type] = (listeners[type] || []).filter((l) => l !== listener);
    }),
    dispatch(type, event) {
      (listeners[type] || []).forEach((listener) => listener(event));
    },
  };
}

function createAlert() {
  return { alert: jest.fn() };
}

function createLogger() {
  return { error: jest.fn() };
}

describe('setupGlobalErrorHandlers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers and removes unhandledrejection and error listeners', () => {
    const target = createTarget();
    const cleanup = setupGlobalErrorHandlers({ target, getAlert: () => null });

    expect(target.addEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function),
    );
    expect(target.addEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );

    cleanup();
    expect(target.removeEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function),
    );
    expect(target.removeEventListener).toHaveBeenCalledWith(
      'error',
      expect.any(Function),
    );
  });

  it('logs and surfaces a generic alert for an unknown rejection reason', () => {
    const target = createTarget();
    const alert = createAlert();
    const logger = createLogger();
    setupGlobalErrorHandlers({ target, getAlert: () => alert, logger });

    target.dispatch('unhandledrejection', { reason: new Error('boom') });

    expect(logger.error).toHaveBeenCalledWith(
      '[RingCentral Embeddable] unhandledrejection:',
      expect.any(Error),
    );
    expect(alert.alert).toHaveBeenCalledTimes(1);
    const payload = alert.alert.mock.calls[0][0];
    expect(payload).toMatchObject({
      level: 'danger',
      message: 'showCustomAlertMessage',
    });
    expect(payload.payload.alertMessage).toContain('Something went wrong');
    expect(payload.payload.details[0].items[0].text).toBe('boom');
  });

  it('maps the webphone channel timeout to a friendlier message', () => {
    const target = createTarget();
    const alert = createAlert();
    setupGlobalErrorHandlers({ target, getAlert: () => alert });

    target.dispatch('unhandledrejection', {
      reason: new Error('rc-widget-webphone-channel-v2-timeout'),
    });

    const payload = alert.alert.mock.calls[0][0];
    expect(payload.payload.alertMessage).toContain('did not respond in time');
    expect(payload.payload.details[0].items[0].text).toBe(
      'rc-widget-webphone-channel-v2-timeout',
    );
  });

  it('throttles repeated identical messages', () => {
    const target = createTarget();
    const alert = createAlert();
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1000);
    setupGlobalErrorHandlers({
      target,
      getAlert: () => alert,
      throttleMs: 5000,
    });

    target.dispatch('unhandledrejection', { reason: new Error('boom') });
    target.dispatch('unhandledrejection', { reason: new Error('boom') });
    expect(alert.alert).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(1000 + 6000);
    target.dispatch('unhandledrejection', { reason: new Error('boom') });
    expect(alert.alert).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  it('ignores resource load errors that carry no error object', () => {
    const target = createTarget();
    const alert = createAlert();
    setupGlobalErrorHandlers({ target, getAlert: () => alert });

    target.dispatch('error', { target: { tagName: 'IMG' } });

    expect(alert.alert).not.toHaveBeenCalled();
  });

  it('ignores benign browser noise without logging or alerting', () => {
    const target = createTarget();
    const alert = createAlert();
    const logger = createLogger();
    setupGlobalErrorHandlers({ target, getAlert: () => alert, logger });

    target.dispatch('error', {
      message: 'ResizeObserver loop completed with undelivered notifications.',
    });
    target.dispatch('error', { error: new Error('Script error.') });

    expect(alert.alert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('ignores errors originating from a browser extension (via filename)', () => {
    const target = createTarget();
    const alert = createAlert();
    const logger = createLogger();
    setupGlobalErrorHandlers({ target, getAlert: () => alert, logger });

    target.dispatch('error', {
      error: new Error('some extension failure'),
      filename: 'chrome-extension://abcdefg/content.js',
    });

    expect(alert.alert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('ignores rejections whose stack points at a browser extension', () => {
    const target = createTarget();
    const alert = createAlert();
    const logger = createLogger();
    setupGlobalErrorHandlers({ target, getAlert: () => alert, logger });

    const error = new Error('injected script blew up');
    error.stack =
      'Error: injected script blew up\n    at moz-extension://uuid/inject.js:10:5';
    target.dispatch('unhandledrejection', { reason: error });

    expect(alert.alert).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('surfaces synchronous errors from the error event', () => {
    const target = createTarget();
    const alert = createAlert();
    setupGlobalErrorHandlers({ target, getAlert: () => alert });

    target.dispatch('error', { error: new Error('render crash') });

    expect(alert.alert).toHaveBeenCalledTimes(1);
    expect(alert.alert.mock.calls[0][0].payload.details[0].items[0].text).toBe(
      'render crash',
    );
  });

  it('does not throw when no alert module is available', () => {
    const target = createTarget();
    const logger = createLogger();
    setupGlobalErrorHandlers({ target, getAlert: () => null, logger });

    expect(() =>
      target.dispatch('unhandledrejection', { reason: new Error('boom') }),
    ).not.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });

  it('does not throw when surfacing the alert itself fails', () => {
    const target = createTarget();
    const logger = createLogger();
    const alert = {
      alert: jest.fn(() => {
        throw new Error('alert failed');
      }),
    };
    setupGlobalErrorHandlers({ target, getAlert: () => alert, logger });

    expect(() =>
      target.dispatch('unhandledrejection', { reason: new Error('boom') }),
    ).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      '[RingCentral Embeddable] failed to surface alert',
      expect.any(Error),
    );
  });

  it('returns a no-op cleanup when target cannot register listeners', () => {
    expect(() => setupGlobalErrorHandlers({ target: undefined })).not.toThrow();
    const cleanup = setupGlobalErrorHandlers({ target: {} });
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
  });
});
