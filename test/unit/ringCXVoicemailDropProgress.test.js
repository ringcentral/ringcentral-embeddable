import React from 'react';
import { act, render, screen } from '@testing-library/react';

// The shared Spring UI mock has no linear progress bar, so this suite adds
// one that exposes its value the way the real bar does.
jest.mock('@ringcentral/spring-ui', () => {
  const ReactActual = jest.requireActual('react');
  return {
    ...jest.requireActual('../mocks/springUiMock'),
    LinearProgressIndicator: ({
      value,
      max,
      progressBarProps,
      variant: _variant,
      slim: _slim,
      ...props
    }) =>
      ReactActual.createElement('div', {
        role: 'progressbar',
        'data-sign': 'voicemailDropProgressBar',
        'aria-valuenow': value,
        'aria-valuemax': max,
        ...progressBarProps,
        ...props,
      }),
  };
});

const {
  VoicemailDropProgress,
} = require('../../src/ringcx/views/CxActiveCallView/VoicemailDropProgress');
const {
  voicemailDropStatus,
} = require('../../src/app/services/WebphoneV2/voicemailDropStatus');

const NOW = new Date('2026-10-22T08:00:00.000Z').getTime();
const WAITING_LABEL = 'Waiting for the greeting to end';
const SENDING_LABEL = 'Dropping voicemail';

function renderProgress(drop) {
  return render(
    <VoicemailDropProgress
      drop={drop}
      waitingLabel={WAITING_LABEL}
      sendingLabel={SENDING_LABEL}
    />,
  );
}

function advance(ms) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

const getElapsed = () =>
  document.querySelector('[data-sign="voicemailDropElapsed"]');

describe('VoicemailDropProgress', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('counts the wait for the greeting to end with a spinner', () => {
    renderProgress({
      status: voicemailDropStatus.waitingForGreetingEnd,
      startedAt: NOW,
    });

    expect(screen.getByText(WAITING_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(SENDING_LABEL)).toBeNull();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(
      document.querySelector('[data-sign="voicemailDropProgressBar"]'),
    ).toBeNull();
    expect(getElapsed()).toHaveTextContent('00:00');

    advance(3000);

    expect(getElapsed()).toHaveTextContent('00:03');
  });

  test('shows the played and total time with a bar while sending', () => {
    renderProgress({
      status: voicemailDropStatus.sending,
      startedAt: NOW - 5000,
      sendingStartedAt: NOW,
      messageDuration: 21,
    });

    expect(screen.getByText(SENDING_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(WAITING_LABEL)).toBeNull();
    expect(getElapsed()).toHaveTextContent('00:00 / 00:21');
    const bar = screen.getByRole('progressbar', { name: SENDING_LABEL });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '21');

    advance(7000);

    expect(getElapsed()).toHaveTextContent('00:07 / 00:21');
    expect(bar).toHaveAttribute('aria-valuenow', '7');
  });

  test('stops the played time at the message length', () => {
    renderProgress({
      status: voicemailDropStatus.sending,
      startedAt: NOW - 40000,
      sendingStartedAt: NOW - 30000,
      messageDuration: 21,
    });

    expect(getElapsed()).toHaveTextContent('00:21 / 00:21');
    expect(
      screen.getByRole('progressbar', { name: SENDING_LABEL }),
    ).toHaveAttribute('aria-valuenow', '21');

    advance(5000);

    expect(getElapsed()).toHaveTextContent('00:21 / 00:21');
  });

  test('keeps the waiting view while sending has no start time yet', () => {
    renderProgress({
      status: voicemailDropStatus.sending,
      startedAt: NOW - 2000,
      messageDuration: 21,
    });

    expect(screen.getByText(WAITING_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(SENDING_LABEL)).toBeNull();
    expect(
      document.querySelector('[data-sign="voicemailDropProgressBar"]'),
    ).toBeNull();
    expect(getElapsed()).toHaveTextContent('00:02');
  });

  test('stops ticking once unmounted', () => {
    const { unmount } = renderProgress({
      status: voicemailDropStatus.waitingForGreetingEnd,
      startedAt: NOW,
    });
    expect(jest.getTimerCount()).toBe(1);

    unmount();

    expect(jest.getTimerCount()).toBe(0);
  });
});
