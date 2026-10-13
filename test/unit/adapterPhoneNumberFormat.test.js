jest.mock('@ringcentral-integration/micro-phone/src/app/views', () => ({
  DialerView: class DialerView {},
}));
jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/services',
  () => ({
    CallViewState: class CallViewState {},
  }),
);
jest.mock('../../src/app/views/SideWidgetView', () => ({
  SideWidgetView: class SideWidgetView {},
}));
jest.mock('../../src/app/services/SmartNotes', () => ({
  SmartNotes: class SmartNotes {},
}));

const { Adapter } = require('../../src/app/services/Adapter');

function createAdapter(overrides = {}) {
  const adapter = Object.create(Adapter.prototype);
  adapter._postMessage = jest.fn();
  Object.assign(adapter, overrides);
  return adapter;
}

describe('Adapter phone number format', () => {
  test('passes the host format, template, and lock to the setting', () => {
    const updateSetting = jest.fn(async () => true);
    const adapter = createAdapter({ _phoneNumberFormat: { updateSetting } });

    adapter._onSetPhoneNumberFormat({
      type: 'rc-adapter-set-phone-number-format',
      formatType: 'custom',
      template: '(###) ###-####',
      readOnly: true,
      readOnlyReason: 'Set by admin',
    });

    expect(updateSetting).toHaveBeenCalledWith({
      formatType: 'custom',
      template: '(###) ###-####',
      readOnly: true,
      readOnlyReason: 'Set by admin',
    });
  });

  test('notifies the host of the format, with the template only for custom', () => {
    const phoneNumberFormat = {
      setting: { formatType: 'custom', template: '(###) ###-####' },
    };
    const adapter = createAdapter({ _phoneNumberFormat: phoneNumberFormat });

    adapter._notifyPhoneNumberFormatSettings();
    phoneNumberFormat.setting = {
      formatType: 'international',
      template: '(###) ###-####',
    };
    adapter._notifyPhoneNumberFormatSettings();

    expect(adapter._postMessage.mock.calls).toEqual([
      [
        {
          type: 'rc-adapter-phone-number-format-settings-notify',
          formatType: 'custom',
          template: '(###) ###-####',
        },
      ],
      [
        {
          type: 'rc-adapter-phone-number-format-settings-notify',
          formatType: 'international',
          template: '',
        },
      ],
    ]);
    expect(adapter._watchPhoneNumberFormatSettingsValues()).toEqual([
      'international',
      '(###) ###-####',
    ]);
  });

  test('names an SMS recipient with the masked number only when digits are hidden', () => {
    const formatNumber = jest.fn((phoneNumber) =>
      phoneNumber === '+16505550100' ? '(650) xxx-0100' : '(650) 555-0199',
    );
    const adapter = createAdapter({ _numberFormatter: { formatNumber } });

    expect(adapter._getRecipientName('+16505550100')).toBe('(650) xxx-0100');
    expect(adapter._getRecipientName('+16505550199')).toBe('+16505550199');
    expect(
      createAdapter()._getRecipientName('+16505550100'),
    ).toBe('+16505550100');
  });
});
