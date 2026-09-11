import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createConversationPanel } from '../../next/app/views/ConversationView/createConversationPanel';

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/ConversationPanel',
  () => ({
    ConversationPanel: ({ goBack, replyToReceivers, updateMessageText }) => (
      <div>
        <button type="button" onClick={goBack}>
          Back
        </button>
        <button type="button" onClick={() => updateMessageText?.('Hello')}>
          Type
        </button>
        <button type="button" onClick={() => replyToReceivers?.('Reply', [])}>
          Send
        </button>
      </div>
    ),
  }),
);

describe('routed conversation panel navigation', () => {
  test('closes directly without a full-page view transition', () => {
    const router = { push: jest.fn() };
    const ConversationPanel = createConversationPanel(router);

    render(
      <ConversationPanel
        conversation={{ conversationId: 'conversation-id' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(router.push).toHaveBeenCalledWith('/messages');
  });

  test('tracks typing and pauses an unfinished draft on unmount', () => {
    const router = { push: jest.fn() };
    const smsTypingTimeTracker = {
      clearTyping: jest.fn(),
      pauseTyping: jest.fn(),
      startTyping: jest.fn(),
    };
    const updateMessageText = jest.fn();
    const ConversationPanel = createConversationPanel(
      router,
      smsTypingTimeTracker,
    );
    const { unmount } = render(
      <ConversationPanel
        conversation={{ conversationId: 'conversation-id' }}
        messageText="Draft"
        updateMessageText={updateMessageText}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Type' }));
    expect(smsTypingTimeTracker.startTyping).toHaveBeenCalledWith(
      'conversation-id',
    );
    expect(updateMessageText).toHaveBeenCalledWith('Hello');

    unmount();
    expect(smsTypingTimeTracker.pauseTyping).toHaveBeenCalledWith(
      'conversation-id',
    );
  });

  test('checks Do Not SMS before replying to a conversation', async () => {
    const router = { push: jest.fn() };
    const doNotContact = {
      verifySmsRecipients: jest.fn(async () => false),
    };
    const replyToReceivers = jest.fn();
    const ConversationPanel = createConversationPanel(
      router,
      undefined,
      doNotContact,
    );
    render(
      <ConversationPanel
        conversation={{
          correspondents: [{ phoneNumber: '+16505550100' }],
        }}
        replyToReceivers={replyToReceivers}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(doNotContact.verifySmsRecipients).toHaveBeenCalledWith([
      { phoneNumber: '+16505550100' },
    ]);
    expect(replyToReceivers).not.toHaveBeenCalled();
  });

  test('replies after the Do Not SMS check allows sending', async () => {
    const router = { push: jest.fn() };
    const doNotContact = {
      verifySmsRecipients: jest.fn(async () => true),
    };
    const replyToReceivers = jest.fn(async () => {});
    const ConversationPanel = createConversationPanel(
      router,
      undefined,
      doNotContact,
    );
    render(
      <ConversationPanel
        conversation={{ correspondents: [] }}
        replyToReceivers={replyToReceivers}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await Promise.resolve();

    expect(replyToReceivers).toHaveBeenCalledWith('Reply', []);
  });
});
