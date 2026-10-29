import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { watch } from '@ringcentral-integration/next-core';

import { VoicemailDropSettingsView } from '../../src/app/views/VoicemailDropSettingsView/VoicemailDropSettings.view';
import { VoicemailDropSettingsLink } from '../../src/app/views/VoicemailDropSettingsView/VoicemailDropSettingsLink';
import { VoicemailDropSettingsPanel } from '../../src/app/views/VoicemailDropSettingsView/VoicemailDropSettingsPanel';
import { VoicemailDropView } from '../../src/app/views/VoicemailDropView/VoicemailDrop.view';
import { VoicemailDropPanel } from '../../src/app/views/VoicemailDropView/VoicemailDropPanel';

jest.mock('../../src/app/views/VoicemailDropSettingsView/VoicemailDropSettingsPanel', () => ({
  VoicemailDropSettingsPanel: jest.fn(() => null),
}));

jest.mock('../../src/app/views/VoicemailDropView/VoicemailDropPanel', () => ({
  VoicemailDropPanel: jest.fn(() => null),
}));

jest.mock('../../src/app/views/VoicemailDropView/i18n', () => ({
  __esModule: true,
  default: {},
  t: jest.fn((key) =>
    key === 'voicemailDrop' ? 'Localized voicemail drop' : key,
  ),
}));

jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  LinkLine: ({ children, ...props }) => <button type="button" {...props}>{children}</button>,
}));

function renderViewModule(view) {
  const Component = () => view.component();
  return render(<Component />);
}

describe('VoicemailDropSettingsView', () => {
  beforeEach(() => {
    VoicemailDropSettingsPanel.mockClear();
  });

  test('connects service state and settings actions', async () => {
    const voicemailDrop = {
      voicemailMessages: [{ id: 'local' }],
      externalVoicemailDropFiles: [{ id: 'external' }],
      noBeepSilenceDuration: 4,
      deleteVoicemailMessage: jest.fn(async () => {}),
      fetchExternalVoicemailDropFiles: jest.fn(async () => {}),
      addVoicemailMessage: jest.fn(async () => {}),
      setNoBeepSilenceDuration: jest.fn(async () => {}),
    };
    const router = { push: jest.fn() };
    const thirdParty = { serviceName: 'Acme CRM' };
    const view = new VoicemailDropSettingsView(voicemailDrop, router, thirdParty);

    renderViewModule(view);

    const props = VoicemailDropSettingsPanel.mock.calls[0][0];
    expect(props.messages).toEqual([{ id: 'local' }]);
    expect(props.messages).not.toBe(voicemailDrop.voicemailMessages);
    expect(props.externalMessages).toEqual([{ id: 'external' }]);
    expect(props.noBeepSilenceDuration).toBe(4);
    expect(props.externalServiceName).toBe('Acme CRM');
    props.onBack();
    props.onDelete({ id: 'local' });
    await props.onLoad();
    props.onSave({ id: 'new' });
    props.onSilenceDurationChange(6);

    expect(router.push).toHaveBeenCalledWith('/settings');
    expect(voicemailDrop.deleteVoicemailMessage).toHaveBeenCalledWith({ id: 'local' });
    expect(voicemailDrop.fetchExternalVoicemailDropFiles).toHaveBeenCalled();
    expect(voicemailDrop.addVoicemailMessage).toHaveBeenCalledWith({ id: 'new' });
    expect(voicemailDrop.setNoBeepSilenceDuration).toHaveBeenCalledWith(6);
  });
});

