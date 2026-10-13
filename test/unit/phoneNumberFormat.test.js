jest.mock('@ringcentral-integration/micro-auth/src/app/services', () => ({
  AccountInfo: class AccountInfo {},
  ExtensionInfo: class ExtensionInfo {},
  RegionSettings: class RegionSettings {},
  NumberFormatter: class NumberFormatter {
    constructor(accountInfo, extensionInfo, regionSettings) {
      this._accountInfo = accountInfo;
      this._extensionInfo = extensionInfo;
      this._regionSettings = regionSettings;
    }

    get maxExtNumberLength() {
      return 6;
    }

    get isMultipleSiteEnabled() {
      return false;
    }

    formatNumber(phoneNumber = '', international = false) {
      return `${international ? 'international' : 'national'}:${phoneNumber}`;
    }
  },
}));

import { applyPhoneNumberFormatInput } from '../../src/app/services/PhoneNumberFormat/applyPhoneNumberFormatInput';
import { formatWithTemplate } from '../../src/app/services/PhoneNumberFormat/formatWithTemplate';
import { PhoneNumberFormat } from '../../src/app/services/PhoneNumberFormat/PhoneNumberFormat';
import { NumberFormatter } from '../../src/app/services/NumberFormatter/NumberFormatter';

const DEFAULT_SETTING = {
  formatType: 'national',
  template: '',
  readOnly: false,
  readOnlyReason: '',
};

describe('formatWithTemplate', () => {
  test('fills the template with digits from the right', () => {
    expect(formatWithTemplate('+16505550100', '(###) ###-####')).toBe(
      '(650) 555-0100',
    );
    expect(formatWithTemplate('+16505550100', '+* ***-***-****')).toBe(
      '+1 650-555-0100',
    );
  });

  test('hides the digits under x', () => {
    expect(formatWithTemplate('+16505550100', '(###) xxx-####')).toBe(
      '(650) xxx-0100',
    );
  });

  test('stops when the number runs out of digits', () => {
    expect(formatWithTemplate('5550100', '(###) ###-####')).toBe(
      '555-0100',
    );
  });

  test('returns an empty string without digits', () => {
    expect(formatWithTemplate('Anonymous', '(###) ###-####')).toBe('');
  });
});

describe('applyPhoneNumberFormatInput', () => {
  test.each(['national', 'international', 'e164'])(
    'accepts %s and keeps the current template',
    (formatType) => {
      expect(
        applyPhoneNumberFormatInput(
          { ...DEFAULT_SETTING, template: '(###) ###-####' },
          { formatType, template: 'ignored' },
        ),
      ).toEqual({
        setting: {
          ...DEFAULT_SETTING,
          formatType,
          template: '(###) ###-####',
        },
      });
    },
  );

  test('accepts a custom template of 10 to 15 digit placeholders', () => {
    expect(
      applyPhoneNumberFormatInput(DEFAULT_SETTING, {
        formatType: 'custom',
        template: ' (###) xxx-#### ',
      }),
    ).toEqual({
      setting: {
        ...DEFAULT_SETTING,
        formatType: 'custom',
        template: '(###) xxx-####',
      },
    });
  });

  test.each([
    [{ formatType: 'local' }, 'invalidPhoneNumberFormatType'],
    [{}, 'invalidPhoneNumberFormatType'],
    [{ formatType: 'custom' }, 'customPhoneNumberFormatTemplateRequired'],
    [
      { formatType: 'custom', template: '   ' },
      'customPhoneNumberFormatTemplateRequired',
    ],
    [
      { formatType: 'custom', template: '###-####' },
      'customPhoneNumberFormatTemplateLengthInvalid',
    ],
    [
      { formatType: 'custom', template: '################' },
      'customPhoneNumberFormatTemplateLengthInvalid',
    ],
  ])('refuses %j', (input, error) => {
    expect(applyPhoneNumberFormatInput(DEFAULT_SETTING, input)).toEqual({
      error,
    });
  });

  test('changes the lock only when readOnly is a boolean', () => {
    const locked = {
      ...DEFAULT_SETTING,
      readOnly: true,
      readOnlyReason: 'Set by admin',
    };

    expect(
      applyPhoneNumberFormatInput(locked, { formatType: 'e164' }).setting,
    ).toMatchObject({ readOnly: true, readOnlyReason: 'Set by admin' });
    expect(
      applyPhoneNumberFormatInput(locked, {
        formatType: 'e164',
        readOnly: false,
      }).setting,
    ).toMatchObject({ readOnly: false, readOnlyReason: '' });
    expect(
      applyPhoneNumberFormatInput(DEFAULT_SETTING, {
        formatType: 'e164',
        readOnly: true,
        readOnlyReason: 'Set by admin',
      }).setting,
    ).toMatchObject({ readOnly: true, readOnlyReason: 'Set by admin' });
  });
});

