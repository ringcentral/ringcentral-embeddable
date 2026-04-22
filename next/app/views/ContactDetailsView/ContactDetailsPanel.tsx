import type { ContactModel } from '@ringcentral-integration/commons/interfaces/Contact.model';
import { filterByPhoneTypes, sortByPhoneTypes } from '@ringcentral-integration/commons/lib/phoneTypeHelper';
import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components';
import phoneTypeNames from '@ringcentral-integration/next-widgets/i18n/phoneTypeNames';
import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { CallMd, Smsmd } from '@ringcentral/spring-icon';
import {
  Block,
  BlockHeader,
  Icon,
  IconButton,
  Tab,
  TabContext,
  Tabs,
} from '@ringcentral/spring-ui';
import React, { useState } from 'react';

import i18n from './i18n';

interface ContactDetailsPanelProps {
  currentLocale: string;
  contact: ContactModel | null;
  showSpinner: boolean;
  isMultipleSiteEnabled: boolean;
  isCallButtonDisabled: boolean;
  disableLinks: boolean;
  formatNumber: (phoneNumber: string) => string;
  canCallButtonShow: (phoneType: string) => boolean;
  canTextButtonShow: (phoneType: string) => boolean;
  onBackClick: () => void;
  onClickToDial: (contact: ContactModel, phoneNumber: string) => void;
  onClickToSMS: (contact: ContactModel, phoneNumber: string) => void;
  onClickMailTo?: (email: string, contactType: string) => void;
  getPresence?: (contact: any, useCache: boolean) => Promise<any>;
}

interface ContactDetailsViewContact extends ContactModel {
  department?: string;
  site?: { name: string };
}

function SectionBlock({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Block className="w-full mb-2">{children}</Block>;
}

function SectionItem({
  label,
  value,
  valueTitle,
  endSlot,
  divider = false,
}: {
  label: string;
  value: React.ReactNode;
  valueTitle?: string;
  endSlot?: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <BlockHeader divider={divider} endSlot={endSlot}>
      <div className="min-w-0">
        <div className="typography-descriptorMini text-neutral-b2">{label}</div>
        <div className="typography-mainText truncate" title={valueTitle}>
          {value}
        </div>
      </div>
    </BlockHeader>
  );
}

function PhoneSection({
  contact,
  currentLocale,
  disableLinks,
  isCallButtonDisabled,
  isMultipleSiteEnabled,
  formatNumber,
  canCallButtonShow,
  canTextButtonShow,
  onClickToDial,
  onClickToSMS,
}: {
  contact: ContactModel;
  currentLocale: string;
  disableLinks: boolean;
  isCallButtonDisabled: boolean;
  isMultipleSiteEnabled: boolean;
  formatNumber: (phoneNumber: string) => string;
  canCallButtonShow: (phoneType: string) => boolean;
  canTextButtonShow: (phoneType: string) => boolean;
  onClickToDial: (contact: ContactModel, phoneNumber: string) => void;
  onClickToSMS: (contact: ContactModel, phoneNumber: string) => void;
}) {
  if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
    return null;
  }
  const { t } = useLocale(i18n);
  const { t: tPhoneType } = useLocale(phoneTypeNames);
  const sortedPhoneNumbers = sortByPhoneTypes(
    filterByPhoneTypes(contact.phoneNumbers),
  );
  return (
    <SectionBlock>
      {sortedPhoneNumbers.map((item, idx) => {
        const { phoneType, phoneNumber, rawPhoneNumber } = item;
        const formattedNumber = formatNumber(phoneNumber!);
        const displayedPhoneNumber = rawPhoneNumber || formattedNumber;
        const usedPhoneNumber =
          isMultipleSiteEnabled && phoneType === 'extension'
            ? formattedNumber
            : phoneNumber!;

        let endSlot: React.ReactNode;

        if (canCallButtonShow(phoneType!) || canTextButtonShow(phoneType!)) {
          endSlot = (
            <div className="flex items-center gap-1 flex-none">
              {canCallButtonShow(phoneType!) && (
                <IconButton
                  variant="icon"
                  size="small"
                  color="secondary"
                  disabled={isCallButtonDisabled}
                  onClick={() => onClickToDial(contact, usedPhoneNumber)}
                  TooltipProps={{ title: `Call ${displayedPhoneNumber}` }}
                >
                  <Icon symbol={CallMd} size="small" />
                </IconButton>
              )}
              {canTextButtonShow(phoneType!) && (
                <IconButton
                  variant="icon"
                  size="small"
                  color="secondary"
                  disabled={disableLinks}
                  onClick={() => onClickToSMS(contact, usedPhoneNumber)}
                  TooltipProps={{ title: `Text ${displayedPhoneNumber}` }}
                >
                  <Icon symbol={Smsmd} size="small" />
                </IconButton>
              )}
            </div>
          );
        }

        return (
          <SectionItem
            key={`${phoneType}-${phoneNumber}-${idx}`}
            label={phoneType ? tPhoneType(phoneType) : t('phone')}
            value={displayedPhoneNumber}
            valueTitle={displayedPhoneNumber}
            endSlot={endSlot}
            divider={idx < sortedPhoneNumbers.length - 1}
          />
        );
      })}
    </SectionBlock>
  );
}

