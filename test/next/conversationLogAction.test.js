import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { useConversationActionButtons } from '../../next/app/views/ConversationsView/useConversationActionButtons';

jest.mock('@ringcentral-integration/next-widgets/components', () => {
  const React = require('react');
  return {
    ActionMenuList: ({ buttons }) => (
      <>
        {buttons.map((button) => (
          <button
            key={button.actionType}
            type="button"
            onClick={button.onClick}
          >
            {button.actionType}
          </button>
        ))}
      </>
    ),
    useHistoryActionButtons: (actions, onEffect) =>
      actions.map((action) => ({
        ...action,
        actionType: action.type,
        onClick: (event) => onEffect(action.type, event),
      })),
  };
});

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/useConversationActionButtons',
  () => ({ ConversationLogPopover: () => null }),
);

import {
  createConversationLogAction,
  insertConversationLogAction,
  logConversationManually,
} from '../../next/app/views/ConversationsView/ConversationLogAction';

function createConversation(overrides = {}) {
  return {
    conversationId: 'conversation-id',
    conversationLogId: 'conversation-log-id',
    conversationMatches: [],
    ...overrides,
  };
}

describe('conversation log action', () => {
  test('uses the registered title and current logging state', () => {
    expect(
      createConversationLogAction({
        conversation: createConversation(),
        editLogLabel: 'Edit log',
        isLogging: true,
        logButtonTitle: 'Log to CRM',
        logMessageLabel: 'Log messages',
        ready: true,
      }),
    ).toEqual({
      disabled: true,
      label: 'Log to CRM',
      type: 'createLog',
    });
  });

  test('uses edit copy for a matched conversation and hides without a logger', () => {
    const conversation = createConversation({
      conversationMatches: [{ id: 'activity-id', name: 'CRM activity' }],
    });
    expect(
      createConversationLogAction({
        conversation,
        editLogLabel: 'Edit log',
        isLogging: false,
        logMessageLabel: 'Log messages',
        ready: true,
      }).label,
    ).toBe('Edit log');
    expect(
      createConversationLogAction({
        conversation,
        editLogLabel: 'Edit log',
        isLogging: false,
        logMessageLabel: 'Log messages',
        ready: false,
      }),
    ).toBeNull();
  });

  test('replaces framework CRM actions with the message logger action', () => {
    expect(
      insertConversationLogAction(
        [
          { type: 'call' },
          { type: 'createLog' },
          { type: 'selectRecordsForAutoLog' },
        ],
        { type: 'viewLog', label: 'Log messages' },
      ),
    ).toEqual([{ type: 'viewLog', label: 'Log messages' }, { type: 'call' }]);
  });

  test('keeps the legacy manual logger request contract', async () => {
    const logConversation = jest.fn(async () => {});
    const correspondentEntity = { id: 'contact-id', name: 'Ada' };

    await logConversationManually({
      conversation: createConversation(),
      conversationLogger: { logConversation },
      correspondentEntity,
    });

    expect(logConversation).toHaveBeenCalledWith({
      conversationId: 'conversation-id',
      correspondentEntity,
      redirect: true,
      triggerType: 'manual',
    });
  });

  test('dispatches an unlogged item through the real Spring action hook', async () => {
    const onAction = jest.fn(async () => {});
    const conversation = createConversation();
    const action = createConversationLogAction({
      conversation,
      editLogLabel: 'Edit log',
      isLogging: false,
      logMessageLabel: 'Log messages',
      ready: true,
    });
    const Host = () =>
      useConversationActionButtons({
        actions: [action],
        conversation,
        onAction,
        refreshContactButton: null,
        showLogPopover: false,
      });

    render(<Host />);
    fireEvent.click(screen.getByText('createLog'));

    await waitFor(() => expect(onAction).toHaveBeenCalledWith('createLog'));
  });

  test('places the refresh action before delete in a conversation item', () => {
    const onRefresh = jest.fn();
    const conversation = createConversation();
    const Host = () =>
      useConversationActionButtons({
        actions: [{ type: 'call' }, { type: 'delete' }],
        conversation,
        onAction: jest.fn(async () => {}),
        refreshContactButton: {
          actionType: 'refreshContact',
          label: 'Refresh contact',
          onClick: onRefresh,
        },
        showLogPopover: false,
      });

    render(<Host />);

    expect(
      screen.getAllByRole('button').map((button) => button.textContent),
    ).toEqual(['call', 'refreshContact', 'delete']);

    fireEvent.click(screen.getByText('refreshContact'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
