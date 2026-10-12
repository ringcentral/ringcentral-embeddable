const {
  invokeRole,
  RoleAggregateError,
  RoleDefinitionMismatchError,
  RoleFencedError,
  RoleInvocationTimeoutError,
  RoleNotRegisteredError,
} = require('@ringcentral-integration/next-core');
const { BehaviorSubject } = require('rxjs');

const {
  claimRoleCompat,
  invokeRoleForValue,
  isLocalRoleOwner,
  localRoleOwnerId,
  registerRoleOnce,
  RoleStateMirror,
  SERVER_ROLE_OWNER,
  unavailableRoleState,
} = require('../../src/lib/roleCompat');

const MEDIA_OWNER = {
  role: 'webphone.mediaOwner',
  allowMultiple: false,
  autoElect: false,
};

function createPortManager({ isClient = true, clientId = 'client-1' } = {}) {
  const streams = new Map();
  return {
    isClient,
    clientId,
    registerRole: jest.fn(async () => ({
      role: MEDIA_OWNER.role,
      revision: 1,
      owners: [],
    })),
    claimRole: jest.fn(async (role) => ({ role, revision: 2, owners: [] })),
    getRoleStateStreams: jest.fn((role) => {
      if (!streams.has(role)) {
        streams.set(role, new BehaviorSubject(unavailableRoleState(role)));
      }
      return { roleState$: streams.get(role), roleTransition$: streams.get(role) };
    }),
    streams,
  };
}

const ownedBy = (clientId, revision = 3) => ({
  phase: 'owned',
  role: MEDIA_OWNER.role,
  revision,
  owners: [{ clientId }],
});

beforeEach(() => {
  invokeRole.mockReset();
});

describe('localRoleOwnerId / isLocalRoleOwner', () => {
  it('identifies a client by its clientId and the server by the sentinel', () => {
    expect(localRoleOwnerId(createPortManager())).toBe('client-1');
    expect(localRoleOwnerId(createPortManager({ isClient: false }))).toBe(
      SERVER_ROLE_OWNER,
    );
  });

  it('is only true when this port is listed as an owner of an owned role', () => {
    const client = createPortManager();
    expect(isLocalRoleOwner(client, ownedBy('client-1'))).toBe(true);
    expect(isLocalRoleOwner(client, ownedBy('client-2'))).toBe(false);
  });

  it('is false for every non-owned phase and for a missing state', () => {
    const client = createPortManager();
    expect(isLocalRoleOwner(client, unavailableRoleState(MEDIA_OWNER.role))).toBe(
      false,
    );
    expect(
      isLocalRoleOwner(client, {
        phase: 'acquiring',
        role: MEDIA_OWNER.role,
        revision: 1,
        owners: [],
        pendingOwnerIds: ['client-1'],
      }),
    ).toBe(false);
    expect(isLocalRoleOwner(client, undefined)).toBe(false);
  });

  it('recognises the server as owner when the server holds the role', () => {
    const server = createPortManager({ isClient: false });
    expect(isLocalRoleOwner(server, ownedBy(SERVER_ROLE_OWNER))).toBe(true);
  });
});

describe('RoleStateMirror', () => {
  it('exposes the latest state synchronously and reports the revision', () => {
    const portManager = createPortManager();
    const mirror = new RoleStateMirror(portManager, MEDIA_OWNER.role);

    expect(mirror.state.phase).toBe('unavailable');
    expect(mirror.revision).toBe(0);

    portManager.streams.get(MEDIA_OWNER.role).next(ownedBy('client-1', 7));

    expect(mirror.state.phase).toBe('owned');
    expect(mirror.revision).toBe(7);
    mirror.dispose();
  });

  it('notifies with the previous state and stops after dispose', () => {
    const portManager = createPortManager();
    const onChange = jest.fn();
    const mirror = new RoleStateMirror(portManager, MEDIA_OWNER.role, onChange);
    const subject = portManager.streams.get(MEDIA_OWNER.role);

    subject.next(ownedBy('client-1', 4));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ revision: 4 }),
      expect.objectContaining({ phase: 'unavailable' }),
    );

    mirror.dispose();
    subject.next(ownedBy('client-2', 5));
    // The mirror keeps the state it had when disposed.
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(mirror.revision).toBe(4);
  });
});

describe('registerRoleOnce', () => {
  it('registers only once per port manager', async () => {
    const portManager = createPortManager();
    await registerRoleOnce(portManager, MEDIA_OWNER);
    await registerRoleOnce(portManager, MEDIA_OWNER);
    expect(portManager.registerRole).toHaveBeenCalledTimes(1);
  });

  it('treats an "already registered locally" rejection as success', async () => {
    const portManager = createPortManager();
    portManager.registerRole.mockRejectedValueOnce(
      new Error(`Role '${MEDIA_OWNER.role}' is already registered locally.`),
    );
    await expect(
      registerRoleOnce(portManager, MEDIA_OWNER),
    ).resolves.toBeUndefined();
  });

  it('does not cache a genuine failure, so a later call retries', async () => {
    const portManager = createPortManager();
    portManager.registerRole.mockRejectedValueOnce(new Error('transport gone'));

    await expect(registerRoleOnce(portManager, MEDIA_OWNER)).rejects.toThrow(
      'transport gone',
    );
    await expect(
      registerRoleOnce(portManager, MEDIA_OWNER),
    ).resolves.toBeUndefined();
    expect(portManager.registerRole).toHaveBeenCalledTimes(2);
  });
});

