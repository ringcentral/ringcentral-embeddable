const { formatTypes } = require('@ringcentral-integration/phone-number');
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

const { PhoneNumberFormat } = require('../../src/modules/PhoneNumberFormat');

function createFormatter(overrides = {}) {
  const formatter = Object.create(PhoneNumberFormat.prototype);
  Object.assign(formatter, {
    _defaultFormatter: jest.fn(({ phoneNumber, type }) => `${type}:${phoneNumber}`),
    _deps: {
      alert: {
        warning: jest.fn(),
      },
    },
    formatType: 'national',
    readOnly: false,
    readOnlyReason: '',
    template: '',
    ...overrides,
  });
  return formatter;
}

function createParam(overrides = {}) {
  return {
    areaCode: '650',
    countryCode: 'US',
    international: false,
    isEDPEnabled: false,
    isMultipleSiteEnabled: false,
    maxExtensionLength: 6,
    phoneNumber: '+16505550100',
    removeExtension: false,
    siteCode: '',
    ...overrides,
  };
}

describe('PhoneNumberFormat module', () => {
  beforeEach(() => {
    setStagedState({});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('sets state and formats phone numbers by selected type', () => {
    const formatter = createFormatter();

    formatter.setFormatType('e164');
    formatter.setTemplate('(###) ###-####');
    formatter.setReadOnly(true, 'Managed by admin');

    expect(formatter.formatType).toBe('e164');
    expect(formatter.template).toBe('(###) ###-####');
    expect(formatter.readOnly).toBe(true);
    expect(formatter.readOnlyReason).toBe('Managed by admin');

    expect(formatter.format(createParam())).toBe(`${formatTypes.e164}:+16505550100`);
    expect(formatter.formatWithType(createParam(), 'international')).toBe(
      `${formatTypes.international}:+16505550100`,
    );
    expect(formatter.formatWithType(createParam({ international: true }), 'national')).toBe(
      `${formatTypes.international}:+16505550100`,
    );
    expect(formatter.formatWithType(createParam(), 'national')).toBe(
      `${formatTypes.local}:+16505550100`,
    );
    expect(formatter.supportedFormats.map((item) => item.id)).toEqual([
      'national',
      'international',
      'e164',
      'custom',
    ]);
  });

  it('formats with custom templates and falls back on formatter errors', () => {
    const formatter = createFormatter({
      _defaultFormatter: jest.fn(() => {
        throw new Error('format failed');
      }),
      formatType: 'custom',
      template: '+# (###) xxx-####',
    });

    expect(formatter.formatWithTemplate(createParam({ phoneNumber: '' }), '###')).toBe('');
    expect(formatter.formatWithTemplate(
      createParam({ phoneNumber: '+1 (650) 555-0100' }),
      '+# (###) xxx-####',
    )).toBe('+1 (650) xxx-0100');
    expect(formatter.format(createParam())).toBe('+1 (650) xxx-0100');
    expect(formatter.formatWithType(createParam(), 'e164')).toBe('+16505550100');
    expect(console.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('validates persisted settings before applying them', () => {
    const formatter = createFormatter();

    formatter.setSetting({ formatType: 'unknown', template: '' });
    expect(formatter._deps.alert.warning).toHaveBeenCalledWith({
      message: 'invalidPhoneNumberFormatType',
    });
    expect(formatter.formatType).toBe('national');

    formatter.setSetting({ formatType: 'custom', template: '' });
    expect(formatter._deps.alert.warning).toHaveBeenCalledWith({
      message: 'customPhoneNumberFormatTemplateRequired',
    });

    formatter.setSetting({ formatType: 'custom', template: '###' });
    expect(formatter._deps.alert.warning).toHaveBeenCalledWith({
      message: 'customPhoneNumberFormatTemplateLengthInvalid',
    });

    formatter.setSetting({
      formatType: 'custom',
      readOnly: true,
      readOnlyReason: 'Policy',
      template: '+# (###) ###-####',
    });
    expect(formatter.formatType).toBe('custom');
    expect(formatter.template).toBe('+# (###) ###-####');
    expect(formatter.readOnly).toBe(true);
    expect(formatter.readOnlyReason).toBe('Policy');

    formatter.setSetting({
      formatType: 'international',
      template: '',
    });
    expect(formatter.formatType).toBe('international');
    expect(formatter.template).toBe('+# (###) ###-####');
  });
});
