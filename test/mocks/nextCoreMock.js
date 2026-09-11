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
    this.logger = { error: jest.fn(), warn: jest.fn() };
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

module.exports = {
  PortManager: class PortManager {},
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
