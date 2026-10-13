import { OverflowVerticalMd } from '@ringcentral/spring-icon';
import {
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuItemText,
} from '@ringcentral/spring-ui';
import React, { useRef, useState } from 'react';

import type { PhoneAction } from './ContactDetails.interface';

/**
 * Buttons shown inline on a phone row before the rest move into a menu,
 * as the 3.x contact page did.
 */
const MAX_INLINE_ACTIONS = 3;

/**
 * Phone row action buttons, with the overflow in a menu.
 */
export function PhoneActionButtons({
  actions,
  moreTitle,
}: {
  actions: PhoneAction[];
  moreTitle: string;
}): React.ReactElement | null {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);
  if (actions.length === 0) {
    return null;
  }
  const hasOverflow = actions.length > MAX_INLINE_ACTIONS;
  const inlineActions = hasOverflow
    ? actions.slice(0, MAX_INLINE_ACTIONS - 1)
    : actions;
  const menuActions = hasOverflow ? actions.slice(MAX_INLINE_ACTIONS - 1) : [];
  return (
    <div className="flex items-center gap-1 flex-none">
      {inlineActions.map((action) => (
        <IconButton
          key={action.id}
          variant="icon"
          size="small"
          color="secondary"
          disabled={action.disabled}
          data-sign={`phoneAction-${action.id}`}
          onClick={action.onClick}
          TooltipProps={{ title: action.title }}
        >
          <Icon symbol={action.symbol} size="small" />
        </IconButton>
      ))}
      {hasOverflow && (
        <>
          <IconButton
            ref={menuAnchorRef}
            variant="icon"
            size="small"
            color="secondary"
            data-sign="phoneActionMore"
            onClick={() => setMenuOpen(true)}
            TooltipProps={{ title: moreTitle }}
          >
            <Icon symbol={OverflowVerticalMd} size="small" />
          </IconButton>
          <Menu
            open={menuOpen}
            anchorEl={menuAnchorRef.current}
            onClose={() => setMenuOpen(false)}
          >
            {menuActions.map((action) => (
              <MenuItem
                key={action.id}
                disabled={action.disabled}
                data-sign={`phoneAction-${action.id}`}
                onClick={() => {
                  setMenuOpen(false);
                  action.onClick();
                }}
              >
                <MenuItemText primary={action.title} />
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
    </div>
  );
}
