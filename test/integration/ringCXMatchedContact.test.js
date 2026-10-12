import { fireEvent, render, screen } from '@testing-library/react';
import {
  fromWatchValue,
  useContainer,
} from '@ringcentral-integration/next-core';
import React from 'react';
import { Subject } from 'rxjs';

import { MatchedContactSelection } from '../../src/app/services/MatchedContactSelection';
import { CxCallMonitor } from '../../src/ringcx/services/CxCallMonitor/CxCallMonitor';
import { useCxCallContactRenderInfo } from '../../src/ringcx/hooks/useCxCallContactRenderInfo';
import { getCxCallResolvedContact } from '../../src/ringcx/lib/getCxCallResolvedContact';
import { getCxCallSelectionKey } from '../../src/ringcx/lib/getCxCallSelectionKey';

jest.mock('../../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));
jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class {},
}));
jest.mock('../../src/ringcx/services/CxCallDataSource', () => ({
  CxCallDataSource: class {},
}));
jest.mock(
  '@ringcentral-integration/micro-contacts/src/app/services/ContactMatcher',
  () => ({ ContactMatcher: class {} }),
);
jest.mock(
  '@ringcentral-integration/micro-contacts/src/app/services/ActivityMatcher',
  () => ({ ActivityMatcher: class {} }),
);

const mockRenderInfo = jest.fn();
jest.mock('../../src/ringcx/hooks/useCxContactRenderInfo', () => ({
  useCxContactRenderInfo: (options) => {
    mockRenderInfo(options);
    return {
      renderInfo: { matchedContact: options.selection?.displayedSelection },
      Avatar: () => null,
      DisplayName: () => (
        <span data-sign="baseDisplayName">
          {options.selection?.displayedSelection?.name ?? 'Maybe'}
        </span>
      ),
    };
  },
}));

const MATCHES = [
  { id: 'rc-1', name: 'Ada Byron', type: 'company' },
  { id: 'crm-1', name: 'Ada Lovelace', type: 'contact' },
];

const createSelection = () =>
  new MatchedContactSelection({ enable: jest.fn() });

describe('getCxCallSelectionKey', () => {
  test('keys a call by its interaction id', () => {
    expect(getCxCallSelectionKey({ uii: 'uii-1' })).toBe('uii-1');
    // The live call page reads it off the session.
    expect(getCxCallSelectionKey({ session: { uii: 'uii-1' } })).toBe('uii-1');
  });

  test('has no key without an interaction id', () => {
    expect(getCxCallSelectionKey({})).toBeUndefined();
    expect(getCxCallSelectionKey(null)).toBeUndefined();
  });
});

describe('getCxCallResolvedContact', () => {
  test('resolves the pick made for the interaction', () => {
    const selection = createSelection();
    selection.select({ scope: 'cxCall', key: 'uii-1', entityId: 'crm-1' });

    expect(
      getCxCallResolvedContact(selection, { uii: 'uii-1', matches: MATCHES }),
    ).toBe(MATCHES[1]);
  });

  test('prefers the contact the call was logged against', () => {
    const selection = createSelection();
    selection.select({ scope: 'cxCall', key: 'uii-1', entityId: 'crm-1' });

    expect(
      getCxCallResolvedContact(selection, {
        uii: 'uii-1',
        matches: MATCHES,
        activityMatches: [{ contactId: 'rc-1', id: 'log-1', type: 'activity' }],
      }),
    ).toBe(MATCHES[0]);
  });

  test('never returns the guess', () => {
    const selection = createSelection();
    // A RingEX pick with the same key belongs to another product.
    selection.select({ scope: 'call', key: 'uii-1', entityId: 'crm-1' });

    expect(
      getCxCallResolvedContact(selection, { uii: 'uii-1', matches: MATCHES }),
    ).toBeUndefined();
    expect(
      getCxCallResolvedContact(selection, { matches: MATCHES }),
    ).toBeUndefined();
  });
});

