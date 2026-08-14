import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createConversationPanel } from '../../next/app/views/ConversationView/createConversationPanel';

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/ConversationPanel',
  () => ({
    ConversationPanel: ({ goBack }) => (
      <button type="button" onClick={goBack}>
        Back
      </button>
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
});
