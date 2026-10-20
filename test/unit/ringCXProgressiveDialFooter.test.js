// Leads tab pieces of progressive dial mode: the Start / Stop dialing footer
// with its countdown, and lead rows that show numbers as text and mark the
// lead dialed next.

jest.mock('@ringcentral-integration/micro-core/src/app/hooks', () => ({
  useLocale: () => ({
    t: (key, params) => (params ? `${key} ${params.seconds}` : key),
  }),
}));
jest.mock('../../src/ringcx/services/CxLeads', () => ({
  SEARCH_DISABLE_DIAL_STATES: [],
}));
jest.mock('../../src/ringcx/components/ManualPassForm', () => ({
  ManualPassForm: () => null,
}));

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { LeadItem } from '../../src/ringcx/components/LeadItem/LeadItem';
import { ProgressiveDialFooter } from '../../src/ringcx/components/ProgressiveDialFooter/ProgressiveDialFooter';

const byDataSign = (dataSign) =>
  document.querySelector(`[data-sign="${dataSign}"]`);

function renderFooter(props = {}) {
  const onStart = jest.fn();
  const onStop = jest.fn();
  render(
    <ProgressiveDialFooter
      running={false}
      phase="idle"
      nextDialAt={null}
      onStart={onStart}
      onStop={onStop}
      {...props}
    />,
  );
  return { onStart, onStop };
}

describe('ProgressiveDialFooter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('offers Start dialing while the dialer is stopped', () => {
    const { onStart } = renderFooter();

    expect(byDataSign('stopDialingButton')).toBeNull();
    expect(byDataSign('progressiveDialCountdown')).toBeNull();
    fireEvent.click(screen.getByText('startDialing'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  test('disables Start dialing when asked to', () => {
    renderFooter({ disabled: true });

    expect(byDataSign('startDialingButton')).toBeDisabled();
  });

  test('shows Start dialing as loading while the line connects', () => {
    renderFooter({ phase: 'connecting' });

    expect(byDataSign('startDialingButton')).toHaveAttribute(
      'data-loading',
      'true',
    );
  });

  test('counts down to the next dial and offers Stop dialing', () => {
    const { onStop } = renderFooter({
      running: true,
      phase: 'countdown',
      nextDialAt: Date.now() + 3000,
    });

    expect(byDataSign('startDialingButton')).toBeNull();
    expect(byDataSign('progressiveDialCountdown')).toHaveTextContent(
      'timeToDial 3',
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(byDataSign('progressiveDialCountdown')).toHaveTextContent(
      'timeToDial 2',
    );

    fireEvent.click(screen.getByText('stopDialing'));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  test('counts down to the next lead fetch when no leads came back', () => {
    renderFooter({
      running: true,
      phase: 'noLeads',
      nextDialAt: Date.now() + 5000,
    });

    expect(byDataSign('progressiveDialCountdown')).toHaveTextContent(
      'retryIn 5',
    );
  });

  test('shows no countdown while it waits for the agent', () => {
    renderFooter({ running: true, phase: 'waiting' });

    expect(byDataSign('progressiveDialCountdown')).toBeNull();
    expect(byDataSign('stopDialingButton')).not.toBeNull();
  });
});

describe('LeadItem in progressive dial mode', () => {
  const lead = {
    leadId: 'lead-1',
    requestId: 'request-1',
    leadState: 'PENDING',
    destination: '6505550100',
  };
  const phoneNumbers = [
    { formatted: '(650) 555-0100', destination: '6505550100' },
  ];

  test('shows the numbers as text and marks the lead dialed next', () => {
    render(
      <LeadItem
        lead={lead}
        phoneNumbers={phoneNumbers}
        displayName="Ada Lovelace"
        isNext
      />,
    );

    expect(byDataSign('phoneNumber')).toHaveTextContent('(650) 555-0100');
    expect(byDataSign('phoneNumber').tagName).toBe('SPAN');
    expect(byDataSign('nextLead')).toHaveTextContent('next');
  });

  test('keeps the number buttons when the agent dials leads', () => {
    const onDial = jest.fn();
    render(
      <LeadItem
        lead={lead}
        phoneNumbers={phoneNumbers}
        displayName="Ada Lovelace"
        onDial={onDial}
      />,
    );

    expect(byDataSign('nextLead')).toBeNull();
    fireEvent.click(screen.getByText('(650) 555-0100'));
    expect(onDial).toHaveBeenCalledWith('6505550100');
  });
});
