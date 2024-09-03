import React from 'react';
import type { FunctionComponent } from 'react';

import {
  RcButton,
  RcListItemText,
  RcListItemAvatar,
  RcTypography,
  styled,
  palette2,
  css
} from '@ringcentral/juno';
import { StyledSettingItem } from './SettingItem';

const StyledAuthSettingItem = styled(StyledSettingItem)<{ $authorized: boolean }>`
  .MuiListItemAvatar-root {
    margin-right: 4px;
  }

  .RcListItemText-multiline {
    margin: 0;
  }

  ${({ $authorized }) => $authorized ? css`
    .third-party-auth-action {
      display: none;
    }

    &:hover {
      .third-party-auth-action {
        display: block;
      }
    }
  ` : css`
    .third-party-auth-action {
      display: block;
    }
  `}
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
  right: 16px;
  top: 11px;
  background-color: ${palette2('neutral', 'b01')};
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
      $authorized={authorized}
    >
      {
        icon ? (
          <RcListItemAvatar>
            {icon}
          </RcListItemAvatar>
        ) : null
      }
      <RcListItemText
        primary={serviceName}
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
          </>
        }
        secondaryTypographyProps={{
          component: 'div',
        }}
      />
      <AuthAction className="third-party-auth-action">
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
    </StyledAuthSettingItem>
  );
}
