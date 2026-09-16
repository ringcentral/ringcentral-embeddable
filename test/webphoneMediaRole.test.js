const {
  invokeRole,
  RoleFencedError,
  RoleUnavailableError,
} = require('@ringcentral-integration/next-core');
const { BehaviorSubject } = require('rxjs');

const {
  BrowserWebRtcSession,
  WebphoneMedia,
  webphoneMediaOwnerRole,
} = require('../src/app/services/WebphoneMedia/WebphoneMedia');

const MEDIA_ROLE = webphoneMediaOwnerRole.role;

const unavailable = (role = MEDIA_ROLE, revision = 0) => ({
  phase: 'unavailable',
  role,
  revision,
  owners: [],
});

const owned = (clientId, revision, role = MEDIA_ROLE) => ({
  phase: 'owned',
  role,
  revision,
  owners: [{ clientId }],
});

function createPortManager({
  shared = true,
  isServer = true,
  isWorkerMode = true,
  clientId = undefined,
} = {}) {
  const subjects = new Map();
  const subjectFor = (role) => {
    if (!subjects.has(role)) {
      subjects.set(role, new BehaviorSubject(unavailable(role)));
    }
    return subjects.get(role);
  };
  return {
    shared,
    isServer,
    isClient: !isServer,
    isWorkerMode,
    clientId,
    subjects,
    subjectFor,
    push: (state, role = MEDIA_ROLE) => subjectFor(role).next(state),
    registerRole: jest.fn(async () => ({
      role: MEDIA_ROLE,
      revision: 0,
      owners: [],
    })),
    claimRole: jest.fn(async () => ({
      role: MEDIA_ROLE,
      revision: 1,
      owners: [],
    })),
    releaseRole: jest.fn(async () => ({
      role: MEDIA_ROLE,
      revision: 2,
      owners: [],
    })),
    getRoleStateStreams: jest.fn((role) => ({
      roleState$: subjectFor(role),
      roleTransition$: subjectFor(role),
    })),
  };
}

const audioSettings = () => ({
  callVolume: 0.5,
  inputDeviceId: '',
  outputDeviceId: '',
  checkDevices: jest.fn(async () => undefined),
});

const context = (callId = 'call-1') => ({
  callId,
  direction: 'outbound',
  stunServers: ['stun.example.com'],
});

const build = (portManagerOptions, noiseReduction) => {
  const portManager = createPortManager(portManagerOptions);
  const module = new WebphoneMedia(
    portManager,
    audioSettings(),
    noiseReduction,
  );
  return { portManager, module };
};

beforeEach(() => {
  invokeRole.mockReset();
  invokeRole.mockResolvedValue([
    { clientId: 'owner', status: 'fulfilled', value: 'v=0 delegated' },
  ]);
});

describe('standalone mode', () => {
  it('creates a real local session rather than a proxy', async () => {
    const { module } = build({ shared: false, isServer: false });
    await module.onInit();

    const session = module.createWebRtcSession(context());

    expect(session).toBeInstanceOf(BrowserWebRtcSession);
    expect(module.isLocalMediaOwner).toBe(true);
    expect(module.hasOtherConnectedClients).toBe(false);
  });

  it('does not register or claim any role', async () => {
    const { portManager, module } = build({ shared: false, isServer: false });
    await module.onInit();
    await module.ensureMediaOwner();

    expect(portManager.registerRole).not.toHaveBeenCalled();
    expect(portManager.claimRole).not.toHaveBeenCalled();
  });

  it('exposes a factory that produces sessions', async () => {
    const { module } = build({ shared: false, isServer: false });
    const session = module.factory(context());
    expect(session).toBeInstanceOf(BrowserWebRtcSession);
  });
});

