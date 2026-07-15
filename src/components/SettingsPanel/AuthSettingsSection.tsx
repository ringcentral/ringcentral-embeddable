import React from 'react';
import type { FunctionComponent } from 'react';

import {
  RcButton,
  RcLink,
  RcListItemText,
  RcTypography,
  styled,
  palette2,
  RcIconButton,
} from '@ringcentral/juno';
import { Refresh } from '@ringcentral/juno-icon';
import { TextWithMarkdown } from '@ringcentral-integration/jsonschema-page';
import { StyledSettingItem } from './SettingItem';
import i18n from './i18n';

const StyledAuthSettingItem = styled(StyledSettingItem)`
  align-items: flex-start;

  .RcListItemText-multiline {
    margin: 0;
  }

  .RcListItemText-primary {
    display: flex;
    flex-direction: row;
    line-height: 30px;
    margin-right: 100px;
    align-items: center;
  }

  .RcListItemText-secondary {
    margin-top: 5px;
  }
`;

const LicenseDescription = styled(RcTypography)`
  a {
    font-size: inherit;
    line-height: inherit;
  }
  overflow-wrap: break-word;
  white-space: normal;
`;

const RedDot = styled.div`
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 100%;
  background-color: ${palette2('highlight', 'b01')};
  top: -5px;
  right: -5px;
`;

const AuthAction = styled.div`
  position: absolute;
  display: inline-block;
  right: 16px;
  top: 6px;
`;

const IconWrapper = styled.div`
  margin-right: 8px;
  height: 30px;

  img {
    height: 30px;
    max-width: 86px;
    position: relative;
  }
`;

const RefreshIcon = styled(RcIconButton)`
  margin-left: 4px;
`;

const LinkGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 0.75rem;
  margin-top: 4px;
  line-height: 1.5;

  a {
    font-size: inherit;
    line-height: inherit;
  }
`;

const Separator = styled.span`
  margin: 0 4px;
`;

interface AuthorizeSettingsSectionProps {
  serviceName: string;
  onAuthorize: (...args: any[]) => any;
  authorized: boolean;
  authorizedTitle?: string;
  unauthorizedTitle?: string;
  contactSyncing?: boolean;
  authorizationLogo?: string;
  authorizedAccount?: string;
  showAuthRedDot?: boolean;
  serviceInfo?: string;
  showAuthButton?: boolean;
  licenseStatus?: string;
  licenseDescription?: string;
  licenseStatusColor?: string;
  onLicenseRefresh?: () => void;
  links?: Array<{ label: string; uri: string }>;
  currentLocale: string;
}

export const AuthSettingsSection: FunctionComponent<AuthorizeSettingsSectionProps> = ({
  authorized,
  onAuthorize,
  authorizedTitle,
  unauthorizedTitle,
  serviceInfo = '',
  serviceName,
  licenseStatus,
  licenseStatusColor = 'neutral.f04',
  licenseDescription = '',
  contactSyncing = false,
  authorizationLogo = null,
  authorizedAccount = null,
  showAuthRedDot,
  showAuthButton,
  onLicenseRefresh,
  links = [],
  currentLocale,
}) => {
  let status = authorized ? authorizedTitle : unauthorizedTitle;
  if (authorized && contactSyncing) {
    status = i18n.getString('syncing', currentLocale);
  }
  const connectionStatus = authorized
    ? i18n.getString('connected', currentLocale)
    : i18n.getString('disconnected', currentLocale);
  const accountStatus = authorized && authorizedAccount
    ? ` ${i18n.getString('as', currentLocale)} ${authorizedAccount}`
    : '';
  const displayLicenseStatus = licenseStatus ?? i18n.getString('licenseExpired', currentLocale);
  let icon = null;
  if (authorizationLogo) {
    icon = (
      <IconWrapper>
        <img src={authorizationLogo} alt={serviceName} />
      </IconWrapper>
    );
  }
  return (
    <StyledAuthSettingItem
      canHover={false}
      disableTouchRipple
      disableRipple
      data-sign="thirdPartyAuthSetting"
    >
      <RcListItemText
        primary={
          <>
            {icon}
            <RcTypography variant="body1" color="neutral.f06">
              {serviceName}
            </RcTypography>
          </>
        }
        primaryTypographyProps={{
          component: 'div',
        }}
        secondary={
          <>
            <RcTypography variant="caption1" color="neutral.f04">
              {connectionStatus}{accountStatus}
            </RcTypography>
            {
              serviceInfo ? (
                <RcTypography variant="caption1" color="neutral.f04">
                  {serviceInfo}
                </RcTypography>
              ) : (
                null
              )
            }
            {
              displayLicenseStatus ? (
                <RcTypography variant="caption1" color={licenseStatusColor}>
                  {displayLicenseStatus}
                  <RefreshIcon
                    size="xsmall"
                    symbol={Refresh}
                    variant="plain"
                    title={i18n.getString('refresh', currentLocale)}
                    onClick={onLicenseRefresh}
                  />
                </RcTypography>
              ) : (
                null
              )
            }
            {
              licenseDescription ? (
                <LicenseDescription variant="caption1" color="neutral.f04">
                  <TextWithMarkdown text={licenseDescription} />
                </LicenseDescription>
              ) : (
                null
              )
            }
            {
              links.length > 0 ? (
                <LinkGroup>
                  {links.map((link, index) => (
                    <React.Fragment key={link.uri}>
                      {index > 0 && <Separator>|</Separator>}
                      <RcLink href={link.uri} target="_blank">
                        {link.label}
                      </RcLink>
                    </React.Fragment>
                  ))}
                </LinkGroup>
              ) : null
            }
          </>
        }
        secondaryTypographyProps={{
          component: 'div',
        }}
      />
      <AuthAction>
        {
          showAuthButton && (
            <RcButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onAuthorize();
              }}
              variant="outlined"
              color={(authorized && !contactSyncing) ? 'danger.b04' : 'action.primary'}
            >
              {status}
            </RcButton>
          )
        }
        {
          !authorized && showAuthRedDot ? (
            <RedDot />
          ) : null
        }
      </AuthAction>
    </StyledAuthSettingItem>
  );
}
