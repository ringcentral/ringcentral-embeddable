import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { CallsListPage } from '../../src/app/views/CallHistoryView/CallsListPage';

let mockListProps;

jest.mock('@ringcentral/spring-ui', () => {
  const React = require('react');
  return {
    ...jest.requireActual('@ringcentral/spring-ui'),
    VirtualizedList: (props) => {
      mockListProps = props;
      const { Footer } = props.components ?? {};
      return (
        <div data-sign="virtualizedCalls">
          {props.data.map((item, index) => (
            <React.Fragment key={item.id}>
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
  useEffectOnDocumentFocus: () => {},
  useVirtuosoScrollPosition: () => ({
    virtuosoActionsRef: { current: null },
    scrollerRef: { current: null },
  }),
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsListPage/Filter',
  () => ({ Filter: () => null }),
);

jest.mock('../../src/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

jest.mock('../../src/app/views/CallHistoryView/CallsListItem', () => {
  const React = require('react');
  return {
    CallsListItem: ({ call }) => <span>{call.id}</span>,
  };
});

const { useContainer } = jest.requireMock('@ringcentral-integration/next-core');

const call = (id) => ({ id, telephonySessionId: `telephony-${id}` });

const calls = (count) =>
  Array.from({ length: count }, (_, index) => call(String(index + 1)));

function renderPage(props = {}) {
  const onEndReached = jest.fn();
  const pageProps = {
    activeCallsContent: null,
    calls: calls(1),
    hasActiveCalls: false,
    hasMoreOlderCalls: true,
    loadingOlderCalls: false,
    onEndReached,
    searchInput: '',
    setLastPosition: jest.fn(),
    viewCallsFilter: 'all',
    viewCallsFilterSelections: [],
    ...props,
  };
  const view = render(<CallsListPage {...pageProps} />);
  const rerender = (nextProps) => {
    Object.assign(pageProps, nextProps);
    view.rerender(<CallsListPage {...pageProps} />);
  };
  return { onEndReached, rerender };
}

const setEndVisible = (visible) =>
  act(() => {
    mockListProps.atBottomStateChange(visible);
  });

/**
 * Runs one page load that ends with the given calls listed.
 */
const loadPage = (rerender, nextCalls) => {
  rerender({ loadingOlderCalls: true });
  rerender({ calls: nextCalls, loadingOlderCalls: false });
};

describe('CallsListPage older calls paging', () => {
  beforeEach(() => {
    mockListProps = undefined;
    useContainer.mockReturnValue({ queryNotedCalls: jest.fn() });
  });

  afterEach(() => {
    useContainer.mockReset();
  });

  test('checks the server for an empty filter', () => {
    const { onEndReached } = renderPage({ calls: [] });

    expect(screen.getByTestId('no-calls')).toBeInTheDocument();
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  test('shows a spinner instead of the empty state while loading', () => {
    renderPage({ calls: [], loadingOlderCalls: true });

    expect(screen.getByTestId('loadingOlderCalls')).toBeInTheDocument();
    expect(screen.queryByTestId('no-calls')).toBeNull();
  });

  test('loads older calls once the end of the list is visible', () => {
    const { onEndReached } = renderPage();
    expect(onEndReached).not.toHaveBeenCalled();

    setEndVisible(true);

    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  test('keeps loading while pages add calls and the end stays visible', () => {
    const { onEndReached, rerender } = renderPage();
    setEndVisible(true);

    loadPage(rerender, calls(2));
    loadPage(rerender, calls(3));
    loadPage(rerender, calls(4));
    loadPage(rerender, calls(5));

    expect(onEndReached).toHaveBeenCalledTimes(5);
    expect(screen.queryByTestId('loadMoreCalls')).toBeNull();
  });

  test('waits for the page in flight instead of dropping the request', () => {
    const { onEndReached, rerender } = renderPage({ loadingOlderCalls: true });

    setEndVisible(true);
    expect(onEndReached).not.toHaveBeenCalled();

    rerender({ loadingOlderCalls: false });
    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  test('stops loading once the end scrolls out of view', () => {
    const { onEndReached, rerender } = renderPage();
    setEndVisible(true);
    setEndVisible(false);

    rerender({ calls: calls(2) });

    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  test('shows a spinner below the list while loading', () => {
    const { rerender } = renderPage({ loadingOlderCalls: true });
    expect(screen.getByTestId('loadingOlderCalls')).toBeInTheDocument();

    rerender({ loadingOlderCalls: false });
    expect(screen.queryByTestId('loadingOlderCalls')).toBeNull();
  });

  test('offers a button after three pages in a row add no call', () => {
    const { onEndReached, rerender } = renderPage();
    setEndVisible(true);

    loadPage(rerender, calls(1));
    loadPage(rerender, calls(1));
    expect(screen.queryByTestId('loadMoreCalls')).toBeNull();
    loadPage(rerender, calls(1));

    expect(onEndReached).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId('loadMoreCalls')).toBeInTheDocument();
  });

  test('loads one page per click once it stops loading on its own', () => {
    const { onEndReached, rerender } = renderPage();
    setEndVisible(true);
    loadPage(rerender, calls(1));
    loadPage(rerender, calls(1));
    loadPage(rerender, calls(1));

    fireEvent.click(screen.getByText('loadMore'));
    expect(onEndReached).toHaveBeenCalledTimes(4);

    loadPage(rerender, calls(1));
    expect(onEndReached).toHaveBeenCalledTimes(4);
    expect(screen.getByTestId('loadMoreCalls')).toBeInTheDocument();
  });

  test('loads on its own again after a page adds calls', () => {
    const { onEndReached, rerender } = renderPage();
    setEndVisible(true);
    loadPage(rerender, calls(1));
    loadPage(rerender, calls(1));
    loadPage(rerender, calls(1));
    fireEvent.click(screen.getByText('loadMore'));

    loadPage(rerender, calls(2));

    expect(onEndReached).toHaveBeenCalledTimes(5);
    expect(screen.queryByTestId('loadMoreCalls')).toBeNull();
  });

  test('loads on its own again after the filter changes', () => {
    const { onEndReached, rerender } = renderPage();
    setEndVisible(true);
    loadPage(rerender, calls(1));
    loadPage(rerender, calls(1));
    loadPage(rerender, calls(1));

    rerender({ viewCallsFilter: 'missed' });

    expect(onEndReached).toHaveBeenCalledTimes(4);
    expect(screen.queryByTestId('loadMoreCalls')).toBeNull();
  });

  test('offers no button once the server has no older calls', () => {
    const { rerender } = renderPage();
    setEndVisible(true);
    loadPage(rerender, calls(1));
    loadPage(rerender, calls(1));
    loadPage(rerender, calls(1));

    rerender({ hasMoreOlderCalls: false });

    expect(screen.queryByTestId('loadMoreCalls')).toBeNull();
  });

  test('offers the button under an empty filter', () => {
    const { onEndReached, rerender } = renderPage({ calls: [] });
    loadPage(rerender, []);
    loadPage(rerender, []);
    loadPage(rerender, []);

    expect(onEndReached).toHaveBeenCalledTimes(3);
    expect(screen.getByTestId('no-calls')).toBeInTheDocument();
    fireEvent.click(screen.getByText('loadMore'));
    expect(onEndReached).toHaveBeenCalledTimes(4);
  });
});
