import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createConversationPanel } from '../../next/app/views/ConversationView/createConversationPanel';

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/ConversationPanel',
  () => ({
    ConversationPanel: ({ goBack, updateMessageText }) => (
      <div>
        <button type="button" onClick={goBack}>
          Back
        </button>
        <button type="button" onClick={() => updateMessageText?.('Hello')}>
          Type
        </button>
      </div>
    ),
  }),
);

describe('routed conversation panel navigation', () => {
  test('closes directly without a full-page view transition', () => {
    const router = { push: jest.fn() };
    const ConversationPanel = createConversationPanel(router);

    render(<ConversationPanel />);
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
});
