import React from 'react';
import { act, render } from '@testing-library/react';

import { createEmbeddedHistorySmartNoteSession } from '../../src/app/views/SmartNotesView/create-embedded-history-smart-note-session';

jest.mock('@ringcentral/mfe-react', () => ({
  dynamicLoad: jest.fn(),
  useApp: jest.fn(() => () => null),
}));

jest.mock('@ringcentral/juno/foundation', () => ({
  useTheme: jest.fn(() => ({})),
}));

jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

jest.mock('../../src/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

const {
  SmartNotesView,
} = require('../../src/app/views/SmartNotesView/SmartNotes.view');
const {
  SmartNotesPanel,
} = require('../../src/app/views/SmartNotesView/SmartNotesPanel');
const { useApp } = require('@ringcentral/mfe-react');
const { watch } = require('@ringcentral-integration/next-core');

describe('SmartNotesView', () => {
  function createView(
    session = null,
    portManager = { shared: false, isServer: false },
  ) {
    const handle = { id: 'smart-notes-side-widget-handle' };
    const sideWidgetView = {
      isOpen: false,
      createContent: jest.fn((options) => {
        handle.options = options;
        return handle;
      }),
      updateContent: jest.fn((contentHandle, options) => {
        contentHandle.options = options;
      }),
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
      sideWidgetView,
      smartNotes,
      { themeType: 'light' },
      {},
      portManager,
    );
    return {
      handle,
      sideWidgetView,
      smartNotes,
      view,
    };
  }

  test('registers a localized AI Assistant side widget tab', () => {
    const { handle } = createView();

    expect(handle.options).toEqual(
      expect.objectContaining({ id: 'smart-notes', showAppsTab: true }),
    );
    expect(handle.options.getName()).toBe(handle.options.name);
  });

  test('opens a past session as a tab without expanding the layout', async () => {
    const { handle, sideWidgetView, smartNotes, view } = createView();
    const session = {
      id: 'telephony-session',
      status: 'Disconnected',
      direction: 'Inbound',
    };

    await view.open(session);

    expect(smartNotes.viewSmartNote).toHaveBeenCalledWith(session);
    expect(handle.options.showAppsTab).toBe(false);
    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle, {
      expand: false,
    });
  });

  test('opens live call sessions in the side panel automatically', () => {
    const { handle, sideWidgetView, view } = createView();

    view._handleSessionChange({
      id: 'live-session',
      status: 'Answered',
      direction: 'Inbound',
    });

    expect(handle.options.showAppsTab).toBe(true);
    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle, {});
  });

  test('opens a post-call session as a tab and closes it with the session', () => {
    const { handle, sideWidgetView, view } = createView();

    view._handleSessionChange({
      id: 'post-call-session',
      status: 'Disconnected',
      direction: 'Inbound',
    });
    view._handleSessionChange(null);

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle, {
      expand: false,
    });
    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(handle, {
      collapseWhenLast: true,
    });
  });

  test('does not open standalone content for an embedded history session', async () => {
    const { sideWidgetView, smartNotes, view } = createView();
    const session = {
      id: 'history-session',
      status: 'Disconnected',
      direction: 'Inbound',
    };

    await view._openEmbeddedSession(session);
    view._handleSessionChange(session);

    expect(smartNotes.viewSmartNote).toHaveBeenCalledWith(session, 'embedded');
    expect(sideWidgetView.openContent).not.toHaveBeenCalled();
  });

  test('can still open post-call Smart Notes explicitly from history', async () => {
    const { handle, sideWidgetView, view } = createView();
    sideWidgetView.isOpen = true;

    await view.open({
      id: 'post-call-session',
      status: 'Disconnected',
      direction: 'Inbound',
    });

    expect(sideWidgetView.openContent).toHaveBeenCalledWith(handle, {});
  });

  test('claims a session before loading it, so the watcher does not show it twice', async () => {
    const { sideWidgetView, smartNotes, view } = createView();
    const session = {
      id: 'live-session',
      status: 'Answered',
      direction: 'Inbound',
    };
    // Loading sets the session, which reaches the watcher on the server.
    smartNotes.viewSmartNote.mockImplementationOnce(async () => {
      view._handleSessionChange(session);
    });

    await view.open(session);

    expect(sideWidgetView.openContent).toHaveBeenCalledTimes(1);
  });

  test('drops a stale open when another session was opened meanwhile', async () => {
    const { sideWidgetView, smartNotes, view } = createView();
    let finishFirst;
    smartNotes.viewSmartNote.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishFirst = resolve;
        }),
    );

    const first = view.open({ id: 'first', status: 'Answered' });
    await Promise.resolve();
    await view.open({ id: 'second', status: 'Answered' });
    finishFirst();
    await first;

    expect(sideWidgetView.openContent).toHaveBeenCalledTimes(1);
  });

  test('follows the session only on the server port, which owns the tab', () => {
    watch.mockClear();
    createView(null, { shared: true, isServer: false }).view.onInit();
    expect(watch).not.toHaveBeenCalled();

    createView(null, { shared: true, isServer: true }).view.onInit();
    expect(watch).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['the remote entry is not resolved yet', { remoteEntry: '' }],
    ['the notes client is not available', { client: null }],
  ])('does not attempt the MFE import while %s', (_label, overrides) => {
    // A tab opened during an active call renders the call UI from replicated
    // worker state before it has fetched plugins.json. `useApp` loads its remote
    // once on mount and never retries, so mounting early would permanently fail
    // the import for that instance.
    useApp.mockClear();
    useApp.mockReturnValue(jest.fn(() => null));

    const { container } = render(
      <SmartNotesPanel
        client={{}}
        onAlert={jest.fn()}
        onClose={jest.fn()}
        onSave={jest.fn(async () => {})}
        remoteEntry="https://example.com/smart-notes.js"
        sessionId="session-1"
        showCloseButton
        themeType="light"
        {...overrides}
      />,
    );

    expect(useApp).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  test('mounts the plugin once the remote entry arrives', () => {
    jest.useFakeTimers();
    const plugin = jest.fn(() => null);
    useApp.mockClear();
    useApp.mockReturnValue(plugin);

    const props = {
      client: {},
      onAlert: jest.fn(),
      onClose: jest.fn(),
      onSave: jest.fn(async () => {}),
      sessionId: 'session-1',
      showCloseButton: true,
      themeType: 'light',
    };
    const { rerender } = render(<SmartNotesPanel {...props} remoteEntry="" />);
    expect(useApp).not.toHaveBeenCalled();

    rerender(
      <SmartNotesPanel
        {...props}
        remoteEntry="https://example.com/smart-notes.js"
      />,
    );
    act(() => jest.advanceTimersByTime(50));

    // `useApp` is a hook, so it runs on every render of the mounted panel; the
    // invariant is that it ran at all only after the entry became available.
    expect(useApp).toHaveBeenCalled();
    expect(plugin).toHaveBeenCalled();
    jest.useRealTimers();
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

  test('closes its tab and releases a disconnected session', async () => {
    const { handle, sideWidgetView, smartNotes, view } = createView({
      id: 'telephony-session',
      status: 'Disconnected',
    });

    view.close();
    await Promise.resolve();
    handle.options.onClose(null);

    expect(sideWidgetView.closeContent).toHaveBeenCalledWith(handle, {});
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
