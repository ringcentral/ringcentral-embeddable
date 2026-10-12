import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { createConversationPanel } from '../../src/app/views/ConversationView/createConversationPanel';

let mockPanelSign = 'conversationPanel';

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationViewSpring/ConversationPanel',
  () => {
    const React = require('react');
    // Mirrors the upstream markup the panel finds its scroller in: the message
    // list is the last child of `conversationPanel`.
    return {
      ConversationPanel: ({ messages = [] }) => (
        <div data-sign={mockPanelSign}>
          <div data-sign="sendingSpinner" />
          <div data-sign="messageList">
            {messages.map((message) => (
              <span key={message.id}>{message.subject}</span>
            ))}
          </div>
        </div>
      ),
    };
  },
);

const CONVERSATION_ID = 'conversation-id';

const message = (id, creationTime) => ({
  id,
  subject: `message ${id}`,
  creationTime,
});

function createServices({
  conversations,
  messageThread,
  queueConversations,
} = {}) {
  return {
    conversations: {
      currentConversationId: CONVERSATION_ID,
      loadingOldMessages: false,
      oldMessages: [],
      getMessages: jest.fn(() => []),
      fetchOlderMessages: jest.fn(async () => {}),
      loadConversation: jest.fn(async () => {}),
      ...conversations,
    },
    messageThread: {
      isThreadId: jest.fn(() => false),
      setInputValue: jest.fn(async () => {}),
      ...messageThread,
    },
    queueConversations: {
      formattedConversationsMap: new Map(),
      loadConversation: jest.fn(async () => {}),
      ...queueConversations,
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
  };
}

function renderPanel(services, messages = []) {
  const ConversationPanel = createConversationPanel(
    { push: jest.fn() },
    undefined,
    undefined,
    services,
  );
  return render(
    <ConversationPanel
      conversation={{ conversationId: CONVERSATION_ID }}
      messages={messages}
    />,
  );
}

function mockListSize({ scrollHeight, clientHeight }) {
  jest
    .spyOn(Element.prototype, 'scrollHeight', 'get')
    .mockReturnValue(scrollHeight);
  jest
    .spyOn(Element.prototype, 'clientHeight', 'get')
    .mockReturnValue(clientHeight);
}

function scrollListTo(scrollTop) {
  const list = screen.getByTestId('messageList');
  jest.spyOn(list, 'scrollTop', 'get').mockReturnValue(scrollTop);
  fireEvent.scroll(list);
}

describe('routed conversation panel older messages', () => {
  afterEach(() => {
    mockPanelSign = 'conversationPanel';
    jest.restoreAllMocks();
  });

  test('loads an empty thread as soon as it opens', () => {
    mockListSize({ scrollHeight: 0, clientHeight: 300 });
    const services = createServices();

    renderPanel(services);

    expect(services.conversations.fetchOlderMessages).toHaveBeenCalledTimes(1);
  });

  test('loads an empty thread even when its list cannot be measured', () => {
    // A conversation opened from older list pages has nothing in the synced
    // message store, so it must load without relying on the upstream markup.
    mockPanelSign = 'otherPanel';
    const services = createServices();

    renderPanel(services);

    expect(services.conversations.fetchOlderMessages).toHaveBeenCalledTimes(1);
  });

  test('fills a thread too short to scroll', () => {
    mockListSize({ scrollHeight: 100, clientHeight: 300 });
    const services = createServices();

    renderPanel(services, [message('1', 1)]);

    expect(services.conversations.fetchOlderMessages).toHaveBeenCalledTimes(1);
  });

  test('loads older messages when scrolled near the top', () => {
    mockListSize({ scrollHeight: 1000, clientHeight: 300 });
    const services = createServices();
    renderPanel(services, [message('1', 1)]);
    expect(services.conversations.fetchOlderMessages).not.toHaveBeenCalled();

    scrollListTo(500);
    expect(services.conversations.fetchOlderMessages).not.toHaveBeenCalled();

    scrollListTo(10);
    expect(services.conversations.fetchOlderMessages).toHaveBeenCalledTimes(1);
  });

  test('shows a spinner and waits while older messages load', () => {
    mockListSize({ scrollHeight: 0, clientHeight: 300 });
    const services = createServices({
      conversations: { loadingOldMessages: true },
    });

    renderPanel(services);
    scrollListTo(0);

    expect(screen.getByTestId('loadingOlderMessages')).toBeInTheDocument();
    expect(services.conversations.fetchOlderMessages).not.toHaveBeenCalled();
  });

  test('shows fetched older messages oldest first', () => {
    mockListSize({ scrollHeight: 1000, clientHeight: 300 });
    const newer = message('2', 2000);
    const older = message('1', 1000);
    const services = createServices({
      conversations: {
        oldMessages: [older],
        getMessages: jest.fn(() => [newer, older]),
      },
    });

    renderPanel(services, [newer]);

    expect(services.conversations.getMessages).toHaveBeenCalledWith(
      CONVERSATION_ID,
      true,
    );
    expect(
      Array.from(screen.getByTestId('messageList').children).map(
        (node) => node.textContent,
      ),
    ).toEqual(['message 1', 'message 2']);
  });

  test.each([
    ['message threads', { messageThread: { isThreadId: jest.fn(() => true) } }],
    [
      'queue conversations',
      {
        queueConversations: {
          formattedConversationsMap: new Map([[CONVERSATION_ID, {}]]),
        },
      },
    ],
    [
      'a conversation the service has not opened yet',
      { conversations: { currentConversationId: 'other' } },
    ],
  ])('does not page %s', (_, overrides) => {
    mockListSize({ scrollHeight: 0, clientHeight: 300 });
    const services = createServices({
      ...overrides,
      conversations: {
        oldMessages: [message('1', 1000)],
        ...overrides.conversations,
      },
    });

    renderPanel(services, [message('2', 2000)]);
    scrollListTo(0);

    expect(services.conversations.fetchOlderMessages).not.toHaveBeenCalled();
    expect(services.conversations.getMessages).not.toHaveBeenCalled();
    expect(screen.getByTestId('messageList')).toHaveTextContent('message 2');
  });
});
