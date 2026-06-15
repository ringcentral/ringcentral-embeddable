import React, { useRef, useState } from 'react';
import {
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuItemText,
} from '@ringcentral/spring-ui';
import type { IconButtonProps } from '@ringcentral/spring-ui';
import { OverflowVerticalMd } from '@ringcentral/spring-icon';
import { getIconButtonColor } from '../utils/compat';

export type ActionMenuItem = {
  color?: string;
  disabled?: boolean;
  icon: React.ComponentType;
  id?: string;
  onClick: (event?: React.MouseEvent) => void;
  title: string;
};

export type ActionMenuProps = {
  actions: ActionMenuItem[];
  className?: string;
  color?: string;
  iconClassName?: string;
  iconShape?: IconButtonProps['shape'];
  iconVariant?: 'outlined' | 'contained' | 'icon' | 'inverted';
  maxActions?: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onMoreMenuOpen?: (open: boolean) => void;
  size?: 'xsmall' | 'small' | 'medium' | 'large';
};

export function ActionMenu({
  actions,
  className,
  color,
  iconClassName,
  iconShape,
  iconVariant = 'icon',
  maxActions = 3,
  onClick,
  onMoreMenuOpen,
  size = 'small',
}: ActionMenuProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const currentActions = actions.length > maxActions ? actions.slice(0, maxActions - 1) : actions;
  const moreActions = actions.length > maxActions ? actions.slice(maxActions - 1) : [];
  const closeMoreMenu = () => {
    setIsMoreMenuOpen(false);
    onMoreMenuOpen?.(false);
  };
  return (
    <div className={className} onClick={onClick} style={{ display: 'flex', alignItems: 'center' }}>
      {currentActions.map((action, index) => (
        <IconButton
          key={`${action.id ?? action.title}-${index}`}
          symbol={action.icon}
          onClick={action.onClick}
          size={size}
          data-sign={action.id}
          disabled={action.disabled}
          label={action.title}
          shape={iconShape}
          variant={iconVariant}
          color={getIconButtonColor(action.color || color)}
          className={iconClassName}
        />
      ))}
      {moreActions.length > 0 ? (
        <IconButton
          ref={moreButtonRef}
          symbol={OverflowVerticalMd}
          onClick={(event) => {
            event.stopPropagation();
            setIsMoreMenuOpen(true);
            onMoreMenuOpen?.(true);
          }}
          size={size}
          shape={iconShape}
          variant={iconVariant}
          color={getIconButtonColor(color)}
          label="More actions"
          className={iconClassName}
        />
      ) : null}
      {moreActions.length > 0 ? (
        <Menu
          open={isMoreMenuOpen}
          onClose={closeMoreMenu}
          anchorEl={moreButtonRef.current}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {moreActions.map((action, index) => (
            <MenuItem
              key={`${action.id ?? action.title}-${index}`}
              onClick={(event) => {
                event.stopPropagation();
                action.onClick(event);
                closeMoreMenu();
              }}
              disabled={action.disabled}
            >
              <Icon symbol={action.icon} size="small" style={{ marginRight: 8 }} />
              <MenuItemText primary={action.title} />
            </MenuItem>
          ))}
        </Menu>
      ) : null}
    </div>
  );
}
