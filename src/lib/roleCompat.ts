/**
 * Compatibility shims over `@ringcentral-integration/next-core`'s role delegation.
 *
 * The installed `next-core` build predates the role-delegation improvements that
 * landed alongside the SharedWorker webphone upstream, so three capabilities the
 * media bridge depends on are missing here. Everything in this file exists purely
 * to bridge that gap and should be deleted once `next-core-release` catches up:
 *
 * 1. `PortManager.invokeRole` returns `undefined` for a plain singleton
 *    invocation, so `@delegateRole` cannot carry a return value. The media bridge
 *    needs SDP strings back from `createOffer`/`createAnswer`.
 * 2. `claimRole` accepts only a role id, so a role must be registered first, and
 *    `registerRole` throws when called twice.
 * 3. There is no `getRoleState` / `isLocalRoleOwner` helper.
 */
import {
  invokeRole,
  type PortManager,
  type RoleDefinition,
  type RoleId,
  type RoleInvocationResult,
  type RoleLifecycle,
  type RoleRegistrationResult,
  type RoleState,
} from '@ringcentral-integration/next-core';

/**
 * Sentinel `next-core` uses for the server in role owner lists. It is not
 * exported, so it is mirrored here.
 */
export const SERVER_ROLE_OWNER = 'server';

type RolePortManager = Pick<
  PortManager,
  'clientId' | 'isClient' | 'registerRole' | 'claimRole' | 'getRoleStateStreams'
>;

export const unavailableRoleState = (role: RoleId): RoleState => ({
  phase: 'unavailable',
  role,
  revision: 0,
  owners: [],
});

/** Id this port appears under in a role's owner list. */
export const localRoleOwnerId = (portManager: RolePortManager) =>
  portManager.isClient ? portManager.clientId : SERVER_ROLE_OWNER;

/** Whether this port currently owns the role described by `state`. */
export const isLocalRoleOwner = (
  portManager: RolePortManager,
  state?: RoleState,
) => {
  if (state?.phase !== 'owned') return false;
  const ownerId = localRoleOwnerId(portManager);
  if (!ownerId) return false;
  return state.owners.some((owner) => owner.clientId === ownerId);
};

/**
 * Keeps the latest `RoleState` for one role readable synchronously.
 *
 * `next-core` only exposes `roleState$`. It happens to be a `BehaviorSubject` at
 * runtime, but the declared type is `Observable`, so this mirrors the stream
 * rather than casting and reading `.value`.
 */
export class RoleStateMirror {
  private _state: RoleState;

  private _subscription?: { unsubscribe(): void };

  constructor(
    portManager: RolePortManager,
    private readonly _role: RoleId,
    onChange?: (state: RoleState, previous: RoleState) => void,
  ) {
    this._state = unavailableRoleState(_role);
    const { roleState$ } = portManager.getRoleStateStreams(_role);
    this._subscription = roleState$.subscribe((state) => {
      const previous = this._state;
      this._state = state;
      onChange?.(state, previous);
    });
  }

  get role() {
    return this._role;
  }

  get state() {
    return this._state;
  }

  get revision() {
    return this._state.revision;
  }

  dispose() {
    this._subscription?.unsubscribe();
    this._subscription = undefined;
  }
}

const REGISTRATIONS = new WeakMap<object, Map<RoleId, Promise<void>>>();

const registrationsFor = (portManager: object) => {
  let registrations = REGISTRATIONS.get(portManager);
  if (!registrations) {
    registrations = new Map();
    REGISTRATIONS.set(portManager, registrations);
  }
  return registrations;
};

const isAlreadyRegistered = (error: unknown) =>
  /already registered locally/i.test((error as Error)?.message ?? '');

const isRegistrationLost = (error: unknown) => {
  const name = (error as Error)?.name;
  return (
    name === 'RoleNotRegisteredError' || name === 'RoleDefinitionMismatchError'
  );
};

