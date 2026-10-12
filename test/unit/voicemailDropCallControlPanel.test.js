import React from 'react';
import { render, screen, within } from '@testing-library/react';

import { VoicemailDropCallControlPanel } from '../../src/app/views/CallView/CallControlView/VoicemailDropCallControlPanel';

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
  '../../src/app/views/CallView/CallControlView/useCallControlLayout',
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
  Icon: () => null,
  IconButton: ({ TooltipProps: _tooltipProps, symbol: _symbol, ...props }) => (
    <button type="button" {...props} />
  ),
  Menu: ({ children }) => children,
  MenuItem: ({ children, ...props }) => <div {...props}>{children}</div>,
  MenuItemText: ({ children }) => children,
  MenuList: ({ children }) => children,
  Option: ({ children }) => children,
  SubMenu: ({ children, itemContent, ...props }) => (
    <div {...props}>
      {itemContent}
      {children}
    </div>
  ),
}));

function createProps(actions) {
  return {
    actions:
      actions ??
      [
        { type: 'mute' },
        { type: 'keypad' },
        { type: 'audio' },
        { type: 'add' },
        { type: 'hold' },
        { type: 'transfer' },
        { type: 'record' },
        { type: 'voicemail' },
        { type: 'park' },
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

function renderedActionTypes(container) {
  return within(container)
    .getAllByTestId(/^rendered-/)
    .map((element) => element.dataset.sign.replace('rendered-', ''));
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
    expect(renderedActionTypes(actionButtons).slice(-3)).toEqual([
      'record',
      'voicemail',
      'park',
    ]);
  });

  test('keeps at most nine action buttons and moves the rest into the more menu', () => {
    render(
      <VoicemailDropCallControlPanel
        {...createProps([
          { type: 'mute' },
          { type: 'keypad' },
          { type: 'audio' },
          { type: 'add' },
          { type: 'hold' },
          { type: 'transfer' },
          { type: 'record' },
          { type: 'aiNotes' },
          { type: 'voicemail' },
          { type: 'park' },
          { type: 'flip' },
          { type: 'hangUp' },
        ])}
      />,
    );

    const actionButtons = screen.getByTestId('actionButtons');
    expect(renderedActionTypes(actionButtons)).toEqual([
      'mute',
      'keypad',
      'audio',
      'add',
      'hold',
      'transfer',
      'record',
      'aiNotes',
      'voicemail',
    ]);
    expect(screen.getByTestId('overflowActionTypes')).toHaveTextContent(
      'park,flip',
    );
    expect(screen.getByTestId('more')).toBeInTheDocument();
    expect(screen.getAllByTestId('park')).toHaveLength(1);
  });

  test('does not render the more button when every action fits', () => {
    render(<VoicemailDropCallControlPanel {...createProps()} />);

    expect(screen.getByTestId('overflowActionTypes')).toBeEmptyDOMElement();
    expect(screen.queryByTestId('more')).not.toBeInTheDocument();
  });

  test('renders flip in the grid when all nine call actions fit', () => {
    render(
      <VoicemailDropCallControlPanel
        {...createProps([
          { type: 'mute' },
          { type: 'keypad' },
          { type: 'audio' },
          { type: 'add' },
          { type: 'hold' },
          { type: 'transfer' },
          { type: 'record' },
          { type: 'park' },
          { type: 'flip', disabled: true },
          { type: 'hangUp' },
        ])}
      />,
    );

    const actionButtons = screen.getByTestId('actionButtons');
    expect(renderedActionTypes(actionButtons).slice(-2)).toEqual([
      'park',
      'flip',
    ]);
    expect(screen.getByTestId('overflowActionTypes')).toBeEmptyDOMElement();
    expect(screen.queryByTestId('more')).not.toBeInTheDocument();
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
