import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
            actions: [{ type: 'call' }],
            pageType: options?.pageType,
            info: {
              isVoicemail: true,
              matchedContact: { id: 'crm-1' },
              DisplayName: ({ displayControl }) =>
                React.createElement(
                  React.Fragment,
                  null,
                  React.createElement(
                    'span',
                    { 'data-sign': 'selectedContactName' },
                    conversation.lastMatchedCorrespondentEntity?.name ??
                      'Maybe: John Smith',
                  ),
                  React.createElement(
                    'span',
                    null,
                    `counts:${Boolean(displayControl?.matchCounts)}`,
                  ),
                ),
            },
          });
          this.useActionsHandler = () => jest.fn(async () => {});
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

function createView({
  conversationLogger = {
    loggingMap: {},
    logConversation: jest.fn(),
    ready: true,
  },
  thirdParty = {
    messageLoggerRegistered: false,
    messageLoggerTitle: null,
  },
} = {}) {
  const dependencies = Array(22).fill(undefined);
  dependencies[16] = conversationLogger;
  dependencies[17] = thirdParty;
  return new ConversationsView(...dependencies);
}

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
    const view = createView();
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

  test('updates the displayed conversation name after selecting a match', () => {
    const view = createView();
    const Host = () => {
      const { info } = view.useConversationItemInfo(VOICEMAIL, {
        pageType: 'list',
      });
      return <info.DisplayName displayControl={{ matchCounts: true }} />;
    };
    const { rerender } = render(<Host />);

    expect(screen.getByTestId('selectedContactName')).toHaveTextContent(
      'Maybe: John Smith',
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('J. Smith'));
    rerender(<Host />);

    expect(screen.getByTestId('selectedContactName')).toHaveTextContent(
      'J. Smith',
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('hides the match picker only after the conversation log identifies a contact', () => {
    const conversationLogger = {
      dataMapping: { 'conversation-log-id': [] },
      loggingMap: {},
      logConversation: jest.fn(),
      ready: true,
    };
    const view = createView({ conversationLogger });
    const conversation = {
      ...VOICEMAIL,
      conversationLogId: 'conversation-log-id',
      conversationMatches: [],
    };
    const Host = () => {
      const { info } = view.useConversationItemInfo(conversation, {
        pageType: 'list',
      });
      return <info.DisplayName displayControl={{ matchCounts: true }} />;
    };
    const { rerender } = render(<Host />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('J. Smith'));
    rerender(<Host />);

    expect(screen.getByRole('button')).toBeInTheDocument();

    conversationLogger.dataMapping['conversation-log-id'] = [
      { contactId: 'crm-1', id: 'activity-id', type: 'activity' },
    ];
    rerender(<Host />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTestId('selectedContactName')).toHaveTextContent(
      'J. Smith',
    );
  });

  test('preserves the base result and forwards its arguments', () => {
    const view = createView();
    const Host = () => {
      const result = view.useConversationItemInfo(VOICEMAIL, {
        pageType: 'voicemail',
      });
      return <span>{`${result.pageType}:${result.info.isVoicemail}`}</span>;
    };

    render(<Host />);

    expect(screen.getByText('voicemail:true')).toBeInTheDocument();
  });

  test('adds the registered logger action and sends the manual request', async () => {
    const conversationLogger = {
      loggingMap: {},
      logConversation: jest.fn(async () => {}),
      ready: true,
    };
    const thirdParty = {
      messageLoggerRegistered: true,
      messageLoggerTitle: 'Log to CRM',
    };
    const view = createView({ conversationLogger, thirdParty });
    const conversation = {
      ...VOICEMAIL,
      conversationLogId: 'conversation-log-id',
      conversationMatches: [],
    };
    const Host = () => {
      const result = view.useConversationItemInfo(conversation, {
        pageType: 'voicemail',
      });
      const onAction = view.useActionsHandler(
        conversation,
        result.info,
        'Voicemail detail page',
      );
      return (
        <button type="button" onClick={() => onAction('viewLog')}>
          {result.actions[0].label}
        </button>
      );
    };

    render(<Host />);
    fireEvent.click(screen.getByRole('button', { name: 'Log to CRM' }));

    await waitFor(() =>
      expect(conversationLogger.logConversation).toHaveBeenCalledWith({
        conversationId: 'conversation-1',
        correspondentEntity: { id: 'crm-1' },
        redirect: true,
        triggerType: 'manual',
      }),
    );
  });

  test('shows the logged status from conversation matcher results', () => {
    const conversationLogger = {
      dataMapping: {
        'conversation-log-id': [{ id: 'activity-id', type: 'messageLog' }],
      },
      loggingMap: {},
      logConversation: jest.fn(),
      ready: true,
    };
    const thirdParty = {
      messageLoggerRegistered: true,
      messageLoggerTitle: null,
    };
    const view = createView({ conversationLogger, thirdParty });
    const conversation = {
      ...VOICEMAIL,
      conversationLogId: 'conversation-log-id',
      conversationMatches: [],
    };
    const Host = () => {
      const { info } = view.useConversationItemInfo(conversation);
      return info.logged;
    };

    render(<Host />);

    expect(screen.getByTestId('loggedCall')).toBeInTheDocument();
  });

  test('does not show log status without a registered message logger', () => {
    const view = createView();
    const Host = () => {
      const { info } = view.useConversationItemInfo(VOICEMAIL);
      return info.logged;
    };

    const { container } = render(<Host />);

    expect(container).toBeEmptyDOMElement();
  });

  test('shows matcher status text in the conversation list description', () => {
    const conversationLogger = {
      dataMapping: {
        'conversation-log-id': [
          {
            message: 'CRM log failed',
            status: 'failed',
            type: 'status',
          },
        ],
      },
      loggingMap: {},
      logConversation: jest.fn(),
      ready: true,
    };
    const thirdParty = {
      messageLoggerRegistered: true,
      messageLoggerTitle: null,
    };
    const view = createView({ conversationLogger, thirdParty });
    const conversation = {
      ...VOICEMAIL,
      conversationLogId: 'conversation-log-id',
      conversationMatches: [],
    };
    const Host = () => {
      const { info } = view.useConversationItemInfo(conversation, {
        pageType: 'list',
      });
      return info.displayDescription;
    };

    render(<Host />);

    expect(screen.getByTestId('logStatusMessage')).toHaveTextContent(
      'CRM log failed',
    );
    expect(screen.getByTestId('logStatusMessage')).toHaveClass(
      'block',
      'break-words',
      'text-danger-f',
      'whitespace-normal',
      'w-full',
    );
  });
});