/**
 * Registers a role at most once per `PortManager`.
 *
 * `registerRole` throws on a repeat call, so the in-flight promise is memoised
 * and a "already registered locally" rejection is treated as success.
 */
export const registerRoleOnce = (
  portManager: RolePortManager,
  definition: RoleDefinition,
  lifecycle: RoleLifecycle = {},
): Promise<void> => {
  const registrations = registrationsFor(portManager);
  const existing = registrations.get(definition.role);
  if (existing) return existing;
  const registration = portManager
    .registerRole(definition, lifecycle)
    .then(() => undefined)
    .catch((error: unknown) => {
      if (isAlreadyRegistered(error)) return undefined;
      // Let the next attempt retry rather than caching the failure.
      registrations.delete(definition.role);
      throw error;
    });
  registrations.set(definition.role, registration);
  return registration;
};

/** Forgets the memoised registration so the role is registered again on demand. */
export const resetRoleRegistration = (
  portManager: RolePortManager,
  role: RoleId,
) => {
  registrationsFor(portManager).delete(role);
};

/**
 * `claimRole(RoleDefinition)` equivalent: register the role, then claim it.
 *
 * The two steps are not atomic here, so a port recycled in between surfaces as
 * `RoleNotRegisteredError`. That case re-registers and retries once.
 */
export const claimRoleCompat = async (
  portManager: RolePortManager,
  definition: RoleDefinition,
  lifecycle: RoleLifecycle = {},
): Promise<RoleRegistrationResult> => {
  await registerRoleOnce(portManager, definition, lifecycle);
  try {
    return await portManager.claimRole(definition.role);
  } catch (error) {
    if (!isRegistrationLost(error)) throw error;
    resetRoleRegistration(portManager, definition.role);
    await registerRoleOnce(portManager, definition, lifecycle);
    return portManager.claimRole(definition.role);
  }
};

const isInvocationResultList = (
  value: unknown,
): value is RoleInvocationResult[] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      !!entry &&
      typeof entry === 'object' &&
      typeof (entry as RoleInvocationResult).clientId === 'string' &&
      ((entry as RoleInvocationResult).status === 'fulfilled' ||
        (entry as RoleInvocationResult).status === 'rejected'),
  );

/** Pulls the most specific error out of a `RoleAggregateError`. */
const unwrapRoleError = (error: unknown): unknown => {
  if ((error as Error)?.name !== 'RoleAggregateError') return error;
  const aggregate = error as {
    errors?: unknown[];
    results?: RoleInvocationResult[];
  };
  const [first] = aggregate.errors ?? [];
  if (first) return first;
  const rejected = aggregate.results?.find(
    (result) => result.status === 'rejected',
  );
  return rejected?.reason ?? error;
};

/**
 * Invokes a role-delegated method and returns the owner's value.
 *
 * `@delegateRole` discards return values in this `next-core` build, so the
 * imperative `invokeRole` is used with `collectResults: true`, which does return
 * the per-owner results. Roles used this way are `allowMultiple: false`, so there
 * is exactly one owner.
 */
export const invokeRoleForValue = async <T>(
  module: object,
  method: string,
  args: unknown[],
  role: RoleId,
): Promise<T> => {
  let raw: unknown;
  try {
    raw = await invokeRole(
      module as Record<string, never>,
      method as never,
      args as never,
      { role, collectResults: true },
    );
  } catch (error) {
    throw unwrapRoleError(error);
  }
  // Standalone / no-container path returns the method's value directly.
  if (!isInvocationResultList(raw)) return raw as T;
  const fulfilled = raw.find((result) => result.status === 'fulfilled');
  if (fulfilled) return fulfilled.value as T;
  const rejected = raw.find((result) => result.status === 'rejected');
  if (rejected) throw unwrapRoleError(rejected.reason);
  throw new Error(`Role '${role}' returned no result for '${method}'.`);
};
