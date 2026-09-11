require('reflect-metadata');

jest.mock('@ringcentral-integration/core/lib/usm-redux/utils', () => {
  const actual = jest.requireActual(
    '@ringcentral-integration/core/lib/usm-redux/utils',
  );
  return {
    ...actual,
    setStagedState(value) {
      actual.setStagedState(value);
      actual.setStagedModule(value === undefined ? undefined : 'root');
    },
  };
});

const { RcModuleV2 } = require('@ringcentral-integration/core');

Object.defineProperty(RcModuleV2.prototype, '_modulePath', {
  configurable: true,
  value: 'root',
  writable: true,
});

const RcModule = require('@ringcentral-integration/commons/lib/RcModule').default;

Object.defineProperty(RcModule.prototype, '_modulePath', {
  configurable: true,
  value: 'root',
  writable: true,
});
