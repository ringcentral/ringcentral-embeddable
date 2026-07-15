import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { VoicemailDropCallControlPanel } from '../../next/app/views/CallView/CallControlView/VoicemailDropCallControlPanel';

jest.mock(
  '@ringcentral-integration/micro-auth/src/app/components',
  () => ({
    FormattedPhoneNumber: ({ phoneNumber }) => phoneNumber,
  }),
);

jest.mock('@ringcentral-integration/micro-core/src/app/hooks', () => ({
  useLocale: () => ({
    t: (key) => (key === 'voicemailDrop' ? 'Voicemail drop' : key),
  }),
}));

jest.mock('@ringcentral-integration/micro-phone/src/app/hooks', () => ({
  useCallActionButtons: (actions, onAction) =>
    actions.map(({ type, ...action }) => ({
      ...action,
      actionType: type,
      label: type,
      onClick: () => onAction(type),
    })),
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/AiNoteTip',
  () => ({ AiNoteTip: () => null }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/CallCtrlButton',
  () => ({
    CallCtrlButton: ({ color, label, variant, ...props }) => (
      <div
        data-sign={`rendered-${props['data-sign']}`}
        data-color={color}
        data-label={label}
        data-variant={variant}
      />
    ),
  }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/TransferringCall',
  () => ({ TransferringCall: ({ children }) => children }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/useCallControlLayout',
  () => ({
    useCallControlLayout: (_call, { footer, main }) => (
      <>
        {main}
        {footer}
      </>
    ),
  }),
);

jest.mock('@ringcentral/spring-ui', () => ({
  CallButton: ({ TooltipProps: _tooltipProps, ...props }) => (
    <button type="button" {...props} />
  ),
  MenuItemText: ({ children }) => children,
  MenuList: ({ children }) => children,
  Option: ({ children }) => children,
}));

function createProps() {
  return {
    actions: [
      { type: 'mute' },
      { type: 'keypad' },
      { type: 'audio' },
      { type: 'add' },
      { type: 'hold' },
      { type: 'transfer' },
      { type: 'record' },
      { type: 'park' },
      { type: 'voicemail' },
      { type: 'hangUp' },
    ],
    AudioCardComponent: null,
    call: { telephonySessionId: 'telephony-session' },
    expanded: false,
    flipNumbers: [],
    onAction: jest.fn(),
    onExpand: jest.fn(),
    transferringCalls: null,
  };
}

describe('VoicemailDropCallControlPanel', () => {
  test('keeps three call actions in each row regardless of label width', () => {
    render(<VoicemailDropCallControlPanel {...createProps()} />);

    const actionButtons = screen.getByTestId('actionButtons');
    expect(actionButtons).toHaveClass(
      'grid',
      'w-full',
      'grid-cols-3',
      'gap-4',
      'px-10',
    );
    expect(actionButtons).not.toHaveClass('flex', 'flex-wrap');
    const renderedActions = within(actionButtons)
      .getAllByTestId(/^rendered-/)
      .map((element) => element.dataset.sign.replace('rendered-', ''));
    expect(renderedActions.slice(-3)).toEqual(['record', 'park', 'voicemail']);
  });

  test('keeps the voicemail drop button presentation', () => {
    render(<VoicemailDropCallControlPanel {...createProps()} />);

    expect(screen.getByTestId('rendered-voicemail')).toHaveAttribute(
      'data-label',
      'Voicemail drop',
    );
    expect(screen.getByTestId('rendered-voicemail')).toHaveAttribute(
      'data-color',
      'secondary',
    );
    expect(screen.getByTestId('rendered-voicemail')).toHaveAttribute(
      'data-variant',
      'outlined',
    );
  });
});
