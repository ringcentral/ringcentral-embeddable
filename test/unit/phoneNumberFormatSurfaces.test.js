import React from 'react';
import { act, render } from '@testing-library/react';

import { PhoneNumberFormatSettingView } from '../../src/app/views/PhoneNumberFormatSettingView/PhoneNumberFormatSetting.view';
import { SmsOptOut } from '../../src/app/services/SmsOptOut/SmsOptOut';

let mockPanelProps;

jest.mock(
  '../../src/app/views/ThirdPartySettingSectionView/ThirdPartySettingSectionPanel',
  () => ({
    ThirdPartySettingSectionPanel: (props) => {
      mockPanelProps = props;
      return null;
    },
  }),
);

jest.mock('@ringcentral-integration/micro-message/src/app/services', () => ({
  SmsOptOut: class SmsOptOut {
    constructor(client, auth, numberFormatter) {
      this._numberFormatter = numberFormatter;
    }
  },
}));

jest.mock(
  '@ringcentral-integration/micro-auth/src/app/services/AppFeatures',
  () => ({ AppFeatures: class AppFeatures {} }),
);

const DEFAULT_SETTING = {
  formatType: 'national',
  template: '',
  readOnly: false,
  readOnlyReason: '',
};

function createSettingView(setting = DEFAULT_SETTING) {
  const phoneNumberFormat = {
    setting,
    updateSetting: jest.fn(async () => true),
  };
  const numberFormatter = {
    formattingParams: {},
    formatNumberWithType: jest.fn(
      (phoneNumber, formatType) => `${formatType}:${phoneNumber}`,
    ),
  };
  const router = { goBack: jest.fn() };
  const view = new PhoneNumberFormatSettingView(
    phoneNumberFormat,
    numberFormatter,
    { mainCompanyNumber: '+16505550100' },
    { currentLocale: 'en-US' },
    router,
  );
  return { view, numberFormatter, phoneNumberFormat, router };
}

describe('PhoneNumberFormatSettingView', () => {
  // i18n returns the key in tests, so an example reads `example`.
  test('lists every format with an example from the company number', () => {
    const { view, numberFormatter } = createSettingView();
    const [formatItem, templateItem] = view.section.items;

    expect(formatItem).toMatchObject({
      id: 'formatType',
      type: 'option',
      value: 'national',
      readOnly: false,
    });
    expect(formatItem.options).toEqual([
      expect.objectContaining({ id: 'national', description: 'example' }),
      expect.objectContaining({ id: 'international', description: 'example' }),
      expect.objectContaining({ id: 'e164', description: 'example' }),
      // A custom example needs a template.
      expect.objectContaining({ id: 'custom', description: '' }),
    ]);
    expect(numberFormatter.formatNumberWithType.mock.calls).toEqual([
      ['+16505550100', 'national', ''],
      ['+16505550100', 'international', ''],
      ['+16505550100', 'e164', ''],
    ]);
    expect(templateItem).toMatchObject({
      id: 'template',
      type: 'string',
      required: true,
      showWhen: { formatType: { value: 'custom', operator: 'equal' } },
    });
  });

  test('shows the saved template and the host lock', () => {
    const { view, numberFormatter } = createSettingView({
      formatType: 'custom',
      template: '(###) xxx-####',
      readOnly: true,
      readOnlyReason: 'Set by admin',
    });
    const [formatItem, templateItem] = view.section.items;

    expect(formatItem).toMatchObject({
      value: 'custom',
      readOnly: true,
      readOnlyReason: 'Set by admin',
    });
    expect(formatItem.options[3].description).toBe('example');
    expect(numberFormatter.formatNumberWithType).toHaveBeenCalledWith(
      '+16505550100',
      'custom',
      '(###) xxx-####',
    );
    expect(templateItem).toMatchObject({
      value: '(###) xxx-####',
      readOnly: true,
      readOnlyReason: 'Set by admin',
    });
  });

  test('saves the picked format and goes back on back', async () => {
    const { view, phoneNumberFormat, router } = createSettingView();
    const Component = () => view.component();
    render(<Component />);

    await act(async () => {
      await mockPanelProps.onSave({
        ...mockPanelProps.section,
        items: [
          { id: 'formatType', value: 'custom' },
          { id: 'template', value: '(###) ###-####' },
        ],
      });
    });
    mockPanelProps.onBack();

    expect(phoneNumberFormat.updateSetting).toHaveBeenCalledWith({
      formatType: 'custom',
      template: '(###) ###-####',
    });
    expect(router.goBack).toHaveBeenCalled();
  });
});

describe('SmsOptOut keys', () => {
  test('keys opt-outs by normalized numbers, whatever the shown format', () => {
    const numberFormatter = {
      normalizeNumber: jest.fn((phoneNumber) =>
        phoneNumber === 'unknown' ? '' : `+1${phoneNumber.replace(/\D/g, '')}`,
      ),
    };
    const smsOptOut = new SmsOptOut({}, {}, numberFormatter, {}, {});

    expect(
      smsOptOut.getOptOutKey({ from: '(650) 555-0100', to: '6505550199' }),
    ).toBe('+16505550100__+16505550199');
    expect(
      smsOptOut.getOptOutKey({ from: '6505550199', to: '(650) 555-0100' }),
    ).toBe('+16505550100__+16505550199');
    expect(smsOptOut.getOptOutKey({ from: 'unknown', to: '6505550199' })).toBe(
      '+16505550199__unknown',
    );
  });
});
