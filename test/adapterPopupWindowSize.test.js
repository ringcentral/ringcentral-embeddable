const AdapterClient = require('../src/lib/Adapter').default;

const WINDOW_FRAME_WIDTH = 16;

function setWindowWidth(width) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, 'outerWidth', {
    configurable: true,
    writable: true,
    value: width + WINDOW_FRAME_WIDTH,
  });
}

function createPopupAdapter() {
  return {
    _fromPopup: true,
    _minimized: false,
    _appWidth: 300,
    _appHeight: 540,
    _popupAppWidth: null,
    _contentFrameContainerEl: { style: {} },
    _contentFrameEl: { style: {} },
  };
}

/** Lays the popup page out as the app reports `appWidth`. */
function renderAppWidth(adapter, appWidth) {
  adapter._appWidth = appWidth;
  AdapterClient.prototype.renderAdapterSize.call(adapter);
}

describe('Adapter popup window size', () => {
  let opener;

  beforeEach(() => {
    opener = { postMessage: jest.fn() };
    Object.defineProperty(window, 'opener', {
      configurable: true,
      writable: true,
      value: opener,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'opener', {
      configurable: true,
      writable: true,
      value: null,
    });
  });

  function getRequestedWidths() {
    return opener.postMessage.mock.calls.map(([message]) => {
      expect(message.type).toBe('rc-adapter-set-popup-window-size');
      return message.width - WINDOW_FRAME_WIDTH;
    });
  }

  test('grows the window when the app expands', () => {
    setWindowWidth(300);
    const adapter = createPopupAdapter();
    renderAppWidth(adapter, 300);

    renderAppWidth(adapter, 660);

    expect(getRequestedWidths()).toEqual([660]);
    expect(opener.postMessage).toHaveBeenCalledWith(
      {
        type: 'rc-adapter-set-popup-window-size',
        width: 660 + WINDOW_FRAME_WIDTH,
        height: 540,
      },
      '*',
    );
  });

  test('narrows the window back when the app folds', () => {
    setWindowWidth(660);
    const adapter = createPopupAdapter();
    renderAppWidth(adapter, 660);

    renderAppWidth(adapter, 300);

    expect(getRequestedWidths()).toEqual([300]);
  });

  test('narrows a window the user narrowed while expanded when the app folds', () => {
    setWindowWidth(660);
    const adapter = createPopupAdapter();
    renderAppWidth(adapter, 660);
    setWindowWidth(500);

    renderAppWidth(adapter, 300);

    expect(getRequestedWidths()).toEqual([300]);
  });

  test('does not grow back a window the user narrowed while expanded', () => {
    setWindowWidth(660);
    const adapter = createPopupAdapter();
    renderAppWidth(adapter, 660);
    setWindowWidth(500);

    // Other app state, such as presence, lays the page out again.
    renderAppWidth(adapter, 660);
    renderAppWidth(adapter, 660);

    expect(opener.postMessage).not.toHaveBeenCalled();
  });

  test('leaves a window the user narrowed until the app folded', () => {
    setWindowWidth(660);
    const adapter = createPopupAdapter();
    renderAppWidth(adapter, 660);
    setWindowWidth(450);

    renderAppWidth(adapter, 300);

    expect(opener.postMessage).not.toHaveBeenCalled();
  });

  test('grows the window again when a wider tab opens while expanded', () => {
    setWindowWidth(600);
    const adapter = createPopupAdapter();
    renderAppWidth(adapter, 600);

    renderAppWidth(adapter, 660);

    expect(getRequestedWidths()).toEqual([660]);
  });

  test('does not resize a window without an opener', () => {
    window.opener = null;
    setWindowWidth(300);
    const adapter = createPopupAdapter();
    renderAppWidth(adapter, 300);

    renderAppWidth(adapter, 660);
    renderAppWidth(adapter, 300);

    expect(opener.postMessage).not.toHaveBeenCalled();
  });
});
