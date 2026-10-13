const { AppFeatures } = require('../../src/app/services/AppFeatures');

const canSendFax = Object.getOwnPropertyDescriptor(
  AppFeatures.prototype,
  'canSendFax',
).get;

describe('AppFeatures.canSendFax', () => {
  test.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false],
  ])(
    'with FaxSending %s and Faxes scope %s returns %s',
    (hasSendFaxPermission, hasFaxesScope, expected) => {
      expect(canSendFax.call({ hasSendFaxPermission, hasFaxesScope })).toBe(
        expected,
      );
    },
  );
});