describe('CxCallMonitor outbound hand-off', () => {
  const OUTBOUND_CALL = {
    uii: 'uii-new',
    callType: 'OUTBOUND',
    aniE164: '+16505550100',
    ani: '6505550100',
  };

  const createMonitor = ({ shared = false, calls = {} } = {}) => {
    const callIds = new Subject();
    fromWatchValue.mockImplementation(() => callIds);
    const cxPresence = { callsMapping: calls };
    const portManager = { shared, onServer: jest.fn() };
    const selection = createSelection();
    const monitor = new CxCallMonitor(
      {},
      cxPresence,
      {},
      portManager,
      selection,
    );
    return { callIds, monitor, portManager, selection };
  };

  afterEach(() => {
    fromWatchValue.mockReset();
  });

  test('claims the pending pick for a newly placed outbound call', async () => {
    const { callIds, selection } = createMonitor({
      calls: { 'call-1': OUTBOUND_CALL },
    });
    await selection.setPendingOutbound({
      entityId: 'crm-1',
      phoneNumber: '(650) 555-0100',
      scope: 'cxCall',
    });

    callIds.next(['call-1']);
    await Promise.resolve();

    // Keyed by the interaction id its history rows will share.
    expect(selection.getSelectedEntityId('cxCall', 'uii-new')).toBe('crm-1');
    expect(selection.pendingOutbound).toBeNull();
  });

  test('leaves an inbound call alone', async () => {
    const { callIds, selection } = createMonitor({
      calls: { 'call-1': { ...OUTBOUND_CALL, callType: 'INBOUND' } },
    });
    await selection.setPendingOutbound({
      entityId: 'crm-1',
      phoneNumber: '+16505550100',
      scope: 'cxCall',
    });

    callIds.next(['call-1']);
    await Promise.resolve();

    expect(
      selection.getSelectedEntityId('cxCall', 'uii-new'),
    ).toBeUndefined();
    expect(selection.pendingOutbound).not.toBeNull();
  });

  test('only offers calls that were not there before', async () => {
    const { callIds, selection } = createMonitor({
      calls: {
        'call-1': OUTBOUND_CALL,
        'call-2': { ...OUTBOUND_CALL, uii: 'uii-later' },
      },
    });
    callIds.next(['call-1']);
    await selection.setPendingOutbound({
      entityId: 'crm-1',
      phoneNumber: '+16505550100',
      scope: 'cxCall',
    });

    // `call-1` is still up, so only `call-2` is new.
    callIds.next(['call-1', 'call-2']);
    await Promise.resolve();

    expect(
      selection.getSelectedEntityId('cxCall', 'uii-new'),
    ).toBeUndefined();
    expect(selection.getSelectedEntityId('cxCall', 'uii-later')).toBe('crm-1');
  });

  test('binds on the server in shared mode', () => {
    const { portManager } = createMonitor({ shared: true });

    expect(fromWatchValue).not.toHaveBeenCalled();
    expect(portManager.onServer).toHaveBeenCalledTimes(1);
    portManager.onServer.mock.calls[0][0]();
    expect(fromWatchValue).toHaveBeenCalledTimes(1);
  });
});

describe('useCxCallContactRenderInfo', () => {
  let selection;

  beforeEach(() => {
    selection = createSelection();
    useContainer.mockImplementation((token) =>
      token === 'MatchedContactSelection' ? selection : undefined,
    );
    mockRenderInfo.mockClear();
  });

  afterEach(() => {
    useContainer.mockReset();
  });

  const Host = (props) => {
    const { DisplayName } = useCxCallContactRenderInfo({
      uii: 'uii-1',
      phoneNumber: '+16505550100',
      matches: MATCHES,
      ...props,
    });
    return <DisplayName displayControl={{ matchCounts: true }} />;
  };

  const lastSelection = () => mockRenderInfo.mock.calls.at(-1)[0].selection;

  test('lets the agent pick one of several matches', () => {
    const { rerender } = render(<Host />);

    expect(lastSelection()).toBeUndefined();
    expect(screen.getByTestId('baseDisplayName')).toHaveTextContent('Maybe');

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Ada Lovelace'));
    rerender(<Host />);

    expect(selection.getSelectedEntityId('cxCall', 'uii-1')).toBe('crm-1');
    // The full list stays, so the match count survives a selection.
    expect(lastSelection()).toEqual({
      displayedSelection: MATCHES[1],
      selections: MATCHES,
    });
    expect(screen.getByTestId('baseDisplayName')).toHaveTextContent(
      'Ada Lovelace',
    );
  });

  test('shows the logged contact and no picker', () => {
    selection.select({ scope: 'cxCall', key: 'uii-1', entityId: 'crm-1' });

    render(
      <Host
        activityMatches={[
          { contactId: 'rc-1', id: 'log-1', type: 'activity' },
        ]}
      />,
    );

    expect(lastSelection().displayedSelection).toBe(MATCHES[0]);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('lends a live call the pending pick before it claims it', async () => {
    await selection.setPendingOutbound({
      entityId: 'crm-1',
      phoneNumber: '+16505550100',
      scope: 'cxCall',
    });

    render(<Host live />);

    expect(lastSelection().displayedSelection).toBe(MATCHES[1]);
  });

  test('does not lend the pending pick to a history record', async () => {
    await selection.setPendingOutbound({
      entityId: 'crm-1',
      phoneNumber: '+16505550100',
      scope: 'cxCall',
    });

    render(<Host />);

    expect(lastSelection()).toBeUndefined();
  });
});