function EmailSection({
  emails,
  contactType,
  onClickMailTo,
}: {
  emails?: string[];
  contactType: string;
  onClickMailTo?: (email: string, contactType: string) => void;
}) {
  const { t } = useLocale(i18n);
  if (!emails || emails.length === 0) return null;
  const validEmails = emails.filter((email) => !!email);
  if (validEmails.length === 0) return null;
  return (
    <SectionBlock>
      {emails.map((email, idx) => (
        <SectionItem
          key={`${email}-${idx}`}
          label={t('email')}
          valueTitle={email}
          divider={idx < emails.length - 1}
          value={(
            <button
              type="button"
              className="block w-full truncate cursor-pointer bg-transparent border-none p-0 text-left text-[color:var(--sui-color-interactive-foreground)]"
              title={email}
              onClick={(e) => {
                e.preventDefault();
                onClickMailTo?.(email, contactType);
              }}
            >
              {email}
            </button>
          )}
        />
      ))}
    </SectionBlock>
  );
}

function CompanySection({
  company,
  department,
}: {
  company?: string;
  department?: string;
}) {
  if (!company && !department) return null;
  const { t } = useLocale(i18n);
  const items = [
    department
      ? {
          label: t('department'),
          value: department,
        }
      : null,
    company
      ? {
          label: t('company'),
          value: company,
        }
      : null,
  ].filter(
    (
      item,
    ): item is {
      label: string;
      value: string;
    } => item !== null,
  );

  return (
    <SectionBlock>
      {items.map((item, idx) => (
        <SectionItem
          key={item.label}
          label={item.label}
          value={item.value}
          valueTitle={item.value}
          divider={idx < items.length - 1}
        />
      ))}
    </SectionBlock>
  );
}

function SiteSection({
  isMultipleSiteEnabled,
  site,
}: {
  isMultipleSiteEnabled: boolean;
  site?: { name: string };
}) {
  if (!isMultipleSiteEnabled || !site) return null;
  const { t } = useLocale(i18n);
  return (
    <SectionBlock>
      <SectionItem
        label={t('site')}
        value={site.name}
        valueTitle={site.name}
      />
    </SectionBlock>
  );
}

export function ContactDetailsPanel({
  currentLocale,
  contact,
  showSpinner,
  isMultipleSiteEnabled,
  isCallButtonDisabled,
  disableLinks,
  formatNumber,
  canCallButtonShow,
  canTextButtonShow,
  onBackClick,
  onClickToDial,
  onClickToSMS,
  onClickMailTo,
}: ContactDetailsPanelProps) {
  const { t } = useLocale(i18n);
  const [activeTab, setActiveTab] = useState('details');

  let content: React.ReactNode;

  if (showSpinner) {
    content = (
      <div className="flex flex-1 items-center justify-center w-full">
        <span className="typography-body1 text-[color:var(--sui-color-neutral-foreground-secondary)]">
          {t('loadingContact')}
        </span>
      </div>
    );
  } else if (!contact) {
    content = (
      <div className="flex flex-1 items-center justify-center w-full">
        <span className="typography-body1 text-[color:var(--sui-color-neutral-foreground-secondary)]">
          {t('contactNotFound')}
        </span>
      </div>
    );
  } else {
    const detailsContact = contact as ContactDetailsViewContact;
    const fullName =
      contact.name ||
      [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
      '';

    content = (
      <div className="flex flex-col items-center w-full h-full overflow-hidden">
        <div className="flex flex-col items-center pt-4 px-4 w-full">
          <ContactAvatar
            contact={contact}
            size="xlarge"
            showPresence
            contactName={contact.isCallQueueNumber ? undefined : fullName}
            isDepartment={contact.isCallQueueNumber}
          />
          <span className="typography-subtitle1 mt-2 text-center truncate w-full">
            {fullName}
          </span>
          {contact.jobTitle && (
            <span className="typography-body2 text-[color:var(--sui-color-neutral-foreground-secondary)] text-center truncate w-full">
              {contact.jobTitle}
            </span>
          )}
        </div>
        <TabContext
          defaultValue="details"
                site={detailsContact.site}
          onChange={(_, value) => setActiveTab(value as string)}
        >
          <Tabs
            variant="scrollable"
            className="w-full flex-none mt-2 mb-2 border-b border-neutral-l01"
          >
            <Tab value="details" label={t('details')} />
          </Tabs>
        </TabContext>
        <div className="flex-1 overflow-y-auto w-full px-4 pb-4">
          {activeTab === 'details' && (
            <>
              <SiteSection
                isMultipleSiteEnabled={isMultipleSiteEnabled}
                site={(contact as any).site}
              />
              <PhoneSection
                contact={contact}
                currentLocale={currentLocale}
                disableLinks={disableLinks}
                isCallButtonDisabled={isCallButtonDisabled}
                isMultipleSiteEnabled={isMultipleSiteEnabled}
                formatNumber={formatNumber}
                canCallButtonShow={canCallButtonShow}
                canTextButtonShow={canTextButtonShow}
                onClickToDial={onClickToDial}
                onClickToSMS={onClickToSMS}
              />
              <EmailSection
                emails={contact.emails}
                contactType={contact.type}
                onClickMailTo={onClickMailTo}
              />
              <CompanySection
                company={detailsContact.company}
                department={detailsContact.department}
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden" data-sign="contactDetails">
      <AppHeaderNav override>
        <PageHeader onBackClick={onBackClick}>
          <></>
        </PageHeader>
      </AppHeaderNav>
      <div className="flex flex-1 flex-col overflow-hidden">
        {content}
      </div>
      <AppFooterNav />
    </div>
  );
}
