import { TextWithMarkdown } from '@ringcentral-integration/jsonschema-spring-page';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Announcement, Button } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React from 'react';

import type { ThirdPartyBanner as ThirdPartyBannerData } from '../../services/ThirdParty';

import i18n from './i18n';

type SpringAnnouncementSeverity = 'error' | 'info' | 'success' | 'warning';
type SpringButtonColor =
  | 'danger'
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning';
type SpringButtonVariant = 'contained' | 'outlined' | 'text';

interface ThirdPartyBannerProps {
  readonly banner: ThirdPartyBannerData;
  readonly onAction: () => Promise<void> | void;
  readonly onClose: () => Promise<void> | void;
}

function getAnnouncementSeverity(
  severity?: ThirdPartyBannerData['severity'],
): SpringAnnouncementSeverity {
  if (
    severity === 'error' ||
    severity === 'success' ||
    severity === 'warning'
  ) {
    return severity;
  }
  return 'info';
}

function getActionVariant(
  variant?: NonNullable<ThirdPartyBannerData['action']>['variant'],
): SpringButtonVariant {
  if (variant === 'contained' || variant === 'outlined' || variant === 'text') {
    return variant;
  }
  return variant === 'plain' ? 'text' : 'outlined';
}

function getActionColor(color?: string): SpringButtonColor {
  const normalizedColor: string = color?.toLowerCase() ?? '';
  if (normalizedColor.includes('danger') || normalizedColor.includes('error')) {
    return 'danger';
  }
  if (normalizedColor.includes('success')) {
    return 'success';
  }
  if (normalizedColor.includes('warning')) {
    return 'warning';
  }
  if (normalizedColor.includes('neutral')) {
    return 'neutral';
  }
  if (normalizedColor.includes('secondary')) {
    return 'secondary';
  }
  return 'primary';
}

/**
 * Displays a third-party status banner in the global app announcement area.
 */
export const ThirdPartyBanner: FunctionComponent<ThirdPartyBannerProps> = ({
  banner,
  onAction,
  onClose,
}) => {
  const { t } = useLocale(i18n);
  const action = banner.action;
  return (
    <Announcement
      data-sign={`thirdPartyBanner-${banner.id}`}
      severity={getAnnouncementSeverity(banner.severity)}
      onClose={banner.closable ? () => void onClose() : undefined}
      closeText={banner.closeButtonLabel || t('close')}
      action={
        action ? (
          <Button
            data-sign={`thirdPartyBannerAction-${banner.id}`}
            size="small"
            variant={getActionVariant(action.variant)}
            color={getActionColor(action.color)}
            onClick={() => void onAction()}
          >
            {action.label}
          </Button>
        ) : undefined
      }
      classes={{
        icon: 'hidden',
        body: 'min-w-0',
        content: 'min-w-0 break-words [&_a]:!text-neutral-w0 [&_a]:underline',
        action: 'flex-none',
      }}
    >
      <TextWithMarkdown text={banner.message} />
    </Announcement>
  );
};
