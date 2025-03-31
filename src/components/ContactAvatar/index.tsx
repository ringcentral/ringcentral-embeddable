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
  profileImage?: {
    uri: string;
  },
}

export function ContactAvatar({
  contact,
  fullName,
  size = 'medium',
  presenceOrigin,
  presenceProps,
  isGroup = false,
  rcAccessToken = '',
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
  rcAccessToken?: string;
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
  let avatarSrc = contact?.profileImageUrl;
  if (contact?.profileImage && rcAccessToken) {
    if (contact.profileImage.uri &&
      (
        contact.profileImage.uri.indexOf('https://media.ringcentral.com/') === 0 ||
        contact.profileImage.uri.indexOf('https://media.ringcentral.biz/') === 0
      ) &&
      contact.profileImage.uri.indexOf('access_token=') === -1
    ) {
      avatarSrc = `${contact.profileImage.uri}?access_token=${rcAccessToken}`;
    }
  }
  let iconSymbol;
  if (!avatarSrc && !avatarName) {
    iconSymbol = isGroup ? GroupDefault : UserDefault;
  }
  return (
    <RcAvatar
      size={size}
      color={avatarColor || 'avatar.global'}
      src={avatarSrc}
      presenceOrigin={presenceOrigin}
      presenceProps={presenceProps}
      iconSymbol={iconSymbol}
    >
      {avatarName}
    </RcAvatar>
  )
}
