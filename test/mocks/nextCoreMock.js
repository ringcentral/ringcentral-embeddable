const directDecorator = (_target, _key, descriptor) => descriptor;
const methodDecorator = () => directDecorator;
const nameKey = Symbol('name');
const injectable = (options = {}) => (target) => {
  if (typeof options.name === 'string') {
    Object.defineProperty(target.prototype, nameKey, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: options.name,
    });
  }
  return target;
};

class RcModule {
  constructor() {
    this.status = 'pending';
    this.logger = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };
    this.ignoredModules = [];
  }

  get ready() {
    return this.status === 'ready';
  }

  _shouldInit() {
    return true;
  }

  _shouldReset() {
    return false;
  }

  _ignoreModuleReadiness(module) {
    this.ignoredModules.push(module);
  }
}

class RcViewModule extends RcModule {}

const useConnector = jest.fn((module, selector) => {
  if (typeof selector === 'function') {
    return selector(module);
  }
  return typeof module === 'function' ? module() : module;
});
const watch = jest.fn(() => jest.fn());
const { matchPath } = jest.requireActual('react-router-dom');

// Role delegation. The app code branches on `instanceof` / `error.name`, so these
// have to be real Error subclasses rather than plain objects.
const roleError = (name, template) =>
  class extends Error {
    constructor(role) {
      super(template(role));
      this.name = name;
    }
  };

const RoleUnavailableError = roleError(
  'RoleUnavailableError',
  (role) => `Role '${role}' has no available owner.`,
);
const RoleNotRegisteredError = roleError(
  'RoleNotRegisteredError',
  (role) => `Role '${role}' is not registered locally.`,
);
const RoleDefinitionMismatchError = roleError(
  'RoleDefinitionMismatchError',
  (role) => `Role '${role}' definition does not match the coordinator.`,
);
const RoleReleaseRejectedError = roleError(
  'RoleReleaseRejectedError',
  (role) => `Role '${role}' release was rejected by its current owner.`,
);
const RoleInvocationTimeoutError = roleError(
  'RoleInvocationTimeoutError',
  (role) => `Role '${role}' invocation exceeded the coordinator deadline.`,
);
const RoleFencedError = roleError(
  'RoleFencedError',
  (role) => `Role '${role}' ownership is stale.`,
);
const RoleSourceNotOwnerError = roleError(
  'RoleSourceNotOwnerError',
  (role) => `The invoking client does not own role '${role}'.`,
);

class RoleAggregateError extends AggregateError {
  constructor(errors, results) {
    super(errors, 'One or more role invocations failed.');
    this.name = 'RoleAggregateError';
    this.results = results;
  }
}

const systemRoles = {
  server: { role: 'server', allowMultiple: false, autoElect: false },
  connectedClients: {
    role: 'connectedClients',
    allowMultiple: true,
    autoElect: false,
  },
  electedClient: {
    role: 'electedClient',
    allowMultiple: false,
    autoElect: true,
  },
  all: { role: 'all', allowMultiple: true, autoElect: false },
};

const roleInvocationMarker = '__rc_role_invocation__';
const isRoleInvocation = (value) =>
  !!value && typeof value === 'object' && value.marker === roleInvocationMarker;

module.exports = {
  PortManager: class PortManager {},
  delegateRole: methodDecorator,
  executeRoleMethod: jest.fn(),
  // Tests that exercise role delegation override this per case.
  invokeRole: jest.fn(async () => undefined),
  isRoleInvocation,
  roleInvocationMarker,
  roleDeadline: 65_000,
  systemRoles,
  RoleAggregateError,
  RoleDefinitionMismatchError,
  RoleFencedError,
  RoleInvocationTimeoutError,
  RoleNotRegisteredError,
  RoleReleaseRejectedError,
  RoleSourceNotOwnerError,
  RoleUnavailableError,
  RcModule,
  RcViewModule,
  RouterPlugin: class RouterPlugin {},
  StoragePlugin: class StoragePlugin {},
  applyMethod: jest.fn(),
  createSharedApp: jest.fn(async (config) => config),
  action: directDecorator,
  computed: methodDecorator,
  delegate: methodDecorator,
  dynamic: methodDecorator,
  fromWatchValue: jest.fn(),
  Initiator: class Initiator {},
  getRef: jest.fn((module) => ({
    identifier: module?.identifier,
    modules: module?.modules,
  })),
  globalStorage: directDecorator,
  inject: () => () => {},
  injectable,
  matchPath,
  nameKey,
  optional: () => () => {},
  portal: directDecorator,
  state: directDecorator,
  storage: directDecorator,
  // A pass-through rxjs operator; app teardown is not modelled in tests.
  takeUntilAppDestroy: (source) => source,
  useConnector,
  useContainer: jest.fn(),
  userStorage: directDecorator,
  watch,
};
