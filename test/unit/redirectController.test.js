/** @jest-environment jsdom */

function setWindowProperty(name, value) {
  Object.defineProperty(window, name, {
    configurable: true,
    value,
  });
}

function loadController() {
  jest.resetModules();
  return require('../../src/lib/RedirectController').default;
}

describe('RedirectController', () => {
  let listeners;

  beforeEach(() => {
    listeners = {};
    localStorage.clear();
    window.history.pushState({}, '', '/callback?state=oauth-uuid-1');
    setWindowProperty('close', jest.fn());
    jest.spyOn(window, 'addEventListener').mockImplementation((type, handler) => {
      listeners[type] = handler;
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('uses opener oauth callback first and closes the popup', () => {
    const oAuthCallback = jest.fn();
    setWindowProperty('opener', {
      oAuthCallback,
    });
    const RedirectController = loadController();
    new RedirectController({ prefix: 'test' });

    listeners.load();

    expect(oAuthCallback).toHaveBeenCalledWith(window.location.href);
    expect(window.close).toHaveBeenCalled();
  });

  it('posts callback messages to opener, parent frames, and localStorage fallback', () => {
    const opener = {
      postMessage: jest.fn(),
    };
    const parent = {
      postMessage: jest.fn(),
    };
    setWindowProperty('opener', opener);
    setWindowProperty('parent', parent);
    setWindowProperty('name', 'SSOIframe');
    const RedirectController = loadController();
    new RedirectController({ prefix: 'test' });

    listeners.load();

    expect(opener.postMessage).toHaveBeenCalledWith(
      { callbackUri: window.location.href },
      window.location.origin,
    );
    expect(parent.postMessage).toHaveBeenCalledWith(
      { callbackUri: window.location.href },
      window.location.origin,
    );
    expect(localStorage.getItem('test-uuid-1-redirect-callbackUri')).toBe(window.location.href);

    listeners.storage({
      key: 'test-uuid-1-redirect-callbackUri',
      newValue: '',
    });
    expect(window.close).toHaveBeenCalled();
  });

  it('posts refresh callback from hidden iframe and tolerates cross-window errors', () => {
    const parent = {
      postMessage: jest.fn(() => {
        throw new Error('parent blocked');
      }),
    };
    setWindowProperty('opener', {
      get postMessage() {
        throw new Error('opener blocked');
      },
    });
    setWindowProperty('parent', parent);
    setWindowProperty('name', 'hidden-refresh');
    window.history.pushState({}, '', '/callback');
    const RedirectController = loadController();
    new RedirectController({ prefix: 'test' });

    listeners.load();

    expect(parent.postMessage).toHaveBeenCalledWith(
      { refreshCallbackUri: window.location.href },
      expect.any(String),
    );
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    expect(localStorage.length).toBe(0);
  });
});
