import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { VoicemailDropSettingsView } from '../../next/app/views/VoicemailDropSettingsView/VoicemailDropSettings.view';
import { VoicemailDropSettingsLink } from '../../next/app/views/VoicemailDropSettingsView/VoicemailDropSettingsLink';
import { VoicemailDropSettingsPanel } from '../../next/app/views/VoicemailDropSettingsView/VoicemailDropSettingsPanel';
import { VoicemailDropView } from '../../next/app/views/VoicemailDropView/VoicemailDrop.view';
import { VoicemailDropPanel } from '../../next/app/views/VoicemailDropView/VoicemailDropPanel';

jest.mock('../../next/app/views/VoicemailDropSettingsView/VoicemailDropSettingsPanel', () => ({
  VoicemailDropSettingsPanel: jest.fn(() => null),
}));

jest.mock('../../next/app/views/VoicemailDropView/VoicemailDropPanel', () => ({
  VoicemailDropPanel: jest.fn(() => null),
}));

jest.mock('../../next/app/views/ExpandedView', () => ({
  ExpandedView: class ExpandedView {},
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
    const view = new VoicemailDropSettingsView(voicemailDrop, router);

    renderViewModule(view);

    const props = VoicemailDropSettingsPanel.mock.calls[0][0];
    expect(props.messages).toEqual([{ id: 'local' }]);
    expect(props.messages).not.toBe(voicemailDrop.voicemailMessages);
    expect(props.externalMessages).toEqual([{ id: 'external' }]);
    expect(props.noBeepSilenceDuration).toBe(4);
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
  });

  function createView(overrides = {}) {
    let expandedConfig;
    const handle = { id: 'voicemail' };
    const dependencies = {
      expandedView: {
        create: jest.fn((config) => {
          expandedConfig = config;
          return handle;
        }),
        open: jest.fn(),
        close: jest.fn(),
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
      ...overrides,
    };
    const view = new VoicemailDropView(
      dependencies.expandedView,
      dependencies.voicemailDrop,
      dependencies.webphone,
      dependencies.router,
    );
    return {
      dependencies,
      getExpandedConfig: () => expandedConfig,
      handle,
      view,
    };
  }

  test('opens only with permission and closes the expanded view', () => {
    const { dependencies, handle, view } = createView();
    view.open('session');
    expect(view.currentSessionId).toBe('session');
    expect(dependencies.expandedView.open).toHaveBeenCalledWith(handle);
    view.close();
    expect(dependencies.expandedView.close).toHaveBeenCalled();

    const disabled = createView({
      voicemailDrop: {
        hasVoicemailDropPermission: false,
        allMessages: [],
        fetchExternalVoicemailDropFiles: jest.fn(),
      },
    });
    disabled.view.open('session');
    expect(disabled.view.currentSessionId).toBeNull();
    expect(disabled.dependencies.expandedView.open).not.toHaveBeenCalled();
  });

  test('drops a message and navigates only after success', async () => {
    const { dependencies, view } = createView();
    await expect(view._dropMessage('message')).resolves.toBe(false);
    view.open('session');
    await expect(view._dropMessage('message')).resolves.toBe(true);
    expect(dependencies.webphone.dropVoicemailMessage).toHaveBeenCalledWith(
      'session',
      'message',
    );
    expect(dependencies.expandedView.close).toHaveBeenCalled();
    expect(dependencies.router.push).toHaveBeenCalledWith('/dialer');

    dependencies.webphone.dropVoicemailMessage.mockResolvedValueOnce(false);
    dependencies.expandedView.close.mockClear();
    dependencies.router.push.mockClear();
    await expect(view._dropMessage('message')).resolves.toBe(false);
    expect(dependencies.expandedView.close).not.toHaveBeenCalled();
    expect(dependencies.router.push).not.toHaveBeenCalled();
  });

  test('loads external messages and clears session state on expanded close', async () => {
    const { dependencies, getExpandedConfig, view } = createView();
    view.open('session');
    await view._loadMessages();
    expect(dependencies.voicemailDrop.fetchExternalVoicemailDropFiles).toHaveBeenCalled();
    getExpandedConfig().onClose();
    expect(view.currentSessionId).toBeNull();
  });

  test('renders picker props and stable callbacks in expanded content', async () => {
    const { dependencies, getExpandedConfig, view } = createView();
    view.open('session');
    const ExpandedContent = getExpandedConfig().view;
    render(<ExpandedContent />);
    const props = VoicemailDropPanel.mock.calls[0][0];
    expect(props.messages).toEqual([{ id: 'message', label: 'Greeting' }]);
    props.onClose();
    await props.onLoad();
    await props.onDrop('message');
    expect(dependencies.expandedView.close).toHaveBeenCalled();
    expect(dependencies.voicemailDrop.fetchExternalVoicemailDropFiles).toHaveBeenCalled();
    expect(dependencies.webphone.dropVoicemailMessage).toHaveBeenCalledWith(
      'session',
      'message',
    );
    expect(view.component()).toBeNull();
  });

  test('closes automatically when the active session disappears', async () => {
    const { dependencies, getExpandedConfig, view } = createView({
      webphone: {
        sessions: [],
        dropVoicemailMessage: jest.fn(),
      },
    });
    view.open('session');
    const ExpandedContent = getExpandedConfig().view;
    render(<ExpandedContent />);
    await waitFor(() => expect(dependencies.expandedView.close).toHaveBeenCalled());
  });
});
