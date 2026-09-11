import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';

import { VoicemailDropMessageEditor } from '../src/app/views/VoicemailDropSettingsView/VoicemailDropMessageEditor';
import { AudioPreview } from '../src/app/views/VoicemailDropSettingsView/AudioPreview';
import { VOICEMAIL_DROP_LIMITS } from '../src/app/views/VoicemailDropSettingsView/VoicemailDropSettings.constants';

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

jest.mock('../src/app/views/VoicemailDropSettingsView/AudioPreview', () => ({
  AudioPreview: jest.fn(() => <div>Audio preview</div>),
}));

class FakeFileReader {
  constructor() {
    this.listeners = new Map();
    this.result = null;
    this.error = null;
    FakeFileReader.instances.push(this);
  }

  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }

  readAsDataURL(file) {
    this.file = file;
    if (FakeFileReader.mode === 'deferred') {
      return;
    }
    if (FakeFileReader.mode === 'error') {
      this.error = new Error('read failed');
      this.listeners.get('error')?.();
      return;
    }
    this.result = FakeFileReader.mode === 'non-string'
      ? new ArrayBuffer(2)
      : 'data:audio/mpeg;base64,encoded';
    this.listeners.get('load')?.();
  }

  resolve(value = 'data:audio/mpeg;base64,deferred') {
    this.result = value;
    this.listeners.get('load')?.();
  }
}

FakeFileReader.instances = [];
FakeFileReader.mode = 'success';

function createProps(overrides = {}) {
  return {
    onBack: jest.fn(),
    onSave: jest.fn(),
    ...overrides,
  };
}

function getFileInput(container) {
  return container.querySelector('input[type="file"]');
}

describe('VoicemailDropMessageEditor', () => {
  const originalFileReader = global.FileReader;

  beforeEach(() => {
    FakeFileReader.instances = [];
    FakeFileReader.mode = 'success';
    global.FileReader = FakeFileReader;
    AppFooterNav.mockClear();
    AppHeaderNav.mockClear();
    PageHeader.mockClear();
    AudioPreview.mockClear();
  });

  afterEach(() => {
    global.FileReader = originalFileReader;
    jest.restoreAllMocks();
  });

  test('validates the message name and required audio file', () => {
    const props = createProps();
    render(<VoicemailDropMessageEditor {...props} />);

    expect(screen.getByText('newMessage')).toBeInTheDocument();
    expect(AppHeaderNav).toHaveBeenCalledWith(
      expect.objectContaining({ override: true }),
      {},
    );
    expect(PageHeader).toHaveBeenCalledWith(
      expect.objectContaining({
        children: 'newMessage',
        onBackClick: props.onBack,
      }),
      {},
    );
    expect(AppFooterNav).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('voicemailDropMessageEditorContent')).toHaveClass(
      'flex-auto',
      'overflow-y-auto',
      'overflow-x-hidden',
    );
    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('nameRequired');

    fireEvent.change(screen.getByLabelText('messageName'), {
      target: { value: ' Greeting ' },
    });
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('fileRequired');
    expect(props.onSave).not.toHaveBeenCalled();
  });

  test('rejects unsupported and oversized files', () => {
    const props = createProps();
    const { container } = render(<VoicemailDropMessageEditor {...props} />);
    const input = getFileInput(container);

    fireEvent.change(input, {
      target: { files: [new File(['audio'], 'message.m4a', { type: 'audio/mp4' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('invalidFileType');

    const oversized = new File(['audio'], 'message.mp3', { type: 'audio/mpeg' });
    Object.defineProperty(oversized, 'size', {
      configurable: true,
      value: VOICEMAIL_DROP_LIMITS.maxFileSize + 1,
    });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(screen.getByRole('alert')).toHaveTextContent('fileTooLarge');
    expect(FakeFileReader.instances).toHaveLength(0);
  });

  test('reads a valid file and saves a normalized new message', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1234);
    const props = createProps();
    const { container } = render(<VoicemailDropMessageEditor {...props} />);
    fireEvent.change(screen.getByLabelText('messageName'), {
      target: { value: ' Greeting ' },
    });
    const file = new File(['audio'], 'greeting.mp3', { type: 'audio/mpeg' });
    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    expect(await screen.findByText('greeting.mp3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'replaceAudioFile' })).toBeInTheDocument();
    expect(AudioPreview).toHaveBeenLastCalledWith(
      expect.objectContaining({
        source: 'data:audio/mpeg;base64,encoded',
        name: ' Greeting ',
      }),
      {},
    );
    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(props.onSave).toHaveBeenCalledWith({
      id: '1234',
      label: 'Greeting',
      file: 'data:audio/mpeg;base64,encoded',
      fileName: 'greeting.mp3',
    });
  });

  test('edits an existing message without replacing its id or audio', () => {
    const message = {
      id: 'existing',
      label: 'Original',
      file: 'data:audio/wav;base64,existing',
      fileName: 'existing.wav',
    };
    const props = createProps({ message });
    render(<VoicemailDropMessageEditor {...props} />);

    expect(screen.getByText('editMessage')).toBeInTheDocument();
    expect(screen.getByText('existing.wav')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('messageName'), {
      target: { value: 'Updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    expect(props.onSave).toHaveBeenCalledWith({
      ...message,
      label: 'Updated',
    });
  });

  test.each(['error', 'non-string'])('reports %s FileReader failures', async (mode) => {
    FakeFileReader.mode = mode;
    const props = createProps();
    const { container } = render(<VoicemailDropMessageEditor {...props} />);
    fireEvent.change(getFileInput(container), {
      target: {
        files: [new File(['audio'], 'message.wav', { type: 'audio/wav' })],
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent('readFileFailed');
  });

  test('disables save while a file is being read and handles an empty selection', async () => {
    FakeFileReader.mode = 'deferred';
    const props = createProps();
    const { container } = render(<VoicemailDropMessageEditor {...props} />);
    const input = getFileInput(container);
    fireEvent.change(input, { target: { files: [] } });
    expect(FakeFileReader.instances).toHaveLength(0);

    fireEvent.change(input, {
      target: {
        files: [new File(['audio'], 'message.mp3', { type: 'audio/mpeg' })],
      },
    });
    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
    FakeFileReader.instances[0].resolve();
    await waitFor(() => expect(screen.getByRole('button', { name: 'save' })).not.toBeDisabled());
  });

  test('opens the file picker and supports both back controls', () => {
    const props = createProps();
    const inputClick = jest
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => {});
    render(<VoicemailDropMessageEditor {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'chooseAudioFile' }));
    expect(inputClick).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'back' }));
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }));
    expect(props.onBack).toHaveBeenCalledTimes(2);
  });
});
