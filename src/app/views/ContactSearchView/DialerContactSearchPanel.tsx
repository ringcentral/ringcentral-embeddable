import {
  DialerContactSearchPanel as DialerContactSearchPanelBase,
  type DialerContactSearchPanelProps,
} from '@ringcentral-integration/micro-contacts/src/app/views/ContactSearchView/ContactSearchPanel/DialerContactSearchPanel';
import type { IContactSearchItem } from '@ringcentral-integration/micro-contacts/src/app/views/ContactSearchView/ContactSearch.view.interface';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { Recipient } from '@ringcentral-integration/micro-phone/src/app/services';
import React, { useMemo } from 'react';

import i18n, { type I18nKey } from './i18n';

type DialerContactSearchItem = IContactSearchItem & {
  originalPhoneType: string;
};

type DialerRecipient = Recipient & {
  originalPhoneType?: string;
  phoneType?: string;
};

function formatPhoneTypeLabels(
  contacts: IContactSearchItem[] = [],
  translate: (key: I18nKey) => string,
): DialerContactSearchItem[] {
  return contacts.map((contact) => ({
    ...contact,
    originalPhoneType: contact.phoneType,
    phoneType: translate(contact.phoneType as I18nKey),
  }));
}

export const DialerContactSearchPanel = (
  props: DialerContactSearchPanelProps,
) => {
  const { t } = useLocale(i18n);
  const hasThirdPartyResults = Boolean(
    props.thirdPartySourceName && props.thirdPartyContacts?.length,
  );
  const defaultTab =
    !hasThirdPartyResults && props.defaultTab === 'thirdParty'
      ? 'company'
      : props.defaultTab;
  const contactProps = useMemo(
    () => ({
      companyContacts: formatPhoneTypeLabels(props.companyContacts, t),
      personalContacts: formatPhoneTypeLabels(props.personalContacts, t),
      otherContacts: formatPhoneTypeLabels(props.otherContacts, t),
      thirdPartyContacts: formatPhoneTypeLabels(props.thirdPartyContacts, t),
    }),
    [
      props.companyContacts,
      props.otherContacts,
      props.personalContacts,
      props.thirdPartyContacts,
      t,
    ],
  );
  const onSelect = props.onSelect
    ? async (recipients: Recipient[]) => {
        await props.onSelect?.(
          recipients.map((recipient) => {
            const { originalPhoneType, ...formattedRecipient } =
              recipient as DialerRecipient;

            return originalPhoneType
              ? { ...formattedRecipient, phoneType: originalPhoneType }
              : formattedRecipient;
          }),
        );
      }
    : undefined;

  return (
    <div className="contents [&_.sui-suggestion-list-root]:px-0 [&_.sui-list-item-root]:px-0">
      <DialerContactSearchPanelBase
        key={hasThirdPartyResults ? 'thirdPartyResults' : 'noThirdPartyResults'}
        {...props}
        {...contactProps}
        defaultTab={defaultTab}
        thirdPartySourceName={
          hasThirdPartyResults ? props.thirdPartySourceName : undefined
        }
        onSelect={onSelect}
      />
    </div>
  );
};
