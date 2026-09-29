import { MatchedContactSelection } from '../src/app/services/MatchedContactSelection';

const createSelection = () => {
  const storage = { enable: jest.fn() };
  return { selection: new MatchedContactSelection(storage), storage };
};

const MATCHES = [
  { id: 'rc-1', name: 'John Smith', type: 'company' },
  { id: 'crm-1', name: 'John Smith', type: 'lead' },
  { id: 'crm-2', name: 'J. Smith', type: 'contact' },
];

describe('MatchedContactSelection service', () => {
  test('enables storage so picks survive a reload', () => {
    const { storage, selection } = createSelection();

    expect(storage.enable).toHaveBeenCalledWith(selection);
    expect(selection.selectionList).toEqual([]);
  });

  test('records a pick per record and scope', () => {
    const { selection } = createSelection();

    selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-1' });
    selection.select({
      scope: 'conversation',
      key: 'session-1',
      entityId: 'crm-2',
    });

    expect(selection.getSelectedEntityId('call', 'session-1')).toBe('crm-1');
    expect(selection.getSelectedEntityId('conversation', 'session-1')).toBe(
      'crm-2',
    );
    expect(selection.getSelectedEntityId('call', 'session-2')).toBeUndefined();
  });

  test('replaces an existing pick in place instead of appending', () => {
    const { selection } = createSelection();

    selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-1' });
    selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-2' });

    expect(selection.selectionList).toEqual([
      { scope: 'call', key: 'session-1', entityId: 'crm-2' },
    ]);
  });

  test('clears only the targeted record', () => {
    const { selection } = createSelection();

    selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-1' });
    selection.select({ scope: 'call', key: 'session-2', entityId: 'crm-2' });

    selection.clear({ scope: 'call', key: 'session-1' });

    expect(selection.getSelectedEntityId('call', 'session-1')).toBeUndefined();
    expect(selection.getSelectedEntityId('call', 'session-2')).toBe('crm-2');
  });

  test('drops the oldest pick once the cap is reached', () => {
    const { selection } = createSelection();

    for (let index = 0; index < 201; index += 1) {
      selection.select({
        scope: 'call',
        key: `session-${index}`,
        entityId: `crm-${index}`,
      });
    }

    expect(selection.selectionList).toHaveLength(200);
    expect(selection.getSelectedEntityId('call', 'session-0')).toBeUndefined();
    expect(selection.getSelectedEntityId('call', 'session-1')).toBe('crm-1');
    expect(selection.getSelectedEntityId('call', 'session-200')).toBe('crm-200');
  });

  describe('outbound hand-off', () => {
    test('moves the pick onto the call placed from the record', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '(650) 555-0100',
      });

      // Formatting differs between what the record showed and what the call
      // reports, so the comparison is on digits.
      await selection.adoptPendingOutbound('session-new', ['+16505550100']);

      expect(selection.getSelectedEntityId('call', 'session-new')).toBe(
        'crm-1',
      );
      expect(selection.pendingOutbound).toBeNull();
    });

    test('resolves once matching catches up with the new call', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '+16505550100',
      });
      await selection.adoptPendingOutbound('session-new', ['+16505550100']);

      // Contact matching for the new number has not landed yet.
      expect(
        selection.resolveSelection('call', 'session-new', []),
      ).toBeUndefined();
      // ...and the pick applies as soon as it does.
      expect(
        selection.resolveSelection('call', 'session-new', MATCHES),
      ).toEqual({ displayedSelection: MATCHES[1], selections: MATCHES });
    });

    test('requires an exact match for extensions', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '102',
      });

      // Too short for a suffix match to be safe.
      await selection.adoptPendingOutbound('session-new', ['4102']);

      expect(
        selection.getSelectedEntityId('call', 'session-new'),
      ).toBeUndefined();
    });

    test('claims the pick from the extension a record dialled', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        // The record showed an extension, so that is what it dialled.
        phoneNumber: '4102',
      });

      // The telephony session reports both numbers for the callee, and the
      // phone number comes first — matching only that would drop the pick.
      await selection.adoptPendingOutbound('session-new', [
        '+16505550100',
        '4102',
      ]);

      expect(selection.getSelectedEntityId('call', 'session-new')).toBe(
        'crm-1',
      );
    });

    test('drops the pick when a different number is dialled', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '+16505550100',
      });

      await selection.adoptPendingOutbound('session-new', [
        '+16505550999',
        '4999',
      ]);

      expect(
        selection.getSelectedEntityId('call', 'session-new'),
      ).toBeUndefined();
      expect(selection.pendingOutbound).toBeNull();
    });

    test('ignores callee numbers the new call does not report', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '+16505550100',
      });

      await selection.adoptPendingOutbound('session-new', [
        undefined,
        '+16505550100',
      ]);

      expect(selection.getSelectedEntityId('call', 'session-new')).toBe(
        'crm-1',
      );
    });

    test('is a no-op with nothing pending', async () => {
      const { selection } = createSelection();

      await selection.adoptPendingOutbound('session-new', ['+16505550100']);

      expect(selection.selectionList).toEqual([]);
    });

    test('matches a national number with a trunk prefix', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        // A conversation dials the number as displayed, in national form.
        phoneNumber: '020 7946 0958',
      });

      await selection.adoptPendingOutbound('session-new', ['+442079460958']);

      expect(selection.getSelectedEntityId('call', 'session-new')).toBe(
        'crm-1',
      );
    });

    test('records the pick before clearing the pending one', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '+16505550100',
      });
      // Each action reaches client tabs as its own update, so the reverse
      // order leaves a moment with neither and renders `Maybe:`.
      const states = [];
      const select = selection._select.bind(selection);
      const setPending = selection._setPendingOutbound.bind(selection);
      selection._select = (options) => {
        select(options);
        states.push(['select', selection.pendingOutbound]);
      };
      selection._setPendingOutbound = (pending) => {
        setPending(pending);
        states.push([
          'clearPending',
          selection.getSelectedEntityId('call', 'session-new'),
        ]);
      };

      await selection.adoptPendingOutbound('session-new', ['+16505550100']);

      expect(states).toEqual([
        ['select', { entityId: 'crm-1', phoneNumber: '+16505550100' }],
        ['clearPending', 'crm-1'],
      ]);
    });
  });

  describe('product scope', () => {
    test('keeps a RingCX pick away from a RingEX call', async () => {
      const { selection } = createSelection();
      const pending = {
        entityId: 'crm-1',
        phoneNumber: '+16505550100',
        scope: 'cxCall',
      };
      await selection.setPendingOutbound(pending);

      // A RingEX call to the same number, e.g. through the RC-extension bridge.
      await selection.adoptPendingOutbound('session-new', ['+16505550100']);

      expect(
        selection.getSelectedEntityId('call', 'session-new'),
      ).toBeUndefined();
      // Still pending, so the RingCX call it was set for can claim it.
      expect(selection.pendingOutbound).toEqual(pending);
      expect(
        selection.resolvePendingOutboundSelection(['+16505550100'], MATCHES),
      ).toBeUndefined();
    });

    test('lets the RingCX call claim a RingCX pick under its uii', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '+16505550100',
        scope: 'cxCall',
      });

      expect(
        selection.resolvePendingOutboundSelection(
          ['+16505550100'],
          MATCHES,
          'cxCall',
        ),
      ).toEqual({ displayedSelection: MATCHES[1], selections: MATCHES });

      await selection.adoptPendingOutbound(
        'uii-new',
        ['+16505550100'],
        'cxCall',
      );

      expect(selection.getSelectedEntityId('cxCall', 'uii-new')).toBe('crm-1');
      expect(selection.getSelectedEntityId('call', 'uii-new')).toBeUndefined();
      expect(selection.pendingOutbound).toBeNull();
    });

    test('keeps a RingEX pick away from a RingCX call', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '+16505550100',
      });

      await selection.adoptPendingOutbound(
        'uii-new',
        ['+16505550100'],
        'cxCall',
      );

      expect(
        selection.getSelectedEntityId('cxCall', 'uii-new'),
      ).toBeUndefined();
      expect(selection.pendingOutbound).not.toBeNull();
    });
  });

  describe('resolvePendingOutboundSelection', () => {
    test('resolves the pending pick for a call to the dialled number', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '(650) 555-0100',
      });

      expect(
        selection.resolvePendingOutboundSelection(
          ['+16505550100', undefined],
          MATCHES,
        ),
      ).toEqual({ displayedSelection: MATCHES[1], selections: MATCHES });
    });

    test('does not apply the pending pick to another number', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '+16505550100',
      });

      expect(
        selection.resolvePendingOutboundSelection(['+16505550999'], MATCHES),
      ).toBeUndefined();
    });

    test('falls back without a pending pick or a live match for it', async () => {
      const { selection } = createSelection();

      expect(
        selection.resolvePendingOutboundSelection(['+16505550100'], MATCHES),
      ).toBeUndefined();

      await selection.setPendingOutbound({
        entityId: 'gone',
        phoneNumber: '+16505550100',
      });

      expect(
        selection.resolvePendingOutboundSelection(['+16505550100'], MATCHES),
      ).toBeUndefined();
      expect(
        selection.resolvePendingOutboundSelection(['+16505550100'], []),
      ).toBeUndefined();
    });
  });

  describe('carryOverCallSelection', () => {
    test('moves a stand-in pick onto the real session id', async () => {
      const { selection } = createSelection();
      // Adopted while the webphone reported the telephony session id as the
      // session id.
      selection.select({ scope: 'call', key: 's-telephony', entityId: 'crm-1' });

      await selection.carryOverCallSelection('s-telephony', 'session-real');

      expect(selection.selectionList).toEqual([
        { scope: 'call', key: 'session-real', entityId: 'crm-1' },
      ]);
    });

    test('keeps a pick the real session already has', async () => {
      const { selection } = createSelection();
      selection.select({ scope: 'call', key: 's-telephony', entityId: 'crm-1' });
      selection.select({
        scope: 'call',
        key: 'session-real',
        entityId: 'crm-2',
      });

      await selection.carryOverCallSelection('s-telephony', 'session-real');

      expect(selection.selectionList).toEqual([
        { scope: 'call', key: 'session-real', entityId: 'crm-2' },
      ]);
    });

    test('leaves picks alone when there is nothing to move', async () => {
      const { selection } = createSelection();
      selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-1' });
      selection.select({
        scope: 'conversation',
        key: 's-telephony',
        entityId: 'crm-2',
      });
      const before = selection.selectionList;

      // Still the stand-in: the session id is the telephony session id.
      await selection.carryOverCallSelection('session-1', 'session-1');
      // No call pick under the telephony session id.
      await selection.carryOverCallSelection('s-telephony', 'session-real');
      await selection.carryOverCallSelection('', 'session-real');

      expect(selection.selectionList).toBe(before);
    });
  });

  describe('resolveSelection', () => {
    test('reports the pick alongside the full match list', () => {
      const { selection } = createSelection();
      selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-2' });

      // `selections` must stay the full list: the framework derives the match
      // count from it once a selection exists.
      expect(selection.resolveSelection('call', 'session-1', MATCHES)).toEqual({
        displayedSelection: MATCHES[2],
        selections: MATCHES,
      });
    });

    test('falls back to the framework guess when the pick no longer matches', () => {
      const { selection } = createSelection();
      selection.select({ scope: 'call', key: 'session-1', entityId: 'gone' });

      expect(
        selection.resolveSelection('call', 'session-1', MATCHES),
      ).toBeUndefined();
    });

    test('falls back when there is no pick, key, or match list', () => {
      const { selection } = createSelection();
      selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-1' });

      expect(
        selection.resolveSelection('call', 'session-9', MATCHES),
      ).toBeUndefined();
      expect(
        selection.resolveSelection('call', undefined, MATCHES),
      ).toBeUndefined();
      expect(selection.resolveSelection('call', 'session-1', [])).toBeUndefined();
      expect(
        selection.resolveSelection('call', 'session-1', undefined),
      ).toBeUndefined();
      // A call pick must not leak into the conversation scope.
      expect(
        selection.resolveSelection('conversation', 'session-1', MATCHES),
      ).toBeUndefined();
    });
  });
});