describe('VoicemailDropSettingsLink', () => {
  test('renders only with permission and forwards clicks', () => {
    const onClick = jest.fn();
    const voicemailDrop = { hasVoicemailDropPermission: false };
    const { rerender } = render(
      <VoicemailDropSettingsLink voicemailDrop={voicemailDrop} onClick={onClick} />,
    );
    expect(screen.queryByText('voicemailDrop')).toBeNull();

    voicemailDrop.hasVoicemailDropPermission = true;
    rerender(<VoicemailDropSettingsLink voicemailDrop={voicemailDrop} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('voicemailDropSettings'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('VoicemailDropView', () => {
  beforeEach(() => {
    VoicemailDropPanel.mockClear();
    watch.mockClear();
  });

  function createView(overrides = {}) {
    let contentConfig;
    const handle = { id: 'voicemail' };
    const dependencies = {
      sideWidgetView: {
        createContent: jest.fn((config) => {
          contentConfig = config;
          return handle;
        }),
        openContent: jest.fn(),
        closeContent: jest.fn(),
      },
      voicemailDrop: {
        hasVoicemailDropPermission: true,
        allMessages: [{ id: 'message', label: 'Greeting' }],
        fetchExternalVoicemailDropFiles: jest.fn(async () => {}),
      },
      webphone: {
        sessions: [{ id: 'session' }],
        dropVoicemailMessage: jest.fn(async () => true),
      },
      router: { push: jest.fn() },
      portManager: { shared: false, isServer: false },
      ...overrides,
    };
    const view = new VoicemailDropView(
      dependencies.sideWidgetView,
      dependencies.voicemailDrop,
      dependencies.webphone,
      dependencies.router,
      dependencies.portManager,
    );
    return {
      dependencies,
      getContentConfig: () => contentConfig,
      handle,
      view,
    };
  }

  test('opens only with permission and closes its side-widget tab', async () => {
    const { dependencies, getContentConfig, handle, view } = createView();
    expect(getContentConfig()).toEqual(
      expect.objectContaining({
        id: 'voicemail-drop',
        name: 'Localized voicemail drop',
      }),
    );
    expect(getContentConfig().getName()).toBe('Localized voicemail drop');
    await view.open('session');
    expect(view.currentSessionId).toBe('session');
    expect(dependencies.sideWidgetView.openContent).toHaveBeenCalledWith(handle);
    await view.close();
    expect(dependencies.sideWidgetView.closeContent).toHaveBeenCalledWith(handle, undefined);

    const disabled = createView({
      voicemailDrop: {
        hasVoicemailDropPermission: false,
        allMessages: [],
        fetchExternalVoicemailDropFiles: jest.fn(),
      },
    });
    await disabled.view.open('session');
    expect(disabled.view.currentSessionId).toBeNull();
    expect(disabled.dependencies.sideWidgetView.openContent).not.toHaveBeenCalled();
  });

  test('drops a message and navigates only after success', async () => {
    const { dependencies, handle, view } = createView();
    await expect(view._dropMessage('message')).resolves.toBe(false);
    view.open('session');
    await expect(view._dropMessage('message')).resolves.toBe(true);
    expect(dependencies.webphone.dropVoicemailMessage).toHaveBeenCalledWith(
      'session',
      'message',
    );
    expect(dependencies.sideWidgetView.closeContent).toHaveBeenCalledWith(handle, undefined);
    expect(dependencies.router.push).toHaveBeenCalledWith('/dialer');

    dependencies.webphone.dropVoicemailMessage.mockResolvedValueOnce(false);
    dependencies.sideWidgetView.closeContent.mockClear();
    dependencies.router.push.mockClear();
    await expect(view._dropMessage('message')).resolves.toBe(false);
    expect(dependencies.sideWidgetView.closeContent).not.toHaveBeenCalled();
    expect(dependencies.router.push).not.toHaveBeenCalled();
  });

  test('loads external messages and clears session state on tab close', async () => {
    const { dependencies, getContentConfig, view } = createView();
    view.open('session');
    await view._loadMessages();
    expect(dependencies.voicemailDrop.fetchExternalVoicemailDropFiles).toHaveBeenCalled();
    getContentConfig().onClose();
    expect(view.currentSessionId).toBeNull();
  });

  test('renders picker props and stable callbacks in side-widget content', async () => {
    const { dependencies, getContentConfig, handle, view } = createView();
    view.open('session');
    const SideWidgetContent = getContentConfig().view;
    render(<SideWidgetContent showCloseButton={false} />);
    const props = VoicemailDropPanel.mock.calls[0][0];
    expect(props.messages).toEqual([{ id: 'message', label: 'Greeting' }]);
    expect(props.showCloseButton).toBe(false);
    props.onClose();
    await props.onLoad();
    await props.onDrop('message');
    expect(dependencies.sideWidgetView.closeContent).toHaveBeenCalledWith(handle, undefined);
    expect(dependencies.voicemailDrop.fetchExternalVoicemailDropFiles).toHaveBeenCalled();
    expect(dependencies.webphone.dropVoicemailMessage).toHaveBeenCalledWith(
      'session',
      'message',
    );
    expect(view.component()).toBeNull();
  });

  test('watches the active session even when the picker is not mounted', () => {
    const { dependencies, handle, view } = createView();
    view.onInit();
    const stopWatching = watch.mock.results.at(-1).value;
    view.open('session');
    dependencies.webphone.sessions = [];
    const selector = watch.mock.calls.at(-1)[1];
    const watcher = watch.mock.calls.at(-1)[2];

    watcher(selector());

    expect(dependencies.sideWidgetView.closeContent).toHaveBeenCalledWith(handle, {
      collapseWhenLast: true,
    });
    view.onReset();
    expect(stopWatching).toHaveBeenCalledTimes(1);
  });

  test('leaves the call watcher to the server port, which owns the tab', () => {
    const { view } = createView({
      portManager: { shared: true, isServer: false },
    });

    view.onInit();

    expect(watch).not.toHaveBeenCalled();
  });

  test('watches the call on the server port', () => {
    const { view } = createView({
      portManager: { shared: true, isServer: true },
    });

    view.onInit();

    expect(watch).toHaveBeenCalledTimes(1);
  });

  test('clears its session and content tab when the module resets', () => {
    const { dependencies, handle, view } = createView();
    view.onInit();
    const stopWatching = watch.mock.results.at(-1).value;
    view.open('session');
    dependencies.sideWidgetView.closeContent.mockClear();

    view.onReset();

    expect(stopWatching).toHaveBeenCalledTimes(1);
    expect(dependencies.sideWidgetView.closeContent).toHaveBeenCalledWith(handle, {
      collapseWhenLast: true,
    });
    expect(view.currentSessionId).toBeNull();
  });
});
