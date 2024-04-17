import React from 'react';

import { styled } from '@ringcentral/juno/foundation';
import { RcIcon } from '@ringcentral/juno';

const ImageIcon = styled.img`
  width: 24px;
  height: 24px;
`;
export function TabIcon({ icon, activeIcon, iconUri, activeIconUri, active, alt }) {
  if (icon) {
    const color = active ? 'nav.iconSelected' : 'nav.iconDefault';
    return (
      <RcIcon
        symbol={active ? activeIcon : icon}
        size="medium"
        color={color}
      />
    );
  }
  return (
    <ImageIcon
      src={active ? activeIconUri : iconUri}
      alt={alt}
    />
  );
}