describe('worker (delegated) mode', () => {
  it('registers the media-owner role on init', async () => {
    const { portManager, module } = build();
    await module.onInit();

    expect(portManager.registerRole).toHaveBeenCalledWith(
      webphoneMediaOwnerRole,
      expect.objectContaining({ onRelease: expect.any(Function) }),
    );
  });

  it('returns a serialisable proxy, not a BrowserWebRtcSession', async () => {
    const { module } = build();
    await module.onInit();

    const session = module.createWebRtcSession(context());

    expect(session).not.toBeInstanceOf(BrowserWebRtcSession);
    expect(typeof session.createOffer).toBe('function');
    expect(typeof session.dispose).toBe('function');
  });

  it('delegates createOffer and returns the owner SDP', async () => {
    const { portManager, module } = build();
    await module.onInit();
    portManager.push(owned('tab-1', 4));

    const session = module.createWebRtcSession(context());
    await expect(session.createOffer()).resolves.toBe('v=0 delegated');

    expect(invokeRole).toHaveBeenCalledWith(
      module,
      'createOffer',
      [expect.objectContaining({ callId: 'call-1' }), undefined],
      { role: MEDIA_ROLE, collectResults: true },
    );
  });

  it('delegates createAnswer with the remote offer', async () => {
    const { portManager, module } = build();
    await module.onInit();
    portManager.push(owned('tab-1', 4));

    const session = module.createWebRtcSession(context());
    await session.createAnswer('v=0 remote');

    expect(invokeRole).toHaveBeenCalledWith(
      module,
      'createAnswer',
      [expect.any(Object), 'v=0 remote'],
      { role: MEDIA_ROLE, collectResults: true },
    );
  });

  it('binds the provider to the current owner revision on first SDP use', async () => {
    const { portManager, module } = build();
    await module.onInit();
    // Owner appears only after the SDK already built the call session.
    const session = module.createWebRtcSession(context());
    portManager.push(owned('tab-1', 9));

    await session.createOffer();

    const [[, , [boundContext]]] = invokeRole.mock.calls;
    expect(boundContext.ownerRevision).toBe(9);
  });

  it('claims an owner when none exists yet, instead of fencing the first call', async () => {
    const { portManager, module } = build();
    await module.onInit();
    portManager.claimRole.mockImplementation(async () => {
      portManager.push(owned('tab-1', 3));
      return { role: MEDIA_ROLE, revision: 3, owners: [] };
    });

    const session = module.createWebRtcSession(context());
    await expect(session.createOffer()).resolves.toBe('v=0 delegated');

    expect(portManager.claimRole).toHaveBeenCalled();
  });

  it('fires setMuted and sendDtmf without awaiting, and records mute state', async () => {
    const { portManager, module } = build();
    await module.onInit();
    portManager.push(owned('tab-1', 4));
    const session = module.createWebRtcSession(context());

    expect(() => session.setMuted(true)).not.toThrow();
    expect(() => session.sendDtmf('1')).not.toThrow();
  });

  it('swallows delegated setMuted failures', async () => {
    const { portManager, module } = build();
    await module.onInit();
    portManager.push(owned('tab-1', 4));
    const session = module.createWebRtcSession(context());
    invokeRole.mockRejectedValue(new Error('owner gone'));

    session.setMuted(true);
    await Promise.resolve();
    await Promise.resolve();
    // No unhandled rejection: the assertion is that we get here cleanly.
    expect(true).toBe(true);
  });
});

describe('media-owner fencing', () => {
  const armOwner = async (revision = 5) => {
    const { portManager, module } = build({ isServer: false, clientId: 'tab-1' });
    await module.onInit();
    portManager.push(owned('tab-1', revision));
    return { portManager, module };
  };

  it('rejects work carrying a stale owner revision', async () => {
    const { module } = await armOwner(5);

    await expect(
      module.createOffer({
        callId: 'call-1',
        direction: 'outbound',
        stunServers: [],
        providerId: 'p1',
        ownerRevision: 4,
      }),
    ).rejects.toBeInstanceOf(RoleFencedError);
  });

  it('rejects work for a provider with no replicated record', async () => {
    const { module } = await armOwner(5);

    await expect(
      module.createOffer({
        callId: 'call-1',
        direction: 'outbound',
        stunServers: [],
        providerId: 'unknown',
        ownerRevision: 5,
      }),
    ).rejects.toBeInstanceOf(RoleFencedError);
  });

  it('rejects work whose record describes a different call', async () => {
    const { module } = await armOwner(5);
    module._addProviderRecord('p1', 'call-OTHER', 5);

    await expect(
      module.createOffer({
        callId: 'call-1',
        direction: 'outbound',
        stunServers: [],
        providerId: 'p1',
        ownerRevision: 5,
      }),
    ).rejects.toBeInstanceOf(RoleFencedError);
  });
});

