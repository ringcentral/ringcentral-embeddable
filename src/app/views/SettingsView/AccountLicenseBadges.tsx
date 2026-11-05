import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Tag, type TagColor, Tooltip } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React from 'react';

import i18n from './i18n';

interface AccountLicenseBadgesProps {
  /** Licensed for AI Conversation Expert (RingSense for Sales). */
  readonly ringSenseLicensed?: boolean;
  /** The extension is a RingCX contact center account. */
  readonly ringCXLicensed?: boolean;
  /** The extension has admin permission. */
  readonly isAdmin?: boolean;
}

interface LicenseBadge {
  readonly key: string;
  readonly label: string;
  readonly tooltip: string;
  readonly color: TagColor;
}

/**
 * Shows the current user's license badges.
 */
export const AccountLicenseBadges: FunctionComponent<
  AccountLicenseBadgesProps
> = ({
  ringSenseLicensed = false,
  ringCXLicensed = false,
  isAdmin = false,
}) => {
  const { t } = useLocale(i18n);
  const badges: LicenseBadge[] = [];
  if (ringSenseLicensed) {
    badges.push({
      key: 'ace',
      label: 'ACE',
      tooltip: t('aiConversationExpertLicensed'),
      color: 'warning',
    });
  }
  if (ringCXLicensed) {
    badges.push({
      key: 'ringCX',
      label: 'RingCX',
      tooltip: t('ringCxAccount'),
      color: 'primary',
    });
  }
  if (isAdmin) {
    badges.push({
      key: 'admin',
      label: t('admin'),
      tooltip: t('adminUser'),
      color: 'neutral',
    });
  }
  if (badges.length === 0) {
    return null;
  }
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 max-w-full"
      data-sign="accountLicenseBadges"
    >
      {badges.map((badge) => (
        <Tooltip
          key={badge.key}
          color="neutral"
          placement="top"
          title={badge.tooltip}
        >
          <Tag
            color={badge.color}
            variant="inverted"
            className="shrink-0"
            data-sign={`${badge.key}LicenseBadge`}
          >
            {badge.label}
          </Tag>
        </Tooltip>
      ))}
    </div>
  );
};
