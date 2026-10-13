import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { useContainer } from '@ringcentral-integration/next-core';

import { createThirdPartyActionButton } from '../../src/app/components/ThirdPartyActionButton';
import { SmsToolbarButtons } from '../../src/app/components/SmsToolbarButtons';
import { useAdditionalMessageButtons } from '../../src/app/views/ConversationsView/useAdditionalMessageButtons';

function createThirdParty({
  additionalMessageActions = [],
  additionalSMSToolbarButtons = [],
} = {}) {
  return {
    additionalMessageActions,
    additionalSMSToolbarButtons,
    onClickAdditionalButton: jest.fn(async () => undefined),
  };
}

function MessageButtonsHost({ conversation, disabled, onParentClick }) {
  const buttons = useAdditionalMessageButtons(conversation, disabled);
  return (
    <div onClick={onParentClick}>
      {buttons.map(({ actionType, disabled: buttonDisabled, label, onClick }) => (
        <button
          data-sign={actionType}
          disabled={buttonDisabled}
          key={actionType}
          onClick={onClick}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

afterEach(() => {
  useContainer.mockReset();
});

describe('createThirdPartyActionButton', () => {
  test('maps the 3.x message action icon names', () => {
    const expectedIcons = {
      createContact: 'InviteMd',
      delete: 'TrashMd',
      refreshContact: 'RefreshMd',
      viewContact: 'ContactsMd',
      unknown: 'AppsMd',
    };

    Object.entries(expectedIcons).forEach(([icon, symbol]) => {
      const button = createThirdPartyActionButton({
        action: { id: icon, icon, type: 'messageAction' },
        onClick: jest.fn(),
        resource: {},
      });
      expect(button.symbol).toBe(symbol);
    });
  });

  test('falls back to the id for a missing label and keeps it disabled', () => {
    const button = createThirdPartyActionButton({
      action: { id: 'noLabel', type: 'messageAction' },
      disabled: true,
      onClick: jest.fn(),
      resource: {},
    });

    expect(button).toMatchObject({
      actionType: 'noLabel',
      disabled: true,
      label: 'noLabel',
    });
  });

  test('sends the resource on click without bubbling to the row', () => {
    const onClick = jest.fn();
    const resource = { id: 'resource-id' };
    const button = createThirdPartyActionButton({
      action: { id: 'sync', label: 'Sync', type: 'callAction' },
      onClick,
      resource,
    });
    const event = { stopPropagation: jest.fn() };

    button.onClick(event);

    expect(onClick).toHaveBeenCalledWith('sync', resource);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });
});

describe('useAdditionalMessageButtons', () => {
  test('sends the conversation to the host as the resource', () => {
    const thirdParty = createThirdParty({
      additionalMessageActions: [
        { id: 'msgBtn', label: 'Message action', type: 'messageAction' },
      ],
    });
    useContainer.mockReturnValue(thirdParty);
    const conversation = { conversationId: 'conversation-id' };
    const onParentClick = jest.fn();

    render(
      <MessageButtonsHost
        conversation={conversation}
        onParentClick={onParentClick}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Message action' }));

    expect(useContainer).toHaveBeenCalledWith('ThirdParty');
    expect(thirdParty.onClickAdditionalButton).toHaveBeenCalledWith(
      'msgBtn',
      conversation,
    );
    expect(onParentClick).not.toHaveBeenCalled();
  });

  test('disables the buttons with the links', () => {
    useContainer.mockReturnValue(
      createThirdParty({
        additionalMessageActions: [
          { id: 'msgBtn', label: 'Message action', type: 'messageAction' },
        ],
      }),
    );

    render(<MessageButtonsHost conversation={{}} disabled />);

    expect(
      screen.getByRole('button', { name: 'Message action' }),
    ).toBeDisabled();
  });

  test('returns no buttons without registered message actions', () => {
    useContainer.mockReturnValue(createThirdParty());

    const { container } = render(<MessageButtonsHost conversation={{}} />);

    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});

describe('SmsToolbarButtons', () => {
  test('renders nothing without registered toolbar buttons', () => {
    useContainer.mockReturnValue(createThirdParty());

    const { container } = render(<SmsToolbarButtons />);

    expect(container).toBeEmptyDOMElement();
  });

  test('shows the icon URL and sends only the button on click', () => {
    const thirdParty = createThirdParty({
      additionalSMSToolbarButtons: [
        {
          id: 'template',
          icon: 'https://host.example.com/icon.png',
          label: 'Template',
          type: 'smsToolbar',
        },
      ],
    });
    useContainer.mockReturnValue(thirdParty);

    render(<SmsToolbarButtons />);
    const button = document.querySelector(
      '[data-sign="smsToolbarButton-template"]',
    );
    fireEvent.click(button);

    expect(screen.getByAltText('Template')).toHaveAttribute(
      'src',
      'https://host.example.com/icon.png',
    );
    expect(thirdParty.onClickAdditionalButton).toHaveBeenCalledWith(
      'template',
    );
  });

  test('falls back to the apps icon when the icon is not a URL', () => {
    useContainer.mockReturnValue(
      createThirdParty({
        additionalSMSToolbarButtons: [
          { id: 'plain', icon: 'apps', type: 'smsToolbar' },
        ],
      }),
    );

    render(<SmsToolbarButtons />);

    expect(
      document.querySelector('[data-sign="smsToolbarButton-plain"] img'),
    ).toBeNull();
    expect(
      document.querySelector('[data-sign="smsToolbarButton-plain"]'),
    ).toBeInTheDocument();
  });
});
