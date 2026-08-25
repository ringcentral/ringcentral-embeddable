import { MatchedContactSelection } from '../../next/app/services/MatchedContactSelection';

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
      await selection.adoptPendingOutbound('session-new', '+16505550100');

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
      await selection.adoptPendingOutbound('session-new', '+16505550100');

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
      await selection.adoptPendingOutbound('session-new', '4102');

      expect(
        selection.getSelectedEntityId('call', 'session-new'),
      ).toBeUndefined();
    });

    test('drops the pick when a different number is dialled', async () => {
      const { selection } = createSelection();
      await selection.setPendingOutbound({
        entityId: 'crm-1',
        phoneNumber: '+16505550100',
      });

      await selection.adoptPendingOutbound('session-new', '+16505550999');

      expect(
        selection.getSelectedEntityId('call', 'session-new'),
      ).toBeUndefined();
      expect(selection.pendingOutbound).toBeNull();
    });

    test('is a no-op with nothing pending', async () => {
      const { selection } = createSelection();

      await selection.adoptPendingOutbound('session-new', '+16505550100');

      expect(selection.selectionList).toEqual([]);
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
