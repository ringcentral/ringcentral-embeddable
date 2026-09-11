const nextCore = require('@ringcentral-integration/next-core');

const delegateSpy = jest.spyOn(nextCore, 'delegate');
const storageSpy = jest.spyOn(nextCore, 'storage');

require('../src/app/services/MatchedContactSelection/MatchedContactSelection');

describe('MatchedContactSelection persistence wiring', () => {
  afterAll(() => {
    delegateSpy.mockRestore();
    storageSpy.mockRestore();
  });

  test('runs every persisted mutation on the server instance', () => {
    // Storage is owned by the server. An @action dispatched straight from a
    // client tab mutates only that tab's copy, so the pick is lost on reload.
    // select, clear, setPendingOutbound, adoptPendingOutbound.
    expect(delegateSpy).toHaveBeenCalledTimes(4);
    expect(delegateSpy.mock.calls.every(([scope]) => scope === 'server')).toBe(
      true,
    );
  });

  test('persists the selection list, clearing it on logout', () => {
    // @storage (not @userStorage): a CRM match should not outlive the session
    // it was made in, matching the legacy ContactMatcher.callMatchedList.
    expect(storageSpy).toHaveBeenCalledTimes(1);
    expect(storageSpy.mock.calls[0][1]).toBe('selectionList');
  });
});
