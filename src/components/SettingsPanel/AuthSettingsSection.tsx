import React, { useState } from 'react';
import type { FunctionComponent } from 'react';

import {
  RcButton,
  RcListItemText,
  RcListItemIcon,
  RcTypography,
  styled,
  palette2,
  RcChip,
  RcIcon,
} from '@ringcentral/juno';
import { ArrowDown2, ArrowUp2 } from '@ringcentral/juno-icon';

import { StyledSettingItem } from './SettingItem';

const StyledAuthSettingItem = styled(StyledSettingItem)`
  align-items: flex-start;

  .RcListItemText-primary {
    display: flex;
    flex-direction: row;
  }
`;

const StyledChip = styled(RcChip)`
  height: 22px;
  font-size: 0.75rem;
  margin-right: 5px;
  position: absolute;
  right: 38px;
  top: 10px;

  .MuiChip-label {
    padding: 0 6px;
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
  position: relative;
  margin-top: 5px;
  display: inline-block;
`;

const StyledArrowIcon = styled(RcIcon)`
  position: absolute;
  right: 16px;
  top: 8px;
`;

const IconWrapper = styled.div`
  margin-right: 10px;
  margin-top: 8px;

  img {
    vertical-align: middle;
    height: 30px;
    max-width: 86px;
    position: relative;
  }
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
}

export const AuthSettingsSection: FunctionComponent<AuthorizeSettingsSectionProps> = ({
  authorized,
  onAuthorize,
  authorizedTitle = 'Unauthorize',
  unauthorizedTitle = 'Authorize',
  serviceInfo = '',
  serviceName,
  contactSyncing = false,
  authorizationLogo = null,
  authorizedAccount = null,
  showAuthRedDot,
}) => {
  const [showDetail, setShowDetail] = useState(!authorized);

  let status = authorized ? authorizedTitle : unauthorizedTitle;
  if (authorized && contactSyncing) {
    status = 'Syncing';
  }
  let icon = null;
  if (authorizationLogo) {
    icon = (
      <RcListItemIcon
        onClick={() => setShowDetail(!showDetail)}
      >
        <IconWrapper>
          <img src={authorizationLogo} alt={serviceName} />
        </IconWrapper>
      </RcListItemIcon>
    );
  }
  return (
    <StyledAuthSettingItem
      canHover={false}
      disableTouchRipple
      disableRipple
      data-sign="thirdPartyAuthSetting"
    >
      {icon}
      <RcListItemText
        primary={serviceName}
        secondary={
          <>
            {
              authorized && authorizedAccount ? (
                <RcTypography variant="caption1" color="neutral.f04">
                  {authorizedAccount}
                </RcTypography>
              ) : (
                null
              )
            }
            {
              showDetail ? (
                <AuthAction>
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
                  {
                    !authorized && showAuthRedDot ? (
                      <RedDot />
                    ) : null
                  }
                </AuthAction>
              ) : null
            }
            {
              serviceInfo && showDetail ? (
                <RcTypography variant="caption1" color="neutral.f04">
                  {serviceInfo}
                </RcTypography>
              ) : (
                null
              )
            }
          </>
        }
        secondaryTypographyProps={{
          component: 'div',
        }}
        onClick={() => setShowDetail(!showDetail)}
      />
      <StyledChip
        label={authorized? 'Connected' : 'Disconnected'}
        color={authorized ? 'success.b03' : 'danger.b03'}
        variant="outlined"
        onClick={() => setShowDetail(!showDetail)}
      />
      <StyledArrowIcon
        symbol={showDetail ? ArrowUp2 : ArrowDown2}
        onClick={() => setShowDetail(!showDetail)}
        color="neutral.f04"
      />
    </StyledAuthSettingItem>
  );
}
