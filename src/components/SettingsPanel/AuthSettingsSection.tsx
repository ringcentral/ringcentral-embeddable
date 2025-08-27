import React from 'react';
import type { FunctionComponent } from 'react';

import {
  RcButton,
  RcListItemText,
  RcTypography,
  styled,
  palette2,
  RcIconButton,
} from '@ringcentral/juno';
import { Refresh } from '@ringcentral/juno-icon';
import { TextWithMarkdown } from '@ringcentral-integration/jsonschema-page';
import { StyledSettingItem } from './SettingItem';

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
}

export const AuthSettingsSection: FunctionComponent<AuthorizeSettingsSectionProps> = ({
  authorized,
  onAuthorize,
  authorizedTitle,
  unauthorizedTitle,
  serviceInfo = '',
  serviceName,
  licenseStatus = 'License: expired',
  licenseStatusColor = 'neutral.f04',
  licenseDescription = '',
  contactSyncing = false,
  authorizationLogo = null,
  authorizedAccount = null,
  showAuthRedDot,
  showAuthButton,
  onLicenseRefresh,
}) => {
  let status = authorized ? authorizedTitle : unauthorizedTitle;
  if (authorized && contactSyncing) {
    status = 'Syncing';
  }
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
              { authorized ? 'Connected' : 'Disconnected'} { authorized && authorizedAccount ? `as ${authorizedAccount}` : '' }
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
              licenseStatus ? (
                <RcTypography variant="caption1" color={licenseStatusColor}>
                  {licenseStatus}
                  <RefreshIcon
                    size="xsmall"
                    symbol={Refresh}
                    variant="plain"
                    title="Refresh"
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
