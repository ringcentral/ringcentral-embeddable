import {
  AccountInfo,
  NumberFormatter as NumberFormatterBase,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import {
  computed,
  injectable,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import type { NumberFormatter } from '../../services/NumberFormatter';
import {
  PhoneNumberFormat,
  type PhoneNumberFormatType,
} from '../../services/PhoneNumberFormat';
import type { ThirdPartySetting } from '../../services/ThirdParty/ThirdParty.interface';
import { ThirdPartySettingSectionPanel } from '../ThirdPartySettingSectionView/ThirdPartySettingSectionPanel';

import { t } from './i18n';

const FORMAT_TYPES: readonly PhoneNumberFormatType[] = [
  'national',
  'international',
  'e164',
  'custom',
];

const TEMPLATE_PLACEHOLDER = '(###) ###-####';

/**
 * The phone number format settings page from 3.x, built on the settings
 * section form.
 */
@injectable({
  name: 'PhoneNumberFormatSettingView',
})
export class PhoneNumberFormatSettingView extends RcViewModule {
  constructor(
    private readonly _phoneNumberFormat: PhoneNumberFormat,
    private readonly _numberFormatter: NumberFormatterBase,
    private readonly _accountInfo: AccountInfo,
    private readonly _locale: Locale,
    private readonly _router: RouterPlugin,
  ) {
    super();
  }

  private _getExample(formatType: PhoneNumberFormatType, template: string) {
    const phoneNumber = this._accountInfo.mainCompanyNumber;
    if (!phoneNumber || (formatType === 'custom' && !template)) {
      return '';
    }
    const example = (
      this._numberFormatter as NumberFormatter
    ).formatNumberWithType(phoneNumber, formatType, template);
    return example ? t('example', { example }) : '';
  }

  /** Kept stable between renders, since the form resets on a new section. */
  @computed((that: PhoneNumberFormatSettingView) => [
    that._phoneNumberFormat.setting,
    that._numberFormatter.formattingParams,
    that._accountInfo.mainCompanyNumber,
    that._locale.currentLocale,
  ])
  get section(): ThirdPartySetting {
    const { formatType, template, readOnly, readOnlyReason } =
      this._phoneNumberFormat.setting;
    return {
      id: 'phoneNumberFormat',
      name: t('phoneNumberFormat'),
      type: 'section',
      items: [
        {
          id: 'formatType',
          name: t('selectPhoneNumberFormat'),
          type: 'option',
          value: formatType,
          readOnly,
          readOnlyReason,
          options: FORMAT_TYPES.map((type) => ({
            id: type,
            name: t(type),
            description: this._getExample(type, template),
          })),
          helper: t('formatHelper'),
        },
        {
          id: 'template',
          name: t('customTemplate'),
          type: 'string',
          value: template,
          readOnly,
          readOnlyReason,
          showWhen: {
            formatType: { value: 'custom', operator: 'equal' },
          },
          placeholder: TEMPLATE_PLACEHOLDER,
          helper: t('customTemplateHelper'),
          required: true,
        },
      ],
    };
  }

  component(): ReactElement {
    const section = useConnector(() => this.section);
    const { current: uiFunctions } = useRef({
      onBack: () => this._router.goBack(),
      onSave: async (updatedSection: ThirdPartySetting): Promise<void> => {
        const items = updatedSection.items ?? [];
        const getValue = (id: string): unknown =>
          items.find((item) => item.id === id)?.value;
        await this._phoneNumberFormat.updateSetting({
          formatType: getValue('formatType'),
          template: getValue('template'),
        });
      },
    });
    return <ThirdPartySettingSectionPanel section={section} {...uiFunctions} />;
  }
}
