import { TextWithMarkdown } from '@ringcentral-integration/jsonschema-spring-page';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { RefreshMd } from '@ringcentral/spring-icon';
import {
  Badge,
  Button,
  IconButton,
  Link,
  ListItem,
  ListItemText,
} from '@ringcentral/spring-ui';
import type { FunctionComponent, ReactElement, ReactNode } from 'react';
import React from 'react';

import type { ThirdPartyAuthorizationLink } from '../../services/ThirdParty';

import i18n from './i18n';

interface ThirdPartyAuthSettingsProps {
  readonly authorizationLogo?: string | null;
  readonly authorized: boolean;
  readonly authorizedAccount?: string | null;
  readonly authorizedTitle?: string | null;
  readonly authorizationLinks?: readonly ThirdPartyAuthorizationLink[];
  readonly contactSyncing?: boolean;
  readonly licenseDescription?: string | null;
  readonly licenseStatus?: string | null;
  readonly licenseStatusColor?: string | null;
  readonly onAuthorize: () => Promise<void> | void;
  readonly onLicenseRefresh: () => Promise<void> | void;
  readonly serviceInfo?: string | null;
  readonly serviceName: string;
  readonly showAuthButton?: boolean;
  readonly showAuthRedDot?: boolean;
  readonly unauthorizedTitle?: string | null;
}

interface ServiceLogoProps {
  readonly alt: string;
  readonly src: string;
}

function ServiceLogo({ alt, src }: ServiceLogoProps): ReactElement | null {
  const [hasLoadError, setHasLoadError] = React.useState<boolean>(false);
  if (hasLoadError) {
    return null;
  }
  return (
    <img
      className="max-h-[30px] max-w-[86px] flex-none object-contain"
      src={src}
      alt={alt}
      onError={() => setHasLoadError(true)}
    />
  );
}

function getLicenseStatusClassName(color?: string | null): string {
  const normalizedColor: string = color?.toLowerCase() ?? '';
  if (
    normalizedColor.includes('danger') ||
    normalizedColor.includes('error') ||
    normalizedColor.includes('highlight')
  ) {
    return 'text-danger-f';
  }
  if (normalizedColor.includes('warning')) {
    return 'text-warning-f';
  }
  if (normalizedColor.includes('success')) {
    return 'text-success-f';
  }
  if (
    normalizedColor.includes('primary') ||
    normalizedColor.includes('action')
  ) {
    return 'text-primary-f';
  }
  return 'text-neutral-b2';
}

/**
 * Displays a registered third-party service and its authorization controls.
 */
export const ThirdPartyAuthSettings: FunctionComponent<
  ThirdPartyAuthSettingsProps
> = ({
  authorizationLogo,
  authorized,
  authorizedAccount,
  authorizedTitle,
  authorizationLinks = [],
  contactSyncing = false,
  licenseDescription,
  licenseStatus,
  licenseStatusColor,
  onAuthorize,
  onLicenseRefresh,
  serviceInfo,
  serviceName,
  showAuthButton = false,
  showAuthRedDot = false,
  unauthorizedTitle,
}) => {
  const { t } = useLocale(i18n);
  const connectionStatus: string = authorized
    ? t('connected')
    : t('disconnected');
  const connectionDescription: string =
    authorized && authorizedAccount
      ? t('connectedAs', { account: authorizedAccount })
      : connectionStatus;
  const authorizationButtonLabel: string =
    authorized && contactSyncing
      ? t('syncing')
      : authorized
      ? authorizedTitle || t('unauthorize')
      : unauthorizedTitle || t('authorize');
  const authorizationAction: ReactNode = showAuthButton ? (
    <Button
      data-sign="thirdPartyAuthButton"
      size="small"
      variant="outlined"
      color={authorized && !contactSyncing ? 'danger' : 'primary'}
      onClick={() => void onAuthorize()}
    >
      {authorizationButtonLabel}
    </Button>
  ) : null;
  return (
    <ListItem
      data-sign="thirdPartyAuthSetting"
      size="auto"
      divider={false}
      hoverable={false}
      classes={{
        root: '!px-0',
        content: '!px-0 !pb-0 items-start gap-2',
      }}
    >
      {authorizationLogo ? (
        <ServiceLogo
          key={authorizationLogo}
          src={authorizationLogo}
          alt={serviceName}
        />
      ) : null}
      <ListItemText
        classes={{
          root: 'min-w-0',
          primary: 'ml-0',
          'primary-text': 'whitespace-normal',
          'secondary-text': 'min-w-0 overflow-hidden whitespace-normal',
        }}
        primary={
          <span className="typography-mainText text-neutral-b0 break-words">
            {serviceName}
          </span>
        }
        secondary={
          <span className="mt-1 flex min-w-0 flex-col gap-1 overflow-hidden">
            <span
              className="typography-descriptor text-neutral-b2 block max-w-full truncate"
              title={connectionDescription}
            >
              {connectionDescription}
            </span>
            {serviceInfo ? (
              <span
                className="typography-descriptor text-neutral-b2 block max-w-full truncate"
                title={serviceInfo}
              >
                {serviceInfo}
              </span>
            ) : null}
            {licenseStatus ? (
              <span
                className={`typography-descriptor flex items-center break-words ${getLicenseStatusClassName(
                  licenseStatusColor,
                )}`}
              >
                {licenseStatus}
                <IconButton
                  data-sign="thirdPartyLicenseRefresh"
                  size="xsmall"
                  iconSize="xsmall"
                  variant="icon"
                  color="neutral"
                  symbol={RefreshMd}
                  TooltipProps={{ title: t('refreshLicense') }}
                  onClick={() => void onLicenseRefresh()}
                />
              </span>
            ) : null}
            {licenseDescription ? (
              <span className="typography-descriptor text-neutral-b2 break-words">
                <TextWithMarkdown text={licenseDescription} />
              </span>
            ) : null}
            {authorizationLinks.length > 0 ? (
              <span className="typography-descriptor flex flex-wrap items-center text-neutral-b2">
                {authorizationLinks.map((link, index) => (
                  <React.Fragment key={link.uri}>
                    {index > 0 ? (
                      <span className="mx-1" aria-hidden="true">
                        |
                      </span>
                    ) : null}
                    <Link
                      href={link.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </Link>
                  </React.Fragment>
                ))}
              </span>
            ) : null}
          </span>
        }
      />
      {authorizationAction && !authorized && showAuthRedDot ? (
        <Badge type="dot" color="danger" overlap="rectangular">
          {authorizationAction}
        </Badge>
      ) : (
        authorizationAction
      )}
    </ListItem>
  );
};
