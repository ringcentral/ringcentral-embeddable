import { fireEvent, render, screen } from '@testing-library/react';
import { useContainer } from '@ringcentral-integration/next-core';
import React from 'react';

import { MatchedContactSelection } from '../../next/app/services/MatchedContactSelection';
import { ConversationsView } from '../../next/app/views/ConversationsView';

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {},
}));

// Not under test here, and its framework page imports pull in untransformed ESM.
jest.mock('../../next/app/views/ConversationsView/ConversationsPage', () => ({
  ConversationsPage: () => null,
}));

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring',
  () => {
    const React = require('react');
    return {
      ConversationsViewSpring: class ConversationsViewSpringBase {
        constructor() {
          // The base declares this as an instance field, not a prototype
          // method, which is why the subclass wraps it in its constructor.
          this.useConversationItemInfo = (conversation, options) => ({
            actions: [],
            pageType: options?.pageType,
            info: {
              isVoicemail: true,
              DisplayName: ({ displayControl }) =>
                React.createElement(
                  'span',
                  null,
                  `counts:${Boolean(displayControl?.matchCounts)}`,
                ),
            },
          });
        }
      },
    };
  },
);

const MATCHES = [
  { id: 'rc-1', name: 'John Smith', type: 'company' },
  { id: 'crm-1', name: 'J. Smith', type: 'lead' },
];

const VOICEMAIL = {
  conversationId: 'conversation-1',
  correspondents: [{ phoneNumber: '+16505550100' }],
  correspondentMatchesList: [MATCHES],
};

describe('ConversationsView matched-contact decoration', () => {
  let selection;

  beforeEach(() => {
    selection = new MatchedContactSelection({ enable: jest.fn() });
    useContainer.mockImplementation((token) =>
      token === 'MatchedContactSelection' ? selection : undefined,
    );
  });

  afterEach(() => {
    useContainer.mockReset();
  });

  test('decorates DisplayName for every conversation surface', () => {
    // One wrap on this instance field reaches the text, fax and voicemail
    // lists (via getUIFunctions) plus the voicemail and fax detail pages,
    // which call this method directly off the view.
    const view = new ConversationsView();
    const Host = () => {
      const { info } = view.useConversationItemInfo(VOICEMAIL, {
        pageType: 'voicemail',
      });
      return <info.DisplayName displayControl={{ matchCounts: true }} />;
    };

    render(<Host />);

    expect(screen.getByText('counts:false')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('J. Smith'));

    expect(
      selection.getSelectedEntityId('conversation', 'conversation-1'),
    ).toBe('crm-1');
  });

  test('preserves the base result and forwards its arguments', () => {
    const view = new ConversationsView();
    const Host = () => {
      const result = view.useConversationItemInfo(VOICEMAIL, {
        pageType: 'voicemail',
      });
      return <span>{`${result.pageType}:${result.info.isVoicemail}`}</span>;
    };

    render(<Host />);

    expect(screen.getByText('voicemail:true')).toBeInTheDocument();
  });
});
