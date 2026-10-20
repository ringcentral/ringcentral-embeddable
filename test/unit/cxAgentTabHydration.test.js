// A tab opened mid-session receives RingCX's `loaded` and `stage` from the
// server before its own CX chunk and state arrive. The agent tab must wait for
// this tab to hold the CX state: rendering the CX app earlier lets its routes
// redirect away from the call page the tab was opened on.

jest.mock('@ringcentral-integration/micro-core/src/app/views/SyncTabView', () => ({
  SyncTabView: class SyncTabView {},
}));

jest.mock('@ringcentral-integration/next-core', () =>
  jest.requireActual('../mocks/nextCoreMock'),
);
jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppHeaderNav: ({ children }) => children ?? null,
}));
jest.mock('@ringcentral-integration/micro-core/src/app/plugins', () => ({
  BlockPlugin: class BlockPlugin {},
}));
jest.mock('../../src/app/services/RingCX', () => ({ RingCX: class RingCX {} }));
jest.mock('../../src/app/views/CxAgentTabView/CxAgentTabPanel', () => ({
  CxAgentTabPanel: () =>
    require('react').createElement('div', { 'data-sign': 'start-panel' }),
}));
jest.mock('../../src/app/views/CxAgentTabView/CxAgentStartingPanel', () => ({
  CxAgentStartingPanel: () =>
    require('react').createElement('div', { 'data-sign': 'starting-panel' }),
}));

import { act, render, screen } from '@testing-library/react';
import React from 'react';
import { BehaviorSubject } from 'rxjs';

import { CxAgentTabView } from '../../src/app/views/CxAgentTabView/CxAgentTab.view';

function createView({
  stage = 'ready',
  hydrated = false,
  loaded = true,
} = {}) {
  const hydrated$ = new BehaviorSubject(hydrated);
  const ringCX = {
    loaded,
    stage,
    lastError: null,
    hydratedOnThisPort$: hydrated$,
    endAgentSession: jest.fn(),
    startAgentSession: jest.fn(),
  };
  const view = new CxAgentTabView(
    ringCX,
    { currentPath: '/agent/calls/call-1', push: jest.fn() },
    { currentLocale: 'en-US' },
    { blockIds: [] },
  );
  view._cxAppView = {
    component: () => <div data-sign="cx-app" />,
  };
  const Harness = () => view.component();
  return { hydrated$, Harness, view };
}

describe('CxAgentTabView hydration gate', () => {
  test('waits for this tab to hold the CX state before rendering the CX app', () => {
    const { hydrated$, Harness } = createView();

    render(<Harness />);
    expect(screen.queryByTestId('cx-app')).toBeNull();
    // The session is running, so the tab must not offer to start one.
    expect(screen.queryByTestId('start-panel')).toBeNull();

    act(() => {
      hydrated$.next(true);
    });
    expect(screen.getByTestId('cx-app')).toBeTruthy();
  });

  test('renders the CX app right away on a hydrated tab', () => {
    const { Harness } = createView({ hydrated: true });

    render(<Harness />);

    expect(screen.getByTestId('cx-app')).toBeTruthy();
  });

  test('offers to start a session when none is running', () => {
    const { Harness } = createView({ stage: 'idle' });

    render(<Harness />);

    expect(screen.getByTestId('start-panel')).toBeTruthy();
  });
});

describe('CxAgentTabView parked path', () => {
  test('parks the agent home and its tabs in a ready session', () => {
    const { view } = createView();

    // The bare tab path parks as the home, past the shell's redirect.
    expect(view.resolveParkedPath('/agent')).toBe('/agent/home');
    expect(view.resolveParkedPath('/agent/home')).toBe('/agent/home');
    expect(view.resolveParkedPath('/agent/home/history')).toBe(
      '/agent/home/history',
    );
  });

  test('does not park the call pages or an unknown home tab', () => {
    const { view } = createView();

    expect(view.resolveParkedPath('/agent/calls/call-1')).toBeNull();
    expect(view.resolveParkedPath('/agent/calls/call-1/disposition')).toBeNull();
    expect(view.resolveParkedPath('/agent/sessionConfig')).toBeNull();
    expect(view.resolveParkedPath('/agent/home/unknown')).toBeNull();
  });

  test('does not park the agent tab outside a ready session', () => {
    // The shell would redirect to a setup page and take the router over.
    const configuring = createView({ stage: 'sessionConfig' }).view;
    const unloaded = createView({ loaded: false }).view;

    expect(configuring.resolveParkedPath('/agent')).toBeNull();
    expect(unloaded.resolveParkedPath('/agent')).toBeNull();
  });
});
