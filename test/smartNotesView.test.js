import React from 'react';
import { act, render } from '@testing-library/react';

import { createEmbeddedHistorySmartNoteSession } from '../src/app/views/SmartNotesView/create-embedded-history-smart-note-session';

jest.mock('@ringcentral/mfe-react', () => ({
  dynamicLoad: jest.fn(),
  useApp: jest.fn(() => () => null),
}));

jest.mock('@ringcentral/juno/foundation', () => ({
  useTheme: jest.fn(() => ({})),
}));

jest.mock('../src/app/views/ExpandedView', () => ({
  ExpandedView: class ExpandedView {},
}));

jest.mock('../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

jest.mock('../src/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

const {
  SmartNotesView,
} = require('../src/app/views/SmartNotesView/SmartNotes.view');
const {
  SmartNotesPanel,
} = require('../src/app/views/SmartNotesView/SmartNotesPanel');
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
      presentation: 'independent',
      session,
      viewSmartNote: jest.fn(async function viewSmartNote(
        _session,
        presentation = 'independent',
      ) {
        this.presentation = presentation;
      }),
      setSession: jest.fn(async () => {}),
    };
    const view = new SmartNotesView(
      expandedView,
      sideWidgetView,
      smartNotes,
      { themeType: 'light' },
      {},
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

  test('preserves the independent widget for post-call sessions', () => {
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

  test('does not open standalone content for an embedded history session', async () => {
    const { expandedView, sideWidgetView, smartNotes, view } = createView();
    const session = {
      id: 'history-session',
      status: 'Disconnected',
      direction: 'Inbound',
    };

    await view._openEmbeddedSession(session);
    view._handleSessionChange(session);

    expect(smartNotes.viewSmartNote).toHaveBeenCalledWith(session, 'embedded');
    expect(expandedView.open).not.toHaveBeenCalled();
    expect(sideWidgetView.openContent).not.toHaveBeenCalled();
  });

  test('can still open post-call Smart Notes explicitly from history', async () => {
    const { sideWidgetHandle, sideWidgetView, view } = createView();
    sideWidgetView.isOpen = true;

    await view.open({
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
        showCloseButton
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

  test('uses the MFE embedded options without hiding its navigation', () => {
    jest.useFakeTimers();
    const plugin = jest.fn(() => null);
    useApp.mockReturnValue(plugin);

    render(
      <SmartNotesPanel
        client={{}}
        embedded
        onAlert={jest.fn()}
        onClose={jest.fn()}
        onSave={jest.fn(async () => {})}
        remoteEntry="https://example.com/smart-notes.js"
        sessionId="session-1"
        showCloseButton
        themeType="light"
      />,
    );
    act(() => jest.advanceTimersByTime(50));

    expect(plugin).toHaveBeenCalledWith(
      expect.objectContaining({
        hideContactCard: true,
        hidePostCallHeader: true,
        hidePostCallTabs: false,
        postCallScrollMode: 'page',
        postCallTab: 'notes',
        showCloseButton: false,
      }),
      {},
    );
    expect(useApp).toHaveBeenLastCalledWith(
      expect.objectContaining({
        attrs: {
          className: 'h-auto w-full [&>div]:h-auto [&>div]:w-full',
        },
      }),
    );
    jest.useRealTimers();
  });

  test('remounts the plugin with the newly selected call client', () => {
    jest.useFakeTimers();
    const firstClient = { id: 'first-client' };
    const secondClient = { id: 'second-client' };
    const mountedClients = [];
    const unmountedClients = [];
    const Plugin = jest.fn(({ client }) => {
      React.useEffect(() => {
        mountedClients.push(client);
        return () => unmountedClients.push(client);
      }, []);
      return null;
    });
    useApp.mockReturnValue(Plugin);
    const props = {
      client: firstClient,
      onAlert: jest.fn(),
      onClose: jest.fn(),
      onSave: jest.fn(async () => {}),
      remoteEntry: 'https://example.com/smart-notes.js',
      sessionId: 'session-1',
      showCloseButton: false,
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
    expect(Plugin).toHaveBeenLastCalledWith(
      expect.objectContaining({ showCloseButton: false }),
      {},
    );
    jest.useRealTimers();
  });

  test('remounts the plugin when SideWidget tab chrome hides close', () => {
    jest.useFakeTimers();
    const mountedCloseStates = [];
    const unmountedCloseStates = [];
    const Plugin = jest.fn(({ showCloseButton }) => {
      React.useEffect(() => {
        mountedCloseStates.push(showCloseButton);
        return () => unmountedCloseStates.push(showCloseButton);
      }, []);
      return null;
    });
    useApp.mockReturnValue(Plugin);
    const props = {
      client: {},
      onAlert: jest.fn(),
      onClose: jest.fn(),
      onSave: jest.fn(async () => {}),
      remoteEntry: 'https://example.com/smart-notes.js',
      sessionId: 'session-1',
      showCloseButton: true,
      themeType: 'light',
    };
    const { rerender } = render(<SmartNotesPanel {...props} />);
    act(() => jest.advanceTimersByTime(50));

    rerender(<SmartNotesPanel {...props} showCloseButton={false} />);

    expect(unmountedCloseStates).toEqual([true]);
    expect(mountedCloseStates).toEqual([true, false]);
    expect(Plugin).toHaveBeenLastCalledWith(
      expect.objectContaining({ showCloseButton: false }),
      {},
    );
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

describe('createEmbeddedHistorySmartNoteSession', () => {
  test('uses the remote participant without creating a second contact view', () => {
    expect(
      createEmbeddedHistorySmartNoteSession({
        direction: 'Inbound',
        from: { name: 'Anna', phoneNumber: '+16501234567' },
        fromMatches: [],
        telephonySessionId: 'telephony-session',
      }),
    ).toEqual(
      expect.objectContaining({
        id: 'telephony-session',
        status: 'Disconnected',
        phoneNumber: '+16501234567',
        contact: {
          name: 'Anna',
          phoneNumber: '+16501234567',
        },
      }),
    );
  });
});