describe('claimRoleCompat', () => {
  it('registers then claims, returning the claim result', async () => {
    const portManager = createPortManager();
    const result = await claimRoleCompat(portManager, MEDIA_OWNER);

    expect(portManager.registerRole).toHaveBeenCalledWith(MEDIA_OWNER, {});
    expect(portManager.claimRole).toHaveBeenCalledWith(MEDIA_OWNER.role);
    expect(result.revision).toBe(2);
  });

  it.each([
    ['RoleNotRegisteredError', RoleNotRegisteredError],
    ['RoleDefinitionMismatchError', RoleDefinitionMismatchError],
  ])('re-registers and retries the claim after %s', async (_name, Err) => {
    const portManager = createPortManager();
    portManager.claimRole.mockRejectedValueOnce(new Err(MEDIA_OWNER.role));

    const result = await claimRoleCompat(portManager, MEDIA_OWNER);

    expect(portManager.registerRole).toHaveBeenCalledTimes(2);
    expect(portManager.claimRole).toHaveBeenCalledTimes(2);
    expect(result.revision).toBe(2);
  });

  it('propagates an unrelated claim failure without retrying', async () => {
    const portManager = createPortManager();
    portManager.claimRole.mockRejectedValue(new Error('coordinator down'));

    await expect(claimRoleCompat(portManager, MEDIA_OWNER)).rejects.toThrow(
      'coordinator down',
    );
    expect(portManager.claimRole).toHaveBeenCalledTimes(1);
  });
});

describe('invokeRoleForValue', () => {
  const module = {};

  it('returns the single owner value from a collected result list', async () => {
    invokeRole.mockResolvedValue([
      { clientId: 'client-2', status: 'fulfilled', value: 'v=0 sdp' },
    ]);

    await expect(
      invokeRoleForValue(module, 'createOffer', [{ callId: 'c1' }], MEDIA_OWNER.role),
    ).resolves.toBe('v=0 sdp');

    expect(invokeRole).toHaveBeenCalledWith(
      module,
      'createOffer',
      [{ callId: 'c1' }],
      { role: MEDIA_OWNER.role, collectResults: true },
    );
  });

  it('returns a raw value from the standalone (no container) path', async () => {
    invokeRole.mockResolvedValue('v=0 standalone');
    await expect(
      invokeRoleForValue(module, 'createAnswer', [], MEDIA_OWNER.role),
    ).resolves.toBe('v=0 standalone');
  });

  it('passes undefined through for void-returning delegated methods', async () => {
    invokeRole.mockResolvedValue(undefined);
    await expect(
      invokeRoleForValue(module, 'applyAnswer', [], MEDIA_OWNER.role),
    ).resolves.toBeUndefined();
  });

  it('unwraps RoleFencedError out of a RoleAggregateError', async () => {
    const fenced = new RoleFencedError(MEDIA_OWNER.role);
    invokeRole.mockRejectedValue(new RoleAggregateError([fenced], []));

    await expect(
      invokeRoleForValue(module, 'createOffer', [], MEDIA_OWNER.role),
    ).rejects.toBe(fenced);
  });

  it('falls back to the rejected result reason when errors[] is empty', async () => {
    const fenced = new RoleFencedError(MEDIA_OWNER.role);
    invokeRole.mockRejectedValue(
      new RoleAggregateError([], [
        { clientId: 'client-2', status: 'rejected', reason: fenced },
      ]),
    );

    await expect(
      invokeRoleForValue(module, 'createOffer', [], MEDIA_OWNER.role),
    ).rejects.toBe(fenced);
  });

  it('passes a bare RoleInvocationTimeoutError through unchanged', async () => {
    const timeout = new RoleInvocationTimeoutError(MEDIA_OWNER.role);
    invokeRole.mockRejectedValue(timeout);

    await expect(
      invokeRoleForValue(module, 'createOffer', [], MEDIA_OWNER.role),
    ).rejects.toBe(timeout);
  });

  it('throws the owner rejection when the result list has no fulfilled entry', async () => {
    const fenced = new RoleFencedError(MEDIA_OWNER.role);
    invokeRole.mockResolvedValue([
      { clientId: 'client-2', status: 'rejected', reason: fenced },
    ]);

    await expect(
      invokeRoleForValue(module, 'createOffer', [], MEDIA_OWNER.role),
    ).rejects.toBe(fenced);
  });

  it('throws when the role reports no owners at all', async () => {
    invokeRole.mockResolvedValue([]);

    await expect(
      invokeRoleForValue(module, 'createOffer', [], MEDIA_OWNER.role),
    ).rejects.toThrow("returned no result for 'createOffer'");
  });
});
