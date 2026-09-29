jest.mock('@ringcentral-integration/micro-phone/src/app/views', () => ({
  DialerView: class DialerView {},
}));
jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({
    CallViewState: class CallViewState {},
  })
);
jest.mock('../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));
jest.mock('../src/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

const { Adapter } = require('../src/app/services/Adapter');

function createAdapter(sideWidgetView, { expanded = false } = {}) {
  const adapter = {
    _messageTypes: {
      syncSize: 'rc-adapter-syncSize',
    },
    _root: { expanded },
    _sideWidgetView: sideWidgetView,
    _lastSideDrawerOpen: null,
    _setSize: jest.fn(),
    setSize: jest.fn().mockResolvedValue(undefined),
    _postMessage: jest.fn(),
  };
  adapter._getAppWidth = Adapter.prototype._getAppWidth.bind(adapter);
  adapter._syncAppSize = Adapter.prototype._syncAppSize.bind(adapter);
  adapter._notifySideDrawerOpen =
    Adapter.prototype._notifySideDrawerOpen.bind(adapter);
  return adapter;
}

function getSideDrawerOpenMessages(adapter) {
  return adapter._postMessage.mock.calls
    .map(([message]) => message)
    .filter(({ type }) => type === 'rc-adapter-side-drawer-open-notify');
}

describe('Adapter expanded layout', () => {
  test.each([
    [false, { width: 300, height: 540 }],
    [true, { width: 600, height: 540 }],
  ])(
    'updates authoritative size and host messages for expanded=%s',
    (expanded, size) => {
      const adapter = createAdapter(undefined);

      Adapter.prototype._onWindowExpanded.call(adapter, expanded);

      expect(adapter.setSize).toHaveBeenCalledWith(size);
      expect(adapter._setSize).not.toHaveBeenCalled();
      expect(adapter._postMessage).toHaveBeenNthCalledWith(1, {
        type: 'rc-adapter-syncSize',
        size,
      });
      expect(adapter._postMessage).toHaveBeenNthCalledWith(2, {
        type: 'rc-adapter-side-drawer-open-notify',
        open: expanded,
      });
    }
  );

  test('widens the expanded frame to fit the widest open side widget tab', () => {
    const adapter = createAdapter({ minExpandedWidth: 360 });

    Adapter.prototype._onWindowExpanded.call(adapter, true);

    expect(adapter.setSize).toHaveBeenCalledWith({ width: 660, height: 540 });
    expect(adapter._postMessage).toHaveBeenNthCalledWith(1, {
      type: 'rc-adapter-syncSize',
      size: { width: 660, height: 540 },
    });
  });

  test('never makes the expanded frame narrower than the default', () => {
    const adapter = createAdapter({ minExpandedWidth: 200 });

    Adapter.prototype._onWindowExpanded.call(adapter, true);

    expect(adapter.setSize).toHaveBeenCalledWith({ width: 600, height: 540 });
  });

  test('ignores tab widths while folded', () => {
    const adapter = createAdapter({ minExpandedWidth: 360 });

    Adapter.prototype._onWindowExpanded.call(adapter, false);

    expect(adapter.setSize).toHaveBeenCalledWith({ width: 300, height: 540 });
  });

  test('posts the side drawer state only when it changes', () => {
    const adapter = createAdapter(undefined);

    Adapter.prototype._onWindowExpanded.call(adapter, false);
    Adapter.prototype._onWindowExpanded.call(adapter, true);
    Adapter.prototype._onWindowExpanded.call(adapter, true);
    Adapter.prototype._onWindowExpanded.call(adapter, false);

    expect(getSideDrawerOpenMessages(adapter)).toEqual([
      { type: 'rc-adapter-side-drawer-open-notify', open: false },
      { type: 'rc-adapter-side-drawer-open-notify', open: true },
      { type: 'rc-adapter-side-drawer-open-notify', open: false },
    ]);
  });

  test('tells the host the drawer opens when asking a popup window to grow', () => {
    const adapter = createAdapter({ minExpandedWidth: 360 });

    Adapter.prototype.requestPopupWindowWidth.call(adapter, 660);

    expect(adapter._postMessage).toHaveBeenNthCalledWith(1, {
      type: 'rc-adapter-syncSize',
      size: { width: 660, height: 540 },
    });
    expect(adapter._postMessage).toHaveBeenNthCalledWith(2, {
      type: 'rc-adapter-side-drawer-open-notify',
      open: true,
    });
    // A Chrome extension popup window grows only when the host resizes it.
    expect(adapter.setSize).not.toHaveBeenCalled();
  });

  test('does not repeat the open event when the drawer docks after the window grows', () => {
    const adapter = createAdapter({ minExpandedWidth: 360 });

    Adapter.prototype.requestPopupWindowWidth.call(adapter, 660);
    Adapter.prototype._onWindowExpanded.call(adapter, true);

    expect(getSideDrawerOpenMessages(adapter)).toEqual([
      { type: 'rc-adapter-side-drawer-open-notify', open: true },
    ]);
  });

  test('tells the host the drawer closed when it closes before the window grows', () => {
    const adapter = createAdapter({ minExpandedWidth: 360 });

    Adapter.prototype.requestPopupWindowWidth.call(adapter, 660);
    Adapter.prototype._onSideWidgetOpenChanged.call(adapter, false);

    expect(getSideDrawerOpenMessages(adapter)).toEqual([
      { type: 'rc-adapter-side-drawer-open-notify', open: true },
      { type: 'rc-adapter-side-drawer-open-notify', open: false },
    ]);
  });

  test('leaves the closed event to the layout when the drawer closes while expanded', () => {
    const adapter = createAdapter(undefined, { expanded: true });

    Adapter.prototype._onWindowExpanded.call(adapter, true);
    Adapter.prototype._onSideWidgetOpenChanged.call(adapter, false);

    expect(getSideDrawerOpenMessages(adapter)).toEqual([
      { type: 'rc-adapter-side-drawer-open-notify', open: true },
    ]);
  });
});
