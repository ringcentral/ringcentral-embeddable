jest.mock('@ringcentral-integration/micro-phone/src/app/views', () => ({
  DialerView: class DialerView {},
}));
jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({
    CallViewState: class CallViewState {},
  })
);
jest.mock('../../next/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));
jest.mock('../../next/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

const { Adapter } = require('../../next/app/services/Adapter');

describe('Adapter expanded layout', () => {
  test.each([
    [false, { width: 300, height: 540 }],
    [true, { width: 600, height: 540 }],
  ])(
    'updates authoritative size and host messages for expanded=%s',
    (expanded, size) => {
      const adapter = {
        _messageTypes: {
          syncSize: 'rc-adapter-syncSize',
        },
        _setSize: jest.fn(),
        setSize: jest.fn().mockResolvedValue(undefined),
        _postMessage: jest.fn(),
      };

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
});
