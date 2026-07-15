import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { AudioPreview } from '../../next/app/views/VoicemailDropSettingsView/AudioPreview';

class FakeAudio {
  constructor(source) {
    this.source = source;
    this.src = source;
    this.currentTime = 0;
    this.duration = 0;
    this.listeners = new Map();
    this.play = jest.fn(async () => {});
    this.pause = jest.fn(() => this.emit('pause'));
    this.load = jest.fn();
    this.remove = jest.fn();
    this.removeAttribute = jest.fn((name) => {
      if (name === 'src') {
        this.src = '';
      }
    });
    this.addEventListener = jest.fn((name, listener) => {
      this.listeners.set(name, listener);
    });
    this.removeEventListener = jest.fn((name) => {
      this.listeners.delete(name);
    });
    FakeAudio.instances.push(this);
  }

  emit(name) {
    this.listeners.get(name)?.();
  }
}

FakeAudio.instances = [];

describe('AudioPreview', () => {
  const originalAudio = global.Audio;

  beforeEach(() => {
    FakeAudio.instances = [];
    global.Audio = FakeAudio;
  });

  afterEach(() => {
    global.Audio = originalAudio;
    jest.restoreAllMocks();
  });

  test('renders disabled controls without a source', () => {
    render(
      <AudioPreview
        name="Greeting"
        playLabel="Play greeting"
        stopLabel="Stop greeting"
      />,
    );

    expect(screen.getByRole('button', { name: 'Play greeting' })).toBeDisabled();
    expect(screen.getByRole('slider', { name: 'Greeting' })).toBeDisabled();
    expect(FakeAudio.instances).toEqual([]);
  });

  test('tracks duration, progress, seeking, playback, pause, and completion', async () => {
    const { unmount } = render(
      <AudioPreview
        source="data:audio/mpeg;base64,abc"
        name="Greeting"
        playLabel="Play greeting"
        stopLabel="Stop greeting"
      />,
    );
    const audio = FakeAudio.instances[0];
    act(() => {
      audio.duration = 120;
      audio.emit('loadedmetadata');
      audio.currentTime = 30;
      audio.emit('timeupdate');
    });

    expect(await screen.findByText('00:30')).toBeInTheDocument();
    expect(screen.getByText('02:00')).toBeInTheDocument();
    const slider = screen.getByRole('slider', { name: 'Greeting' });
    expect(slider).toHaveValue('25');
    fireEvent.change(slider, { target: { value: '50' } });
    expect(audio.currentTime).toBe(60);
    expect(screen.getByText('01:00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Play greeting' }));
    await waitFor(() => expect(audio.play).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Stop greeting' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stop greeting' }));
    expect(audio.pause).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Play greeting' })).toBeInTheDocument();

    act(() => {
      audio.currentTime = 120;
      audio.emit('ended');
    });
    expect(audio.currentTime).toBe(0);
    expect(screen.getByText('00:00')).toBeInTheDocument();

    unmount();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.removeEventListener).toHaveBeenCalledTimes(5);
  });

  test('releases playing audio when the preview unmounts', async () => {
    const { unmount } = render(
      <AudioPreview
        source="audio.wav"
        name="Greeting"
        playLabel="Play"
        stopLabel="Stop"
      />,
    );
    const audio = FakeAudio.instances[0];
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    await screen.findByRole('button', { name: 'Stop' });

    unmount();

    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.removeAttribute).toHaveBeenCalledWith('src');
    expect(audio.src).toBe('');
    expect(audio.load).toHaveBeenCalledTimes(1);
    expect(audio.remove).toHaveBeenCalledTimes(1);
    expect(audio.removeEventListener).toHaveBeenCalledTimes(5);
    expect(audio.listeners).toHaveProperty('size', 0);
  });

  test('normalizes non-finite duration and handles duration changes', () => {
    render(
      <AudioPreview
        source="audio.wav"
        name="Greeting"
        playLabel="Play"
        stopLabel="Stop"
      />,
    );
    const audio = FakeAudio.instances[0];
    act(() => {
      audio.duration = Number.POSITIVE_INFINITY;
      audio.emit('loadedmetadata');
    });
    expect(screen.getByRole('slider', { name: 'Greeting' })).toBeDisabled();

    act(() => {
      audio.duration = 10;
      audio.emit('durationchange');
    });
    expect(screen.getByRole('slider', { name: 'Greeting' })).not.toBeDisabled();
  });

  test('stays stopped when audio playback rejects', async () => {
    render(
      <AudioPreview
        source="audio.wav"
        name="Greeting"
        playLabel="Play"
        stopLabel="Stop"
      />,
    );
    const audio = FakeAudio.instances[0];
    audio.play.mockRejectedValueOnce(new Error('blocked'));
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    await waitFor(() => expect(audio.play).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  test('resets when the source disappears or Audio is unavailable', () => {
    const props = {
      source: 'audio.wav',
      name: 'Greeting',
      playLabel: 'Play',
      stopLabel: 'Stop',
    };
    const { rerender } = render(<AudioPreview {...props} />);
    const audio = FakeAudio.instances[0];
    rerender(<AudioPreview {...props} source={undefined} />);
    expect(audio.pause).toHaveBeenCalled();
    expect(screen.getByRole('slider', { name: 'Greeting' })).toBeDisabled();

    global.Audio = undefined;
    rerender(<AudioPreview {...props} source="another.wav" />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(FakeAudio.instances).toHaveLength(1);
  });

  test('ignores seek attempts before duration is known', () => {
    render(
      <AudioPreview
        source="audio.wav"
        name="Greeting"
        playLabel="Play"
        stopLabel="Stop"
      />,
    );
    const audio = FakeAudio.instances[0];
    fireEvent.change(screen.getByRole('slider', { name: 'Greeting' }), {
      target: { value: '50' },
    });
    expect(audio.currentTime).toBe(0);
  });
});
