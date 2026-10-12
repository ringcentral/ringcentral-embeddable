import React from 'react';
import { act, render, screen } from '@testing-library/react';

import { ConversationsPage } from '../../src/app/views/ConversationsView/ConversationsPage';

let mockListProps;

jest.mock('@ringcentral/spring-ui', () => {
  const React = require('react');
  return {
    ...jest.requireActual('@ringcentral/spring-ui'),
    VirtualizedList: (props) => {
      mockListProps = props;
      const { Footer } = props.components ?? {};
      return (
        <div data-sign="conversationList">
          {props.data.map((item, index) => (
            <React.Fragment key={item.conversationId}>
              {props.children(index, item)}
            </React.Fragment>
          ))}
          {Footer ? <Footer /> : null}
        </div>
      );
    },
  };
});

jest.mock('@ringcentral-integration/react-hooks', () => ({
  useVirtuosoScrollPosition: () => ({
    virtuosoActionsRef: { current: null },
    scrollerRef: { current: null },
  }),
}));

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage',
  () => {
    const React = require('react');
    return {
      ConversationsPage: () => <div data-sign="emptyConversations" />,
    };
  },
);

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage/Filter',
  () => ({ Filter: () => null }),
);

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsPage/i18n',
  () => ({ __esModule: true, default: {} }),
);

jest.mock('../../src/app/views/ConversationsView/ConversationsListItem', () => {
  const React = require('react');
  return {
    ConversationsListItem: ({ conversation }) => (
      <span>{conversation.conversationId}</span>
    ),
  };
});

const conversation = (id) => ({ conversationId: id });

function renderPage(props = {}) {
  const onEndReached = jest.fn();
  const pageProps = {
    conversations: [conversation('1')],
    loadingNextPage: false,
    onEndReached,
    readStatusFilter: 'All',
    searchInput: '',
    setLastPosition: jest.fn(),
    typeFilter: 'Text',
    updateReadStatusFilterMap: jest.fn(),
    ...props,
  };
  const view = render(<ConversationsPage {...pageProps} />);
  const rerender = (nextProps) => {
    Object.assign(pageProps, nextProps);
    view.rerender(<ConversationsPage {...pageProps} />);
  };
  return { onEndReached, rerender };
}

const setEndVisible = (visible) =>
  act(() => {
    mockListProps.atBottomStateChange(visible);
  });

describe('ConversationsPage older conversation paging', () => {
  beforeEach(() => {
    mockListProps = undefined;
  });

  test('checks the server for an empty tab', () => {
    const { onEndReached } = renderPage({ conversations: [] });

    expect(screen.getByTestId('emptyConversations')).toBeInTheDocument();
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  test('checks again when an empty tab switches read status filter', () => {
    const { onEndReached, rerender } = renderPage({ conversations: [] });

    rerender({ readStatusFilter: 'Unread' });

    expect(onEndReached).toHaveBeenCalledTimes(2);
  });

  test('loads older conversations once the end of the list is visible', () => {
    const { onEndReached } = renderPage();
    expect(onEndReached).not.toHaveBeenCalled();

    setEndVisible(true);

    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  test('keeps loading while the end stays visible after a page arrives', () => {
    const { onEndReached, rerender } = renderPage();
    setEndVisible(true);
    rerender({ loadingNextPage: true });

    rerender({
      conversations: [conversation('1'), conversation('2')],
      loadingNextPage: false,
    });

    expect(onEndReached).toHaveBeenCalledTimes(2);
  });

  test('waits for the page in flight instead of dropping the request', () => {
    const { onEndReached, rerender } = renderPage({ loadingNextPage: true });

    setEndVisible(true);
    expect(onEndReached).not.toHaveBeenCalled();

    rerender({ loadingNextPage: false });
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  test('stops loading once the end scrolls out of view', () => {
    const { onEndReached, rerender } = renderPage();
    setEndVisible(true);
    setEndVisible(false);

    rerender({ conversations: [conversation('1'), conversation('2')] });

    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  test('shows a spinner below the list while loading', () => {
    const { rerender } = renderPage({ loadingNextPage: true });
    expect(screen.getByTestId('loadingOlderConversations')).toBeInTheDocument();

    rerender({ loadingNextPage: false });
    expect(screen.queryByTestId('loadingOlderConversations')).toBeNull();
  });
});
