/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import IncomingCallPad from '../../src/components/IncomingCallPad';

jest.mock('@ringcentral-integration/widgets/components/IncomingCallPad/i18n', () => ({
  getString: jest.fn((key) => key),
}));

jest.mock('@ringcentral/juno-icon', () => {
  const React = require('react');
  const createIcon = (name) => function MockIcon() {
    return <span data-icon={name} />;
  };
  return {
    EndAnswer: createIcon('EndAnswer'),
    Forwarding: createIcon('Forwarding'),
    HoldAnswer: createIcon('HoldAnswer'),
    Ignore: createIcon('Ignore'),
    Phone: createIcon('Phone'),
    Sms: createIcon('Sms'),
    Voicemail: createIcon('Voicemail'),
  };
});

jest.mock('@ringcentral/juno', () => {
  const React = require('react');
  const cleanProps = (props) => Object.keys(props).reduce((result, key) => {
    if (key !== 'children' && !key.startsWith('$')) {
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
  return {
    RcDialog: ({ children, open }) => (
      open ? <div data-sign="reply-dialog">{children}</div> : null
    ),
    styled,
  };
});

jest.mock('../../src/components/CallCtrlButton', () => (
  function MockCallCtrlButton({
    dataSign,
    disabled,
    onClick,
    title,
  }) {
    return (
      <button
        data-sign={dataSign}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {title}
      </button>
    );
  }
));

jest.mock('../../src/components/ForwardForm', () => (
  function MockForwardForm({
    forwardingNumbers,
    onCancel,
    onForward,
    open,
  }) {
    if (!open) {
      return null;
    }
    return (
      <div data-sign="forward-form">
        <span>{forwardingNumbers.map((item) => item.phoneNumber).join(',')}</span>
        <button type="button" onClick={() => onForward('+16505550100')}>
          submit-forward
        </button>
        <button type="button" onClick={onCancel}>
          cancel-forward
        </button>
      </div>
    );
  }
));

jest.mock('@ringcentral-integration/widgets/components/ReplyWithMessage', () => (
  function MockReplyWithMessage({
    disabled,
    onCancel,
    onChange,
    onReply,
    value,
  }) {
    return (
      <div data-sign="reply-with-message">
        <input
          aria-label="reply-message"
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" disabled={disabled} onClick={() => onReply(value)}>
          submit-reply
        </button>
        <button type="button" onClick={onCancel}>
          cancel-reply
        </button>
      </div>
    );
  }
));

function createProps(overrides = {}) {
  return {
    answer: jest.fn(),
    answerAndEnd: jest.fn(),
    answerAndHold: jest.fn(),
    currentLocale: 'en-US',
    forwardingNumbers: [{ phoneNumber: '+16505550100' }],
    formatPhone: jest.fn((phone) => `formatted-${phone}`),
    ignore: jest.fn(),
    onForward: jest.fn(),
    reject: jest.fn(),
    replyWithMessage: jest.fn(),
    searchContact: jest.fn(),
    searchContactList: [],
    sessionId: 'session-1',
    startReply: jest.fn(),
    toVoiceMail: jest.fn(),
    ...overrides,
  };
}

describe('IncomingCallPad', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('handles single-call actions, forwarding, reply, and delayed rejection', () => {
    const props = createProps();
    const { rerender } = render(<IncomingCallPad {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'forward' }));
    expect(props.startReply).toHaveBeenCalled();
    expect(screen.getByText('+16505550100')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'submit-forward' }));
    expect(props.onForward).toHaveBeenCalledWith('+16505550100');
    fireEvent.click(screen.getByRole('button', { name: 'cancel-forward' }));
    expect(screen.queryByText('submit-forward')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'reply' }));
    expect(props.startReply).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByLabelText('reply-message'), {
      target: { value: 'I will call back' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'submit-reply' }));
    expect(props.replyWithMessage).toHaveBeenCalledWith('I will call back');
    expect(screen.getByRole('button', { name: 'submit-reply' }).disabled).toBe(true);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(props.reject).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'cancel-reply' }));
    expect(screen.queryByLabelText('reply-message')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'toVoicemail' }));
    expect(props.toVoiceMail).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'toVoicemail' }).disabled).toBe(true);

    rerender(<IncomingCallPad {...props} sessionId="session-2" />);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(props.reject).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'ignore' }));
    fireEvent.click(screen.getByRole('button', { name: 'answer' }));
    expect(props.reject).toHaveBeenCalledTimes(2);
    expect(props.answer).toHaveBeenCalled();
  });

  it('uses multi-call answer controls and call-queue ignore behavior', () => {
    const multiCallProps = createProps({
      hasOtherActiveCall: true,
    });
    const { rerender } = render(<IncomingCallPad {...multiCallProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'answerAndEnd' }));
    fireEvent.click(screen.getByRole('button', { name: 'answerAndHold' }));
    expect(multiCallProps.answerAndEnd).toHaveBeenCalled();
    expect(multiCallProps.answerAndHold).toHaveBeenCalled();

    const queueProps = createProps({
      isCallQueueCall: true,
    });
    rerender(<IncomingCallPad {...queueProps} />);

    expect(screen.queryByRole('button', { name: 'forward' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'reply' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'toVoicemail' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'ignore' }));
    fireEvent.click(screen.getByRole('button', { name: 'answer' }));
    expect(queueProps.ignore).toHaveBeenCalled();
    expect(queueProps.answer).toHaveBeenCalled();
  });
});
