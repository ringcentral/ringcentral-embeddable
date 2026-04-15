import { Badge, Icon, Menu, MenuItem, MenuItemText, MenuList } from '@ringcentral/spring-ui';
import { OverflowMd } from '@ringcentral/spring-icon';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';

import type { NavButtonProps } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/HeaderNav.view.interface';

interface OverflowMenuButtonProps {
  overflowTabs: NavButtonProps[];
  isActive: boolean;
  totalBadgeCount: number;
  currentPath?: string;
  onChange?: (path: string) => void;
}

export const OverflowMenuButton = ({
  overflowTabs,
  isActive,
  totalBadgeCount,
  currentPath,
  onChange,
}: OverflowMenuButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback(
    (to: string) => {
      onChange?.(to);
      setAnchorEl(null);
    },
    [onChange],
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={clsx(
          'flex flex-col items-center justify-center',
          isActive || menuOpen ? 'text-cobranding-f' : 'text-neutral-b0',
        )}
        data-sign="moreTab"
      >
        <div className="relative flex">
          <Icon symbol={OverflowMd} size="medium" />
          {totalBadgeCount > 0 && (
            <div className="absolute top-2 left-6">
              <Badge
                variant="outlined"
                overlap="rectangular"
                forceOverlap
                size="small"
                max={99}
                count={totalBadgeCount}
              />
            </div>
          )}
        </div>
        <div className="w-10/12 text-ellipsis overflow-hidden typography-mainText">
          <span className="typography-descriptorMini whitespace-normal text-center">
            More
          </span>
        </div>
      </button>
      <Menu
        open={menuOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
      >
        <MenuList>
          {overflowTabs.map((tab, index) => {
            const tabActive = tab.active ?? currentPath === tab.to;
            const badgeCount = Number(tab.BadgeProps?.count) || 0;
            return (
              <MenuItem
                key={tab.to || index}
                highlighted={tabActive}
                onClick={() => handleMenuItemClick(tab.to)}
                data-sign={
                  tab.dataSign ? `overflow-${tab.dataSign}` : undefined
                }
              >
                <Icon
                  symbol={tabActive ? tab.activeSymbol : tab.symbol}
                  size="small"
                />
                <MenuItemText primary={tab.title} />
                {badgeCount > 0 && (
                  <Badge
                    size="small"
                    variant="outlined"
                    count={badgeCount}
                    max={99}
                  />
                )}
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
    </>
  );
};
