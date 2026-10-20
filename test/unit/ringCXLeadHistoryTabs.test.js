import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { LeadHistoryCard } from '../../src/ringcx/components/LeadInfoPanel/LeadHistoryCard';
import { PastCallTabs } from '../../src/ringcx/components/LeadInfoPanel/PastCallTabs';

jest.mock('@ringcentral-integration/micro-message/src/app/components', () => ({
  VoicemailPlayer: () => null,
}));

// The shared mock's `Block` passes `borderRadius` on to the DOM, its tabs do
// not select on click, and the icon button's tooltip needs no portal here.
jest.mock('@ringcentral/spring-ui', () => {
  const React = jest.requireActual('react');
  const TabsChange = React.createContext(null);
  return {
    ...jest.requireActual('@ringcentral/spring-ui'),
    Block: ({ children, borderRadius, ...props }) => (
      <section {...props}>{children}</section>
    ),
    IconButton: ({ symbol, variant, color, size, TooltipProps, ...props }) => (
      <button type="button" {...props} />
    ),
    TabContext: ({ children, onChange }) => (
      <TabsChange.Provider value={onChange}>{children}</TabsChange.Provider>
    ),
    Tabs: ({ children, variant, pill, size, ...props }) => (
      <div {...props}>{children}</div>
    ),
    Tab: ({ label, value, ...props }) => {
      const onChange = React.useContext(TabsChange);
      return (
        <button type="button" onClick={() => onChange(null, value)} {...props}>
          {label}
        </button>
      );
    },
  };
});

const RECORDS = [
  {
    passUii: 'uii-1',
    passNumber: '1',
    passDisposition: 'ANSWER',
    passDts: '2026-10-19 17:11:00',
    agentName: 'Ann Agent',
    agentDisposition: 'Default',
    agentNotes: '',
  },
];

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('LeadHistoryCard in the Lead tab', () => {
  test('waits for Show history, then offers Refresh in its own header', async () => {
    const loadLeadHistory = jest.fn(async () => RECORDS);
    render(
      <LeadHistoryCard leadId="5725" loadLeadHistory={loadLeadHistory} />,
    );
    const card = screen.getByTestId('leadCard-history');

    // Locale strings render as their keys in tests.
    expect(within(card).getByText('history')).toBeInTheDocument();
    expect(loadLeadHistory).not.toHaveBeenCalled();

    fireEvent.click(within(card).getByTestId('leadHistoryShow'));
    await flush();

    expect(loadLeadHistory).toHaveBeenCalledWith('5725');
    expect(within(card).getAllByTestId('leadHistoryRecord')).toHaveLength(1);

    fireEvent.click(within(card).getByTestId('leadHistoryRefresh'));
    await flush();
    expect(loadLeadHistory).toHaveBeenCalledTimes(2);
  });

  test('says when the history could not load', async () => {
    render(
      <LeadHistoryCard
        leadId="5725"
        loadLeadHistory={jest.fn(async () => null)}
        autoLoad
      />,
    );
    await flush();

    expect(screen.getByTestId('leadHistoryError')).toBeInTheDocument();
    expect(screen.getByTestId('leadHistoryRefresh')).toBeInTheDocument();
  });
});

describe('PastCallTabs History tab', () => {
  function renderTabs(loadLeadHistory) {
    return render(
      <PastCallTabs
        callContent={<div data-sign="callContent" />}
        leadId="5725"
        rows={[]}
        loadRecording={jest.fn()}
        loadLeadHistory={loadLeadHistory}
      />,
    );
  }

  test('loads the history the first time its tab opens', async () => {
    const loadLeadHistory = jest.fn(async () => RECORDS);
    renderTabs(loadLeadHistory);
    expect(loadLeadHistory).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('pastCallTab-history'));
    await flush();
    expect(loadLeadHistory).toHaveBeenCalledTimes(1);
    expect(screen.getAllByTestId('leadHistoryRecord')).toHaveLength(1);

    // Kept while the agent switches tabs.
    fireEvent.click(screen.getByTestId('pastCallTab-call'));
    fireEvent.click(screen.getByTestId('pastCallTab-history'));
    await flush();
    expect(loadLeadHistory).toHaveBeenCalledTimes(1);
  });

  test('holds Refresh in the tab row, and the card has no header', async () => {
    const loadLeadHistory = jest.fn(async () => RECORDS);
    renderTabs(loadLeadHistory);

    fireEvent.click(screen.getByTestId('pastCallTab-history'));
    await flush();

    const card = screen.getByTestId('leadCard-history');
    const refresh = screen.getByTestId('leadHistoryRefresh');
    expect(card).not.toContainElement(refresh);
    // The tab already names the card.
    expect(within(card).queryByText('history')).toBeNull();
    expect(within(card).queryByTestId('leadHistoryShow')).toBeNull();

    fireEvent.click(refresh);
    await flush();
    expect(loadLeadHistory).toHaveBeenCalledTimes(2);
  });

  test('shows a spinner in place of Refresh while the history loads', async () => {
    const request = deferred();
    renderTabs(jest.fn(() => request.promise));

    fireEvent.click(screen.getByTestId('pastCallTab-history'));
    expect(screen.queryByTestId('leadHistoryRefresh')).toBeNull();

    request.resolve(RECORDS);
    await flush();
    expect(screen.getByTestId('leadHistoryRefresh')).toBeInTheDocument();
  });

  test('offers Refresh only on the History tab', async () => {
    renderTabs(jest.fn(async () => RECORDS));
    expect(screen.queryByTestId('leadHistoryRefresh')).toBeNull();

    fireEvent.click(screen.getByTestId('pastCallTab-history'));
    await flush();
    expect(screen.getByTestId('leadHistoryRefresh')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pastCallTab-lead'));
    expect(screen.queryByTestId('leadHistoryRefresh')).toBeNull();
  });

  test('has no History tab when the agent may not see lead history', () => {
    renderTabs(undefined);

    expect(screen.queryByTestId('pastCallTab-history')).toBeNull();
  });
});
