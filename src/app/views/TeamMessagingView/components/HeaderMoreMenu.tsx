import { OverflowVerticalMd } from '@ringcentral/spring-icon';
import {
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuItemText,
  MenuList,
} from '@ringcentral/spring-ui';
import React, { useState } from 'react';

import { t } from '../i18n';
import type { HeaderMenuAction } from '../TeamMessaging.view.interface';

/**
 * A header's "More" button and its menu. `dataSign` names the button
 * (`<dataSign>MoreButton`) and the items (`<dataSign>Menu-<key>`).
 */
export function HeaderMoreMenu({
  actions,
  dataSign,
}: {
  actions: HeaderMenuAction[];
  dataSign: string;
}): React.ReactElement {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  return (
    <>
      <IconButton
        variant="icon"
        color="secondary"
        size="medium"
        symbol={OverflowVerticalMd}
        aria-haspopup="menu"
        data-sign={`${dataSign}MoreButton`}
        TooltipProps={{ title: t('more') }}
        onClick={(event) => setAnchorEl(event.currentTarget)}
      />
      <Menu
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <MenuList>
          {actions.map(({ key, symbol, label, onClick }) => (
            <MenuItem
              key={key}
              data-sign={`${dataSign}Menu-${key}`}
              onClick={() => {
                setAnchorEl(null);
                onClick();
              }}
            >
              <Icon symbol={symbol} size="small" />
              <MenuItemText primary={label} />
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </>
  );
}
