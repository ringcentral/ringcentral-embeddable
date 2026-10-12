import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { VoicemailDropPanel } from '../../src/app/views/VoicemailDropView/VoicemailDropPanel';

function createProps(overrides = {}) {
  return {
    messages: [],
    onClose: jest.fn(),
    onDrop: jest.fn(async () => true),
    onLoad: jest.fn(async () => {}),
    showCloseButton: true,
    ...overrides,
  };
}

describe('VoicemailDropPanel', () => {
  test('shows loading, loads messages, and closes from the header', async () => {
    let resolveLoad;
    const props = createProps({
      onLoad: jest.fn(() => new Promise((resolve) => {
        resolveLoad = resolve;
      })),
    });
    render(<VoicemailDropPanel {...props} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('pickerInfo')).toBeInTheDocument();
    expect(screen.getByTestId('voicemailDropHeader')).toHaveAttribute(
      'variant',
      'detached',
    );
    expect(screen.getByTestId('voicemailDropHeaderCenter')).toContainElement(
      screen.getByText('voicemailDrop'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    resolveLoad();
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
    expect(screen.getByText('noMessages')).toBeInTheDocument();
    expect(screen.getByText('noMessagesDescription')).toBeInTheDocument();
  });

  test('shows a load error when external messages fail', async () => {
    const props = createProps({
      onLoad: jest.fn(async () => {
        throw new Error('load failed');
      }),
    });
    render(<VoicemailDropPanel {...props} />);
    expect(await screen.findByText('loadFailed')).toBeInTheDocument();
    expect(screen.getByText('noMessages')).toBeInTheDocument();
  });

  test('hides the page close button when the picker is hosted in tabs', () => {
    const props = createProps({ showCloseButton: false });
    render(<VoicemailDropPanel {...props} />);
    expect(screen.queryByRole('button', { name: 'close' })).toBeNull();
  });

  test('renders messages even while external loading is pending', () => {
    const props = createProps({
      messages: [
        { id: 'one', label: 'First' },
        { id: 'two', label: 'Second' },
      ],
      onLoad: jest.fn(() => new Promise(() => {})),
    });
    render(<VoicemailDropPanel {...props} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByRole('list', { name: 'prerecordedMessages' })).toBeInTheDocument();
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  test('drops a selected message successfully', async () => {
    const props = createProps({ messages: [{ id: 'one', label: 'First' }] });
    render(<VoicemailDropPanel {...props} />);
    fireEvent.click(screen.getByTestId('voicemailDrop-one'));
    await waitFor(() => expect(props.onDrop).toHaveBeenCalledWith('one'));
    expect(screen.queryByText('dropFailed')).toBeNull();
    expect(screen.getByTestId('voicemailDrop-one')).not.toBeDisabled();
  });

  test.each([
    ['returns false', jest.fn(async () => false)],
    ['rejects', jest.fn(async () => { throw new Error('drop failed'); })],
  ])('shows a drop error when the action %s', async (_label, onDrop) => {
    const props = createProps({
      messages: [{ id: 'one', label: 'First' }],
      onDrop,
    });
    render(<VoicemailDropPanel {...props} />);
    fireEvent.click(screen.getByTestId('voicemailDrop-one'));
    expect(await screen.findByText('dropFailed')).toBeInTheDocument();
    expect(screen.getByTestId('voicemailDrop-one')).not.toBeDisabled();
  });

  test('disables every drop action while one message is pending', async () => {
    let resolveDrop;
    const props = createProps({
      messages: [
        { id: 'one', label: 'First' },
        { id: 'two', label: 'Second' },
      ],
      onDrop: jest.fn(() => new Promise((resolve) => {
        resolveDrop = resolve;
      })),
    });
    render(<VoicemailDropPanel {...props} />);
    fireEvent.click(screen.getByTestId('voicemailDrop-one'));
    expect(screen.getByTestId('voicemailDrop-one')).toBeDisabled();
    expect(screen.getByTestId('voicemailDrop-two')).toBeDisabled();
    resolveDrop(true);
    await waitFor(() => expect(screen.getByTestId('voicemailDrop-one')).not.toBeDisabled());
  });

  test('ignores late loading and drop results after unmount', async () => {
    let rejectLoad;
    let resolveDrop;
    const props = createProps({
      messages: [{ id: 'one', label: 'First' }],
      onLoad: jest.fn(() => new Promise((_resolve, reject) => {
        rejectLoad = reject;
      })),
      onDrop: jest.fn(() => new Promise((resolve) => {
        resolveDrop = resolve;
      })),
    });
    const { unmount } = render(<VoicemailDropPanel {...props} />);
    fireEvent.click(screen.getByTestId('voicemailDrop-one'));
    unmount();
    rejectLoad(new Error('late load'));
    resolveDrop(false);
    await Promise.resolve();
    await Promise.resolve();
  });
});
