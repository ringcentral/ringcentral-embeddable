const directDecorator = (_target, _key, descriptor) => descriptor;
const methodDecorator = () => directDecorator;

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

module.exports = {
  PortManager: class PortManager {},
  RcModule,
  RcViewModule,
  RouterPlugin: class RouterPlugin {},
  StoragePlugin: class StoragePlugin {},
  action: directDecorator,
  computed: methodDecorator,
  delegate: methodDecorator,
  globalStorage: directDecorator,
  inject: () => () => {},
  injectable: () => (target) => target,
  optional: () => () => {},
  state: directDecorator,
  storage: directDecorator,
  useConnector,
  userStorage: directDecorator,
  watch,
};
