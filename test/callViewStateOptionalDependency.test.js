jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({ CallViewState: class CallViewStateBase {} }),
);

const nextCore = require('@ringcentral-integration/next-core');

const optionalSpy = jest
  .spyOn(nextCore, 'optional')
  .mockImplementation(() => () => {});

require('../src/app/services/CallViewState/CallViewState');

describe('CallViewState optional dependencies', () => {
  afterAll(() => {
    optionalSpy.mockRestore();
  });

  test('re-declares CallLogTasks as optional on the subclass', () => {
    // The container throws "No matching bindings found for serviceIdentifier:
    // CallLogTasks" if this tag is missing, because embeddable never registers
    // a CallLogTasks provider.
    expect(optionalSpy).toHaveBeenCalledTimes(1);
    expect(optionalSpy).toHaveBeenCalledWith();
  });
});
