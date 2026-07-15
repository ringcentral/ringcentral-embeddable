/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { AudioPlayer } from '../../src/components/AudioPlayer';

let mockAudio;

class TestAudio {
  constructor() {
    this.currentTime = 0;
    this.duration = 0;
    this.listeners = {};
    this.pause = jest.fn(() => {
      this.emit('pause');
    });
    this.play = jest.fn(() => {
      this.emit('play');
    });
    this.readyState = 0;
    this.src = '';
  }

  addEventListener(type, handler) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(handler);
  }

  removeEventListener(type, handler) {
    this.listeners[type] = (this.listeners[type] || []).filter(
      (item) => item !== handler,
    );
  }

  emit(type) {
    (this.listeners[type] || []).forEach((handler) => handler());
  }
}

jest.mock('@ringcentral-integration/widgets/components/VoicemailPlayer/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    Pause: createIcon('Pause'),
    Play: createIcon('Play'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (
      key !== 'children' &&
      !['color', 'focusVariant', 'size', 'symbol', 'valueLabelDisplay', 'variant'].includes(key)
    ) {
      result[key] = props[key];
    }
    return result;
  }, {});
  return {
    RcIconButton: ({ disabled, onClick, title }) => (
      <button type="button" disabled={disabled} onClick={onClick}>
        {title}
      </button>
    ),
    RcSlider: ({ disabled, onChange, value }) => (
      <input
        aria-label="progress"
        disabled={disabled}
        type="range"
        value={value}
        onChange={(event) => onChange(event, Number(event.target.value))}
      />
    ),
    RcTypography: ({ children }) => <span>{children}</span>,
    useAudio: jest.fn(() => mockAudio),
  };
});

jest.mock('@ringcentral/juno/foundation', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (key !== 'children') {
      result[key] = props[key];
    }
    return result;
  }, {});
  const styled = (Component) => () => React.forwardRef((props, ref) => (
    typeof Component === 'string'
      ? React.createElement(Component, { ...cleanProps(props), ref }, props.children)
      : <Component {...props} ref={ref}>{props.children}</Component>
  ));
  styled.div = () => React.forwardRef((props, ref) => (
    <div {...cleanProps(props)} ref={ref}>{props.children}</div>
  ));
  return { styled };
});

describe('AudioPlayer', () => {
  beforeEach(() => {
    mockAudio = new TestAudio();
  });

  it('plays, pauses, seeks, and reacts to audio events', () => {
    const onPlay = jest.fn();
    const { rerender, unmount } = render(
      <AudioPlayer
        currentLocale="en-US"
        duration={120}
        onPlay={onPlay}
        uri="https://example.com/audio.mp3"
      />,
    );

    expect(mockAudio.src).toBe('https://example.com/audio.mp3');
    expect(mockAudio.currentTime).toBe(0);
    expect(screen.getByRole('button', { name: 'play' }).disabled).toBe(false);
    expect(screen.getByText('00:00')).toBeTruthy();
    expect(screen.getByText('02:00')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'play' }));
    expect(mockAudio.play).toHaveBeenCalled();
    expect(onPlay).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'pause' }).disabled).toBe(false);

    mockAudio.currentTime = 30;
    act(() => {
      mockAudio.emit('timeupdate');
    });
    expect(screen.getByText('00:30')).toBeTruthy();
    expect(screen.getByLabelText('progress').value).toBe('25');

    fireEvent.change(screen.getByLabelText('progress'), {
      target: { value: '50' },
    });
    expect(mockAudio.currentTime).toBe(60);

    mockAudio.duration = 240;
    act(() => {
      mockAudio.emit('loadedmetadata');
    });
    expect(screen.getByText('04:00')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'pause' }));
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'play' }).disabled).toBe(false);

    mockAudio.currentTime = 15;
    act(() => {
      mockAudio.emit('ended');
    });
    expect(screen.getByText('00:00')).toBeTruthy();
    act(() => {
      mockAudio.emit('error');
    });
    expect(screen.getByRole('button', { name: 'play' }).disabled).toBe(false);

    rerender(
      <AudioPlayer
        currentLocale="en-US"
        duration={0}
        onPlay={onPlay}
        uri="https://example.com/next.mp3"
      />,
    );
    expect(mockAudio.src).toBe('https://example.com/next.mp3');
    expect(mockAudio.currentTime).toBe(0);

    unmount();
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  it('disables controls when audio is unavailable or disabled', () => {
    const { rerender } = render(
      <AudioPlayer currentLocale="en-US" uri="" />,
    );

    expect(screen.getByRole('button', { name: 'play' }).disabled).toBe(true);
    expect(screen.getByLabelText('progress').disabled).toBe(true);

    rerender(
      <AudioPlayer
        currentLocale="en-US"
        disabled
        uri="https://example.com/audio.mp3"
      />,
    );

    expect(screen.getByRole('button', { name: 'play' }).disabled).toBe(true);
    expect(screen.getByLabelText('progress').disabled).toBe(false);
  });
});
