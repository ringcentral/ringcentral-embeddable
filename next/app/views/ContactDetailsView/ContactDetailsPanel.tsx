import type { ContactModel } from '@ringcentral-integration/commons/interfaces/Contact.model';
import { filterByPhoneTypes, sortByPhoneTypes } from '@ringcentral-integration/commons/lib/phoneTypeHelper';
import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { CallMd, Smsmd, EmailMd } from '@ringcentral/spring-icon';
import {
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
  const sortedPhoneNumbers = sortByPhoneTypes(
    filterByPhoneTypes(contact.phoneNumbers),
  );
  return (
    <div className="rounded-lg border border-[color:var(--sui-color-neutral-border)] w-full my-2">
      {sortedPhoneNumbers.map((item, idx) => {
        const { phoneType, phoneNumber, rawPhoneNumber } = item;
        const formattedNumber = formatNumber(phoneNumber!);
        const displayedPhoneNumber = rawPhoneNumber || formattedNumber;
        const usedPhoneNumber =
          isMultipleSiteEnabled && phoneType === 'extension'
            ? formattedNumber
            : phoneNumber!;
        return (
          <div
            key={idx}
            className="flex items-center justify-between px-4 py-2"
          >
            <div className="flex flex-col min-w-0 flex-1">
              <span className="typography-caption2 text-[color:var(--sui-color-neutral-foreground-secondary)]">
                {phoneType}
              </span>
              <span className="typography-body2 truncate">
                {displayedPhoneNumber}
              </span>
            </div>
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
          </div>
        );
      })}
    </div>
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
  if (!emails || emails.length === 0) return null;
  return (
    <div className="rounded-lg border border-[color:var(--sui-color-neutral-border)] w-full my-2 px-4 py-2">
      <span className="typography-caption2 text-[color:var(--sui-color-neutral-foreground-secondary)]">
        Email
      </span>
      {emails.map((email, idx) => (
        <button
          type="button"
          key={idx}
          className="block typography-body2 text-[color:var(--sui-color-interactive-foreground)] truncate mt-1 cursor-pointer bg-transparent border-none p-0 text-left"
          title={email}
          onClick={(e) => {
            e.preventDefault();
            onClickMailTo?.(email, contactType);
          }}
        >
          {email}
        </button>
      ))}
    </div>
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
  return (
    <div className="rounded-lg border border-[color:var(--sui-color-neutral-border)] w-full my-2 px-4 py-2">
      {department && (
        <div className="mb-1">
          <span className="typography-caption2 text-[color:var(--sui-color-neutral-foreground-secondary)]">
            Department
          </span>
          <span className="block typography-body2">{department}</span>
        </div>
      )}
      {company && (
        <div>
          <span className="typography-caption2 text-[color:var(--sui-color-neutral-foreground-secondary)]">
            Company
          </span>
          <span className="block typography-body2">{company}</span>
        </div>
      )}
    </div>
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
  return (
    <div className="rounded-lg border border-[color:var(--sui-color-neutral-border)] w-full my-2 px-4 py-2">
      <span className="typography-caption2 text-[color:var(--sui-color-neutral-foreground-secondary)]">
        Site
      </span>
      <span className="block typography-body2">{site.name}</span>
    </div>
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

  if (showSpinner) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="typography-body1 text-[color:var(--sui-color-neutral-foreground-secondary)]">
          {t('loadingContact')}
        </span>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="typography-body1 text-[color:var(--sui-color-neutral-foreground-secondary)]">
          {t('contactNotFound')}
        </span>
      </div>
    );
  }

  const fullName =
    contact.name ||
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    '';

  return (
    <div className="flex flex-col items-center w-full h-full overflow-hidden">
      <div className="flex flex-col items-center pt-4 px-4 w-full">
        <ContactAvatar
          contact={contact}
          size="xlarge"
          showPresence
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
        value={activeTab}
        onChange={(_, value) => setActiveTab(value as string)}
      >
        <Tabs
          variant="scrollable"
          className="w-full flex-none mt-2 border-b border-[color:var(--sui-color-neutral-border)]"
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
              company={contact.company}
              department={(contact as any).department}
            />
          </>
        )}
      </div>
    </div>
  );
}
