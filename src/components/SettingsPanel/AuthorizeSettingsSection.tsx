import React from 'react';
import type { FunctionComponent } from 'react';

import {
  RcButton,
  RcListItemText,
  RcListItemIcon,
  RcListItemSecondaryAction,
  styled,
  palette2
} from '@ringcentral/juno';

import { StyledSettingItem } from './SettingItem';

const RedDot = styled.div`
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 100%;
  background-color: ${palette2('danger', 'b04')};
  top: 9px;
  right: 12px;
`;

const IconWrapper = styled.div`
  margin-right: 10px;

  img {
    vertical-align: middle;
    height: 20px;
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
}

export const AuthorizeSettingsSection: FunctionComponent<AuthorizeSettingsSectionProps> = ({
  authorized,
  onAuthorize,
  authorizedTitle = 'Unauthorize',
  unauthorizedTitle = 'Authorize',
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
      <RcListItemIcon>
        <IconWrapper>
          <img src={authorizationLogo} alt={serviceName} />
        </IconWrapper>
      </RcListItemIcon>
    );
  }
  return (
    <StyledSettingItem
      canHover={false}
      disableTouchRipple
      disableRipple
      data-sign="thirdPartyAuthSetting"
    >
      {icon}
      <RcListItemText
        primary={serviceName}
        secondary={authorized ? authorizedAccount : undefined}
      />
      <RcListItemSecondaryAction>
        <RcButton
          size="small"
          onClick={onAuthorize}
          color={(authorized && !contactSyncing) ? 'danger.b04' : 'action.primary'}
        >
          {status}
        </RcButton>
        {showAuthRedDot ? (<RedDot />) : null}
      </RcListItemSecondaryAction>
    </StyledSettingItem>
  );
}
