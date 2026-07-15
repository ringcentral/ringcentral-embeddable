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

  _ignoreModuleReadiness() {}
}

class RcViewModule extends RcModule {}

const useConnector = jest.fn((module, selector) => {
  if (typeof selector === 'function') {
    return selector(module);
  }
  return typeof module === 'function' ? module() : module;
});
const watch = jest.fn(() => jest.fn());
const { matchPath } = jest.requireActual('react-router');

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
  state: directDecorator,
  storage: directDecorator,
  useConnector,
  useContainer: jest.fn(),
  userStorage: directDecorator,
  watch,
};