describe('PhoneNumberFormat', () => {
  function createService() {
    const storage = { enable: jest.fn() };
    const toast = { warning: jest.fn() };
    return { service: new PhoneNumberFormat(storage, toast), storage, toast };
  }

  test('stores the setting and starts with the national format', () => {
    const { service, storage } = createService();

    expect(storage.enable).toHaveBeenCalledWith(service);
    expect(service.setting).toEqual(DEFAULT_SETTING);
  });

  test('applies a valid change', async () => {
    const { service, toast } = createService();

    await expect(
      service.updateSetting({ formatType: 'international' }),
    ).resolves.toBe(true);

    expect(service.setting.formatType).toBe('international');
    expect(toast.warning).not.toHaveBeenCalled();
  });

  test('keeps the setting and warns on an invalid change', async () => {
    const { service, toast } = createService();

    await expect(
      service.updateSetting({ formatType: 'custom', template: '###' }),
    ).resolves.toBe(false);

    expect(service.setting).toEqual(DEFAULT_SETTING);
    expect(toast.warning).toHaveBeenCalledWith({
      message: 'customPhoneNumberFormatTemplateLengthInvalid',
    });
  });
});

describe('NumberFormatter with the phone number format', () => {
  function createFormatter(setting) {
    return new NumberFormatter(
      {},
      { site: null },
      { areaCode: '', countryCode: 'US' },
      { setting: { ...DEFAULT_SETTING, ...setting } },
    );
  }

  test('keeps the default format for national', () => {
    expect(createFormatter().formatNumber('+16505550100')).toBe(
      'national:+16505550100',
    );
  });

  test('formats every number internationally for international', () => {
    expect(
      createFormatter({ formatType: 'international' }).formatNumber(
        '+16505550100',
      ),
    ).toBe('international:+16505550100');
  });

  test('keeps an explicit international request whatever the setting', () => {
    expect(
      createFormatter({
        formatType: 'custom',
        template: '(###) ###-####',
      }).formatNumber('+16505550100', true),
    ).toBe('international:+16505550100');
  });

  test('formats as E.164 for e164', () => {
    expect(
      createFormatter({ formatType: 'e164' }).formatNumber('(650) 555-0100'),
    ).toBe('+16505550100');
  });

  test('applies a custom template to full numbers only', () => {
    const formatter = createFormatter({
      formatType: 'custom',
      template: '(###) xxx-####',
    });

    expect(formatter.formatNumber('+16505550100')).toBe('(650) xxx-0100');
    expect(formatter.formatNumber('101')).toBe('national:101');
  });

  test('formats an example in a given format whatever the setting is', () => {
    const formatter = createFormatter();

    expect(
      formatter.formatNumberWithType(
        '+16505550100',
        'custom',
        '###.###.####',
      ),
    ).toBe('650.555.0100');
  });

  test('gives new formatting params when the setting changes', () => {
    const phoneNumberFormat = { setting: DEFAULT_SETTING };
    const formatter = new NumberFormatter(
      {},
      { site: null },
      { areaCode: '650', countryCode: 'US' },
      phoneNumberFormat,
    );

    expect(formatter.formattingParams).toEqual({
      areaCode: '650',
      countryCode: 'US',
      isMultipleSiteEnabled: false,
      maxExtensionLength: 6,
      siteCode: '',
    });
  });
});
