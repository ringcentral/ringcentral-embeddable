import React from 'react';
import {
  RcAvatar,
  RcIcon,
  useAvatarColorToken,
  useAvatarShortName
} from '@ringcentral/juno';
import { UserDefault, GroupDefault } from '@ringcentral/juno-icon';

type Contact = {
  firstName?: string;
  lastName?: string;
  name?: string;
  profileImageUrl?: string;
}

export function ContactAvatar({
  contact,
  fullName,
  size = 'medium',
  presenceOrigin,
  presenceProps,
  isGroup = false,
} : {
  contact?: Contact;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xsmall' | 'xxsmall';
  presenceOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'right';
  };
  presenceProps?: {
    type: string;
    title: string;
  },
  fullName?: string;
  isGroup?: boolean;
}) {
  let firstName = contact?.firstName || '';
  let lastName = contact?.lastName || '';
  let name = fullName || contact?.name || '';
  if (!firstName && !lastName && name) {
    const names = name.split(' ');
    firstName = names[0] || '';
    lastName = names[1] || '';
  }
  let avatarColor;
  let avatarName;
  if (firstName || lastName) {
    avatarName = useAvatarShortName({
      firstName,
      lastName,
    });
  }
  if (name) {
    avatarColor = useAvatarColorToken(name);
  }
  let iconSymbol;
  if (!avatarName) {
    iconSymbol = isGroup ? GroupDefault : UserDefault;
  }
  return (
    <RcAvatar
      size={size}
      color={avatarColor || 'avatar.global'}
      src={contact?.profileImageUrl}
      presenceOrigin={presenceOrigin}
      presenceProps={presenceProps}
      iconSymbol={iconSymbol}
    >
      {avatarName}
    </RcAvatar>
  )
}