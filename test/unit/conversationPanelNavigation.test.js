import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { createConversationPanel } from '../../src/app/views/ConversationView/createConversationPanel';

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

const createServices = () => ({
  conversations: { loadConversation: jest.fn(async () => {}) },
  messageThread: {
    isThreadId: jest.fn(() => false),
    setInputValue: jest.fn(async () => {}),
  },
  queueConversations: {
    formattedConversationsMap: new Map(),
    loadConversation: jest.fn(async () => {}),
  },
  connectivityMonitor: { connectivity: true },
  rateLimiter: { restricted: false },
  thirdParty: {
    messageLoggerGranularSelectionEnabled: false,
    messageLoggerRegistered: false,
    messageLogStateMap: {},
    messageLoggerTitle: null,
    messageLogEntityMatcherRegistered: false,
  },
  conversationLogger: { autoLog: false },
});

describe('routed conversation panel navigation', () => {
  test('closes directly without a full-page view transition', () => {
    const router = { push: jest.fn() };
    const ConversationPanel = createConversationPanel(
      router,
      undefined,
      undefined,
      createServices(),
    );

    render(
      <ConversationPanel
        conversation={{ conversationId: 'conversation-id' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(router.push).toHaveBeenCalledWith('/messages');
  });

  test('pauses an unfinished draft on unmount', async () => {
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
      undefined,
      createServices(),
    );
    const { unmount } = render(
      <ConversationPanel
        conversation={{ conversationId: 'conversation-id' }}
        messageText="Draft"
        updateMessageText={updateMessageText}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Type' }));
    await waitFor(() =>
      expect(updateMessageText).toHaveBeenCalledWith('Hello'),
    );

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
      createServices(),
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
      createServices(),
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
