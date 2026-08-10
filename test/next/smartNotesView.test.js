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
    const expandedView = {
      create: jest.fn(() => handle),
      open: jest.fn(),
      close: jest.fn(),
    };
    const smartNotes = {
      session,
      viewSmartNote: jest.fn(async () => {}),
      setSession: jest.fn(async () => {}),
    };
    const view = new SmartNotesView(
      expandedView,
      smartNotes,
      { themeType: 'light' },
      {}
    );
    return {
      expandedView,
      handle,
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
    const { expandedView, handle, smartNotes, view } = createView({
      id: 'telephony-session',
      status: 'Disconnected',
    });
    const [{ onClose }] = expandedView.create.mock.calls[0];

    view.close();
    onClose();

    expect(expandedView.close).toHaveBeenCalledWith(handle);
    expect(smartNotes.setSession).toHaveBeenCalledWith(null);
  });
});
