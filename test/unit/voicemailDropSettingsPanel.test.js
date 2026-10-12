import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';

import { AudioPreview } from '../../src/app/views/VoicemailDropSettingsView/AudioPreview';
import { VoicemailDropMessageEditor } from '../../src/app/views/VoicemailDropSettingsView/VoicemailDropMessageEditor';
import { VoicemailDropSettingsPanel } from '../../src/app/views/VoicemailDropSettingsView/VoicemailDropSettingsPanel';
import { VOICEMAIL_DROP_LIMITS } from '../../src/app/views/VoicemailDropSettingsView/VoicemailDropSettings.constants';

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppFooterNav: jest.fn(() => null),
  AppHeaderNav: jest.fn(({ children }) => <>{children}</>),
}));

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: jest.fn(({ children, onBackClick }) => (
    <header>
      <button type="button" aria-label="back" onClick={onBackClick}>
        Back
      </button>
      {children}
    </header>
  )),
}));

jest.mock('../../src/app/views/VoicemailDropSettingsView/AudioPreview', () => ({
  AudioPreview: jest.fn(() => <div>Audio preview</div>),
}));

jest.mock(
  '../../src/app/views/VoicemailDropSettingsView/VoicemailDropMessageEditor',
  () => ({
    VoicemailDropMessageEditor: jest.fn(() => <div>Message editor</div>),
  }),
);

function createProps(overrides = {}) {
  return {
    messages: [],
    externalMessages: [],
    noBeepSilenceDuration: 4,
    onBack: jest.fn(),
    onDelete: jest.fn(),
    onLoad: jest.fn(async () => {}),
    onSave: jest.fn(),
    onSilenceDurationChange: jest.fn(),
    ...overrides,
  };
}

describe('VoicemailDropSettingsPanel', () => {
  beforeEach(() => {
    AppFooterNav.mockClear();
    AppHeaderNav.mockClear();
    PageHeader.mockClear();
    AudioPreview.mockClear();
    VoicemailDropMessageEditor.mockClear();
  });

  test('loads settings and renders the empty state', async () => {
    const props = createProps();
    render(<VoicemailDropSettingsPanel {...props} />);

    await waitFor(() => expect(props.onLoad).toHaveBeenCalledTimes(1));
    expect(screen.getByText('settingsTitle')).toBeInTheDocument();
    expect(screen.getByText('settingsInfo')).toBeInTheDocument();
    expect(screen.getByText('noMessages')).toBeInTheDocument();
    expect(screen.getByText('noMessagesDescription')).toBeInTheDocument();
    expect(AppHeaderNav).toHaveBeenCalledWith(
      expect.objectContaining({ override: true }),
      {},
    );
    expect(PageHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        children: 'settingsTitle',
        onBackClick: props.onBack,
      }),
      {},
    );
    expect(AppFooterNav).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('voicemailDropSettingsContent')).toHaveClass(
      'flex-auto',
      'overflow-y-auto',
      'overflow-x-hidden',
    );
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  test('reports external-message load failures while mounted', async () => {
    const props = createProps({
      onLoad: jest.fn(async () => {
        throw new Error('load failed');
      }),
    });
    render(<VoicemailDropSettingsPanel {...props} />);
    expect(await screen.findByText('loadFailed')).toBeInTheDocument();
  });

  test('does not update load error state after unmount', async () => {
    let rejectLoad;
    const props = createProps({
      onLoad: jest.fn(() => new Promise((_resolve, reject) => {
        rejectLoad = reject;
      })),
    });
    const { unmount } = render(<VoicemailDropSettingsPanel {...props} />);
    unmount();
    rejectLoad(new Error('late failure'));
    await Promise.resolve();
  });

  test('opens a new-message editor and handles save and back', () => {
    const props = createProps();
    render(<VoicemailDropSettingsPanel {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'addMessage' }));

    expect(screen.getByText('Message editor')).toBeInTheDocument();
    let editorProps = VoicemailDropMessageEditor.mock.calls.at(-1)[0];
    expect(editorProps.message).toBeUndefined();
    act(() => editorProps.onSave({ id: 'new', label: 'New' }));
    expect(props.onSave).toHaveBeenCalledWith({ id: 'new', label: 'New' });
    expect(screen.getByText('settingsTitle')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'addMessage' }));
    editorProps = VoicemailDropMessageEditor.mock.calls.at(-1)[0];
    act(() => editorProps.onBack());
    expect(screen.getByText('settingsTitle')).toBeInTheDocument();
  });

  test('renders local and external messages with the right controls', () => {
    const local = {
      id: 'local',
      label: 'Local greeting',
      file: 'data:audio/mpeg;base64,abc',
      fileName: 'local.mp3',
    };
    const external = {
      id: 'external',
      label: 'External greeting',
      uri: 'https://example.com/external.wav',
    };
    const props = createProps({ messages: [local], externalMessages: [external] });
    render(<VoicemailDropSettingsPanel {...props} />);

    expect(screen.getByRole('list', { name: 'prerecordedMessages' })).toBeInTheDocument();
    expect(screen.getByText('Local greeting')).toBeInTheDocument();
    expect(screen.getByText('local.mp3')).toBeInTheDocument();
    expect(screen.getByText('External greeting')).toBeInTheDocument();
    expect(screen.getByText('externalMessage')).toBeInTheDocument();
    expect(AudioPreview).toHaveBeenCalledTimes(2);
    expect(AudioPreview).toHaveBeenCalledWith(
      expect.objectContaining({ source: external.uri, name: external.label }),
      {},
    );
    expect(screen.getAllByRole('button', { name: 'edit' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'delete' })).toHaveLength(1);
  });

  test('opens an existing message for editing', () => {
    const message = { id: 'local', label: 'Local', file: 'data:audio/wav;base64,abc' };
    const props = createProps({ messages: [message] });
    render(<VoicemailDropSettingsPanel {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'edit' }));
    expect(VoicemailDropMessageEditor).toHaveBeenLastCalledWith(
      expect.objectContaining({ message }),
      {},
    );
  });

  test('cancels and confirms local-message deletion', () => {
    const message = { id: 'local', label: 'Local', file: 'data:audio/wav;base64,abc' };
    const props = createProps({ messages: [message] });
    render(<VoicemailDropSettingsPanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('deleteTitle')).toBeInTheDocument();
    expect(screen.getByText('deleteDescription')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(props.onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'deleteAction' }));
    expect(props.onDelete).toHaveBeenCalledWith(message);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('updates and commits silence duration and follows prop changes', () => {
    const props = createProps();
    const { rerender } = render(<VoicemailDropSettingsPanel {...props} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('4');
    fireEvent.change(slider, { target: { value: '6' } });
    expect(slider).toHaveValue('6');
    fireEvent.mouseUp(slider);
    expect(props.onSilenceDurationChange).toHaveBeenCalledWith(6);

    rerender(<VoicemailDropSettingsPanel {...props} noBeepSilenceDuration={3} />);
    expect(screen.getByRole('slider')).toHaveValue('3');
  });

  test('disables adding local messages at the configured limit', () => {
    const messages = Array.from(
      { length: VOICEMAIL_DROP_LIMITS.maxMessages },
      (_, index) => ({ id: `${index}`, label: `Message ${index}` }),
    );
    const props = createProps({ messages });
    render(<VoicemailDropSettingsPanel {...props} />);
    expect(screen.getByRole('button', { name: 'addMessage' })).toBeDisabled();
  });
});