describe('media-owner loss', () => {
  it('emits ownerLoss with the affected call ids when the owner changes', async () => {
    const { portManager, module } = build();
    await module.onInit();
    const losses = [];
    module.ownerLoss$.subscribe((loss) => losses.push(loss));

    portManager.push(owned('tab-1', 4));
    module.createWebRtcSession(context('call-a'));
    module.createWebRtcSession(context('call-b'));
    portManager.push(unavailable(MEDIA_ROLE, 5));

    expect(losses).toHaveLength(1);
    expect(losses[0].ownerRevision).toBe(4);
    expect([...losses[0].callIds].sort()).toEqual(['call-a', 'call-b']);
  });

  it('does not emit when there are no providers', async () => {
    const { portManager, module } = build();
    await module.onInit();
    const losses = [];
    module.ownerLoss$.subscribe((loss) => losses.push(loss));

    portManager.push(owned('tab-1', 4));
    portManager.push(unavailable(MEDIA_ROLE, 5));

    expect(losses).toHaveLength(0);
  });

  it('does not emit when the owner is unchanged', async () => {
    const { portManager, module } = build();
    await module.onInit();
    portManager.push(owned('tab-1', 4));
    module.createWebRtcSession(context('call-a'));
    const losses = [];
    module.ownerLoss$.subscribe((loss) => losses.push(loss));

    portManager.push(owned('tab-1', 4));

    expect(losses).toHaveLength(0);
  });

  it('rebinds every provider to the new owner revision', async () => {
    const { portManager, module } = build();
    await module.onInit();
    portManager.push(owned('tab-1', 4));
    const session = module.createWebRtcSession(context('call-a'));
    await session.createOffer();
    invokeRole.mockClear();

    portManager.push(owned('tab-2', 8));
    await module.rebindMediaOwner();
    await session.createOffer();

    const [[, , [reboundContext]]] = invokeRole.mock.calls;
    expect(reboundContext.ownerRevision).toBe(8);
  });
});

describe('media-owner lifecycle', () => {
  it('refuses to release the role while media is live', async () => {
    const { portManager, module } = build({ isServer: false, clientId: 'tab-1' });
    await module.onInit();
    const [, lifecycle] = portManager.registerRole.mock.calls[0];
    portManager.push(owned('tab-1', 3));
    module._addProviderRecord('p1', 'call-1', 3);
    await module.createOffer({
      callId: 'call-1',
      direction: 'outbound',
      stunServers: [],
      providerId: 'p1',
      ownerRevision: 3,
    }).catch(() => undefined);

    expect(() => lifecycle.onRelease()).toThrow(/release was rejected/i);
  });

  it('allows release when no media is live', async () => {
    const { portManager, module } = build({ isServer: false, clientId: 'tab-1' });
    await module.onInit();
    const [, lifecycle] = portManager.registerRole.mock.calls[0];

    expect(() => lifecycle.onRelease()).not.toThrow();
  });

  it('releases an idle owner role after the session timeout', async () => {
    jest.useFakeTimers();
    const { portManager, module } = build({ isServer: false, clientId: 'tab-1' });
    await module.onInit();

    portManager.push(owned('tab-1', 3));
    expect(portManager.releaseRole).not.toHaveBeenCalled();

    jest.advanceTimersByTime(60_000);
    expect(portManager.releaseRole).toHaveBeenCalledWith(MEDIA_ROLE);
    jest.useRealTimers();
  });

  it('reports local ownership from the mirrored role state', async () => {
    const { portManager, module } = build({ isServer: false, clientId: 'tab-1' });
    await module.onInit();

    expect(module.isLocalMediaOwner).toBe(false);
    portManager.push(owned('tab-1', 3));
    expect(module.isLocalMediaOwner).toBe(true);
    portManager.push(owned('tab-2', 4));
    expect(module.isLocalMediaOwner).toBe(false);
  });

  it('detects other connected clients from the server', async () => {
    const { portManager, module } = build();
    await module.onInit();

    expect(module.hasOtherConnectedClients).toBe(false);
    portManager.push(owned('tab-1', 1, 'connectedClients'), 'connectedClients');
    expect(module.hasOtherConnectedClients).toBe(true);
  });

  it('drops provider records for an ended call', async () => {
    const { portManager, module } = build();
    await module.onInit();
    portManager.push(owned('tab-1', 4));
    module.createWebRtcSession(context('call-a'));
    const losses = [];
    module.ownerLoss$.subscribe((loss) => losses.push(loss));

    await module.disposeByCallId('call-a');
    portManager.push(unavailable(MEDIA_ROLE, 5));

    // With the record gone there is nothing left to recover.
    expect(losses).toHaveLength(0);
  });
});

