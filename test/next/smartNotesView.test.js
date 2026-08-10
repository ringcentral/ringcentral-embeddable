import React from 'react';
import { act, render } from '@testing-library/react';

jest.mock('@ringcentral/mfe-react', () => ({
  dynamicLoad: jest.fn(),
  useApp: jest.fn(() => () => null),
}));

jest.mock('@ringcentral/juno/foundation', () => ({
  useTheme: jest.fn(() => ({})),
}));

jest.mock('../../next/app/views/ExpandedView', () => ({
  ExpandedView: class ExpandedView {},
}));

jest.mock('../../next/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

jest.mock('../../next/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

const {
  SmartNotesView,
} = require('../../next/app/views/SmartNotesView/SmartNotes.view');
const {
  SmartNotesPanel,
} = require('../../next/app/views/SmartNotesView/SmartNotesPanel');
const { useApp } = require('@ringcentral/mfe-react');

describe('SmartNotesView', () => {
  function createView(session = null) {
    const handle = { id: 'smart-notes-handle' };
    const sideWidgetHandle = { id: 'smart-notes-side-widget-handle' };
    const expandedView = {
      create: jest.fn(() => handle),
      open: jest.fn(),
      close: jest.fn(),
    };
    const sideWidgetView = {
      isOpen: false,
      createContent: jest.fn(() => sideWidgetHandle),
      openContent: jest.fn(),
      closeContent: jest.fn(),
    };
    const smartNotes = {
      session,
      viewSmartNote: jest.fn(async () => {}),
      setSession: jest.fn(async () => {}),
    };
    const view = new SmartNotesView(
      expandedView,
      sideWidgetView,
      smartNotes,
      { themeType: 'light' },
      {}
    );
    return {
      expandedView,
      handle,
      sideWidgetHandle,
      sideWidgetView,
      smartNotes,
      view,
    };
  }

  test('opens Smart Notes without forcing the side panel to expand', async () => {
    const { expandedView, handle, smartNotes, view } = createView();
    const [expandedViewOptions] = expandedView.create.mock.calls[0];
    const session = {
      id: 'telephony-session',
      status: 'Disconnected',
      direction: 'Inbound',
    };

    await view.open(session);

    expect(expandedViewOptions.header).toBeUndefined();
    expect(expandedViewOptions.showOverlayHeader).toBe(false);
    expect(smartNotes.viewSmartNote).toHaveBeenCalledWith(session);
    expect(expandedView.open).toHaveBeenCalledWith(handle, { expand: false });
  });

  test('opens live call sessions in the side panel automatically', () => {
    const { sideWidgetHandle, sideWidgetView, view } = createView();

    view._handleSessionChange({
      id: 'live-session',
      status: 'Answered',
      direction: 'Inbound',
    });

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(sideWidgetHandle);
  });

  test('preserves compact layout for post-call sessions and closes without a session', () => {
    const { expandedView, handle, view } = createView();

    view._handleSessionChange({
      id: 'post-call-session',
      status: 'Disconnected',
      direction: 'Inbound',
    });
    view._handleSessionChange(null);

    expect(expandedView.open).toHaveBeenCalledWith(handle, { expand: false });
    expect(expandedView.close).toHaveBeenCalledWith(handle);
  });

  test('opens post-call Smart Notes as a tab when the Apps panel is open', () => {
    const { sideWidgetHandle, sideWidgetView, view } = createView();
    sideWidgetView.isOpen = true;

    view._handleSessionChange({
      id: 'post-call-session',
      status: 'Disconnected',
      direction: 'Inbound',
    });

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(sideWidgetHandle);
  });

  test('lets the Smart Notes plugin render the single-view header and close button', () => {
    jest.useFakeTimers();
    const plugin = jest.fn(() => null);
    useApp.mockReturnValue(plugin);

    render(
      <SmartNotesPanel
        client={{}}
        onAlert={jest.fn()}
        onClose={jest.fn()}
        onSave={jest.fn(async () => {})}
        remoteEntry="https://example.com/smart-notes.js"
        sessionId="session-1"
        themeType="light"
      />,
    );
    act(() => jest.advanceTimersByTime(50));

    expect(plugin).toHaveBeenCalledWith(
      expect.objectContaining({ showCloseButton: true }),
      {},
    );
    jest.useRealTimers();
  });

  test('remounts the plugin with the newly selected call client', () => {
    jest.useFakeTimers();
    const firstClient = { id: 'first-client' };
    const secondClient = { id: 'second-client' };
    const mountedClients = [];
    const unmountedClients = [];
    const Plugin = ({ client }) => {
      React.useEffect(() => {
        mountedClients.push(client);
        return () => unmountedClients.push(client);
      }, []);
      return null;
    };
    useApp.mockReturnValue(Plugin);
    const props = {
      client: firstClient,
      onAlert: jest.fn(),
      onClose: jest.fn(),
      onSave: jest.fn(async () => {}),
      remoteEntry: 'https://example.com/smart-notes.js',
      sessionId: 'session-1',
      themeType: 'light',
    };
    const { rerender } = render(<SmartNotesPanel {...props} />);
    act(() => jest.advanceTimersByTime(50));

    rerender(
      <SmartNotesPanel
        {...props}
        client={secondClient}
        sessionId="session-2"
      />,
    );

    expect(unmountedClients).toEqual([firstClient]);
    act(() => jest.advanceTimersByTime(50));
    expect(mountedClients).toEqual([firstClient, secondClient]);
    jest.useRealTimers();
  });

  test('closes expanded content and releases a disconnected session', () => {
    const {
      expandedView,
      handle,
      sideWidgetHandle,
      sideWidgetView,
      smartNotes,
      view,
    } = createView({
      id: 'telephony-session',
      status: 'Disconnected',
    });
    const [{ onClose }] = expandedView.create.mock.calls[0];

    view.close();
    onClose();

    expect(expandedView.close).toHaveBeenCalledWith(handle);
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(sideWidgetHandle);
    expect(smartNotes.setSession).toHaveBeenCalledWith(null);
  });
});
