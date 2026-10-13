import { NumberFormatter } from '@ringcentral-integration/micro-auth/src/app/services';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import {
  ComposeText,
  MessageSender,
} from '@ringcentral-integration/micro-message/src/app/services';
import numberTypeI18n from '@ringcentral-integration/micro-phone/src/app/components/MyCallerIdDropdown/i18n';
import {
  computed,
  injectable,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import type { ThirdPartySetting } from '../../services/ThirdParty/ThirdParty.interface';
import { ThirdPartySettingSectionPanel } from '../ThirdPartySettingSectionView/ThirdPartySettingSectionPanel';

import { t } from './i18n';

const SENDER_NUMBER_ID = 'senderNumber';

/**
 * The 3.x Text settings page: picks the default SMS sender, the number
 * Compose Text starts with.
 */
@injectable({
  name: 'TextSettingView',
})
export class TextSettingView extends RcViewModule {
  constructor(
    private readonly _composeText: ComposeText,
    private readonly _messageSender: MessageSender,
    private readonly _numberFormatter: NumberFormatter,
    private readonly _locale: Locale,
    private readonly _router: RouterPlugin,
  ) {
    super();
  }

  /** Kept stable between renders, since the form resets on a new section. */
  @computed((that: TextSettingView) => [
    that._composeText.senderNumber,
    that._messageSender.senderNumbersList,
    that._numberFormatter.formattingParams,
    that._locale.currentLocale,
  ])
  get section(): ThirdPartySetting {
    return {
      id: 'text',
      name: t('text'),
      type: 'section',
      items: [
        {
          id: SENDER_NUMBER_ID,
          name: t('defaultSmsSender'),
          type: 'option',
          value: this._composeText.senderNumber,
          required: true,
          helper: t('defaultSmsSenderHelper'),
          options: this._messageSender.senderNumbersList.map((number) => ({
            id: number.phoneNumber,
            name: this._numberFormatter.formatNumber(number.phoneNumber),
            description:
              number.label ||
              (number.usageType
                ? numberTypeI18n.getString(
                    number.usageType,
                    this._locale.currentLocale,
                  )
                : ''),
          })),
        },
      ],
    };
  }

  component(): ReactElement {
    const section = useConnector(() => this.section);
    const { current: uiFunctions } = useRef({
      onBack: () => this._router.goBack(),
      onSave: async (updatedSection: ThirdPartySetting): Promise<void> => {
        const senderNumber = updatedSection.items?.find(
          (item) => item.id === SENDER_NUMBER_ID,
        )?.value;
        if (typeof senderNumber === 'string' && senderNumber) {
          await this._composeText.updateSenderNumber(senderNumber);
        }
      },
    });
    return <ThirdPartySettingSectionPanel section={section} {...uiFunctions} />;
  }
}