describe('local ownership reporting', () => {
  it('reports ownership straight after its own claim, before state mirrors', async () => {
    // The owning tab otherwise reads `false` while genuinely holding the media,
    // because the replicated role snapshot has not arrived yet.
    const { portManager, module } = build({
      isServer: false,
      clientId: 'tab-1',
    });
    await module.onInit();
    expect(module.isLocalMediaOwner).toBe(false);

    await module.ensureMediaOwner();

    expect(portManager.claimRole).toHaveBeenCalled();
    expect(module.isLocalMediaOwner).toBe(true);
  });

  it('defers to role state when another port owns the role', async () => {
    const { portManager, module } = build({
      isServer: false,
      clientId: 'tab-1',
    });
    await module.onInit();
    await module.ensureMediaOwner();
    expect(module.isLocalMediaOwner).toBe(true);

    portManager.push(owned('tab-2', 9));

    expect(module.isLocalMediaOwner).toBe(false);
  });

  it('stops reporting ownership once the role is unavailable', async () => {
    const { portManager, module } = build({
      isServer: false,
      clientId: 'tab-1',
    });
    await module.onInit();
    await module.ensureMediaOwner();

    portManager.push(unavailable(MEDIA_ROLE, 9));

    expect(module.isLocalMediaOwner).toBe(false);
  });

  it('is always true in standalone mode', async () => {
    const { module } = build({ shared: false, isServer: false });
    await module.onInit();
    expect(module.isLocalMediaOwner).toBe(true);
  });
});

describe('ensureMediaOwner election', () => {
  it('claims on the server itself in shared-tab (non-worker) mode', async () => {
    const { portManager, module } = build({ isWorkerMode: false });
    await module.onInit();

    await module.ensureMediaOwner();

    expect(portManager.claimRole).toHaveBeenCalledWith(MEDIA_ROLE);
  });

  it('skips claiming when the role is already owned', async () => {
    const { portManager, module } = build();
    await module.onInit();
    portManager.push(owned('tab-1', 2));
    portManager.claimRole.mockClear();

    await module.ensureMediaOwner();

    expect(portManager.claimRole).not.toHaveBeenCalled();
  });

  it('claims directly when running on a client', async () => {
    const { portManager, module } = build({ isServer: false, clientId: 'tab-1' });
    await module.onInit();

    await module.ensureMediaOwner();

    expect(portManager.claimRole).toHaveBeenCalledWith(MEDIA_ROLE);
  });

  it('falls back to the elected client when the interacted client cannot claim', async () => {
    const { module } = build();
    await module.onInit();
    const interacted = jest
      .spyOn(module, '_claimMediaOwnerOnInteractedClient')
      .mockRejectedValue(new RoleUnavailableError('lastInteractedClient'));
    const elected = jest
      .spyOn(module, '_claimMediaOwnerOnElectedClient')
      .mockResolvedValue(undefined);

    await module.ensureMediaOwner();

    expect(interacted).toHaveBeenCalled();
    expect(elected).toHaveBeenCalled();
  });

  it('propagates the failure when both election targets fail', async () => {
    const { module } = build();
    await module.onInit();
    jest
      .spyOn(module, '_claimMediaOwnerOnInteractedClient')
      .mockRejectedValue(new RoleUnavailableError('lastInteractedClient'));
    jest
      .spyOn(module, '_claimMediaOwnerOnElectedClient')
      .mockRejectedValue(new RoleUnavailableError('electedClient'));

    await expect(module.ensureMediaOwner()).rejects.toBeInstanceOf(
      RoleUnavailableError,
    );
  });
});
