import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@ringcentral-integration/next-core', () => ({
  PortManager: class PortManager {},
  RouterPlugin: class RouterPlugin {},
  injectable: () => (target) => target,
  optional: () => () => {},
  useConnector: (selector) => selector(),
  useLocation: jest.requireActual('react-router-dom').useLocation,
}));

const mockBaseSetActive = jest.fn();
const mockBaseReplaceActive = jest.fn(async () => {});

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  SyncTabView: class SyncTabView {
    setActive(...args) {
      mockBaseSetActive(...args);
    }

    replaceActive(...args) {
      return mockBaseReplaceActive(...args);
    }

    component({ id, className, tabClassName }) {
      const React = jest.requireActual('react');
      // Like the real tabs, a change selects the tab through `setActive`.
      return React.createElement(
        'button',
        {
          className,
          'data-tab-class': tabClassName,
          onClick: () => this.setActive(id, 'history'),
        },
        'History',
      );
    }
  },
}));

import { SyncTabView } from '../../src/app/views/SyncTabView';

/** Renders the view's tabs bound to it, as next-core binds `component`. */
function Tabs({ view, ...props }) {
  return view.component(props);
}

function renderTabs({ routerPath, locationPath }) {
  const router = { currentPath: routerPath };
  const view = new SyncTabView(router, {});
  const result = render(
    <MemoryRouter initialEntries={[locationPath]}>
      <Tabs view={view} id="agentTabs" tabs={[]} />
    </MemoryRouter>,
  );
  return { ...result, router, view };
}

describe('SyncTabView', () => {
  beforeEach(() => {
    mockBaseSetActive.mockClear();
    mockBaseReplaceActive.mockClear();
  });

  test('applies Spring UI compact mode while preserving caller classes', () => {
    const router = { currentPath: '/agent/home' };
    const view = new SyncTabView(router, {});
    render(
      <MemoryRouter initialEntries={['/agent/home']}>
        <Tabs
          view={view}
          id="tabs"
          tabs={[]}
          className="tabs-class"
          tabClassName="tab-class"
        />
      </MemoryRouter>,
    );

    const tabs = screen.getByRole('button');
    expect(tabs.className).toContain('sui-compact');
    expect(tabs.className).toContain('tabs-class');
    expect(tabs.getAttribute('data-tab-class')).toContain('sui-compact');
    expect(tabs.getAttribute('data-tab-class')).toContain('tab-class');
  });

  test('pushes the selected tab on the page the router is on', () => {
    renderTabs({ routerPath: '/agent/home', locationPath: '/agent/home' });

    fireEvent.click(screen.getByRole('button'));

    expect(mockBaseSetActive).toHaveBeenCalledWith('agentTabs', 'history', {});
    expect(mockBaseReplaceActive).not.toHaveBeenCalled();
  });

  test('replaces the tab in place behind a routed side widget page', () => {
    // The main column renders the agent home while the router is on call
    // details, so a push would add a second entry for the details.
    renderTabs({ routerPath: '/history/call', locationPath: '/agent/home' });

    fireEvent.click(screen.getByRole('button'));

    expect(mockBaseReplaceActive).toHaveBeenCalledWith('agentTabs', 'history');
    expect(mockBaseSetActive).not.toHaveBeenCalled();
  });

  test('pushes to an explicit path even behind a routed page', () => {
    const { view } = renderTabs({
      routerPath: '/history/call',
      locationPath: '/agent/home',
    });

    view.setActive('agentTabs', 'dialer', { currentPath: '/agent/home' });

    expect(mockBaseSetActive).toHaveBeenCalledWith('agentTabs', 'dialer', {
      currentPath: '/agent/home',
    });
    expect(mockBaseReplaceActive).not.toHaveBeenCalled();
  });

  test('pushes again once the tabs behind the routed page unmount', () => {
    const { unmount, view } = renderTabs({
      routerPath: '/history/call',
      locationPath: '/agent/home',
    });

    unmount();
    view.setActive('agentTabs', 'dialer');

    expect(mockBaseSetActive).toHaveBeenCalledWith('agentTabs', 'dialer', {});
    expect(mockBaseReplaceActive).not.toHaveBeenCalled();
  });
});
