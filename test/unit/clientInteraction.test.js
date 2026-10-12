const { BehaviorSubject } = require('rxjs');

const {
  ClientInteraction,
  lastInteractedClientRole,
} = require('../../src/app/services/ClientInteraction/ClientInteraction');

const ROLE = lastInteractedClientRole.role;

const unavailable = () => ({
  phase: 'unavailable',
  role: ROLE,
  revision: 0,
  owners: [],
});

const ownedBy = (clientId, revision = 1) => ({
  phase: 'owned',
  role: ROLE,
  revision,
  owners: [{ clientId }],
});

/**
 * Captures the listeners the module registers so tests can deliver synthetic
 * events. jsdom makes `isTrusted` a non-configurable own property, so a real
 * dispatched event can never look trusted.
 */
function captureListeners() {
  const handlers = new Map();
  const add = jest
    .spyOn(globalThis, 'addEventListener')
    .mockImplementation((type, handler) => handlers.set(type, handler));
  const remove = jest
    .spyOn(globalThis, 'removeEventListener')
    .mockImplementation((type) => handlers.delete(type));
  return {
    handlers,
    types: () => [...handlers.keys()],
    fire: (type, event = {}) =>
      handlers.get(type)?.({ isTrusted: true, type, ...event }),
    restore: () => {
      add.mockRestore();
      remove.mockRestore();
    },
  };
}

function createPortManager({ isClient = true, clientId = 'client-1' } = {}) {
  const roleState$ = new BehaviorSubject(unavailable());
  let teardown;
  const portManager = {
    isClient,
    clientId,
    roleState$,
    registerRole: jest.fn(async () => ({ role: ROLE, revision: 1, owners: [] })),
    claimRole: jest.fn(async () => {
      roleState$.next(ownedBy(clientId));
      return { role: ROLE, revision: 1, owners: [{ clientId }] };
    }),
    getRoleStateStreams: jest.fn(() => ({
      roleState$,
      roleTransition$: roleState$,
    })),
    onClient: jest.fn((callback) => {
      teardown = callback();
    }),
    teardown: () => teardown?.(),
  };
  return portManager;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

let listeners;

beforeEach(() => {
  listeners = captureListeners();
});

afterEach(() => {
  listeners.restore();
});

it('registers interaction listeners only on a client', () => {
  const portManager = createPortManager();

  new ClientInteraction(portManager);

  expect(portManager.onClient).toHaveBeenCalledTimes(1);
  expect(listeners.types()).toEqual(
    expect.arrayContaining(['pointerdown', 'click', 'keydown']),
  );
  portManager.teardown();
});

it('claims the role on a trusted interaction', async () => {
  const portManager = createPortManager();
  const module = new ClientInteraction(portManager);

  listeners.fire('click');
  await flush();

  expect(portManager.claimRole).toHaveBeenCalledTimes(1);
  expect(module.isLastInteractedClient).toBe(true);
  portManager.teardown();
});

it('ignores untrusted events so page scripts cannot steal audio', async () => {
  const portManager = createPortManager();
  new ClientInteraction(portManager);

  listeners.fire('click', { isTrusted: false });
  await flush();

  expect(portManager.claimRole).not.toHaveBeenCalled();
  portManager.teardown();
});

it('does not re-claim while already the owner', async () => {
  const portManager = createPortManager();
  new ClientInteraction(portManager);

  listeners.fire('click');
  await flush();
  listeners.fire('keydown');
  await flush();

  expect(portManager.claimRole).toHaveBeenCalledTimes(1);
  portManager.teardown();
});

it('dedupes concurrent claims triggered by rapid interactions', async () => {
  const portManager = createPortManager();
  let release;
  portManager.claimRole.mockImplementation(
    () =>
      new Promise((resolve) => {
        release = () => resolve({ role: ROLE, revision: 1, owners: [] });
      }),
  );
  new ClientInteraction(portManager);

  listeners.fire('pointerdown');
  listeners.fire('click');
  listeners.fire('keydown');
  await flush();

  expect(portManager.claimRole).toHaveBeenCalledTimes(1);
  release();
  await flush();
  portManager.teardown();
});

it('ensureCurrentClient resolves without claiming on the server', async () => {
  const portManager = createPortManager({ isClient: false });
  const module = new ClientInteraction(portManager);

  await expect(module.ensureCurrentClient()).resolves.toBeUndefined();
  expect(module.isLastInteractedClient).toBe(false);
  expect(portManager.claimRole).not.toHaveBeenCalled();
});

it('allows a later claim after a failed one and logs the failure', async () => {
  const portManager = createPortManager();
  portManager.claimRole
    .mockRejectedValueOnce(new Error('coordinator busy'))
    .mockResolvedValueOnce({ role: ROLE, revision: 2, owners: [] });
  const module = new ClientInteraction(portManager);

  listeners.fire('click');
  await flush();
  expect(module.logger.warn).toHaveBeenCalledWith(
    'lastInteractedClient claim failed',
    expect.objectContaining({ clientId: 'client-1' }),
  );

  await module.ensureCurrentClient();
  expect(portManager.claimRole).toHaveBeenCalledTimes(2);
  portManager.teardown();
});

it('removes listeners and stops claiming after client teardown', async () => {
  const portManager = createPortManager();
  new ClientInteraction(portManager);

  portManager.teardown();
  listeners.fire('click');
  await flush();

  expect(portManager.claimRole).not.toHaveBeenCalled();
});
