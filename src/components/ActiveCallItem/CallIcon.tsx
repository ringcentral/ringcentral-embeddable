import React from 'react';

import { RcAvatar, RcIcon, styled } from '@ringcentral/juno';
import {
  People,
  Conference,
} from '@ringcentral/juno-icon';

const StyledAvatar = styled(RcAvatar)`
  padding-left: 16px;

  .RcAvatar-avatarContainer {
    width: 26px;
    height: 26px;
  }

  .icon {
    font-size: 15px;
  }
`;

export function CallIcon({
  isOnConferenceCall = false,
  avatarUrl = '',
}) {
  let icon;
  if (!avatarUrl || isOnConferenceCall) {
    icon = (
      <RcIcon
        symbol={isOnConferenceCall ? Conference : People}
        size="medium"
      />
    );
  }
  return (
    <StyledAvatar
      color="avatar.global"
      size="xsmall"
      src={avatarUrl}
    >
      {icon}
    </StyledAvatar>
  );
}