import React from 'react';

import { styled, palette2, focusVisible } from '@ringcentral/juno/foundation';
import {
  RcMenu,
  RcMenuItem,
  RcListItemText,
  RcListItemIcon,
  RcBadge,
} from '@ringcentral/juno';
import { getTabInfo } from './helper';
import { TabIcon } from './TabIcon';

const StyledMoreMenuText = styled(RcListItemText)`
  .RcListItemText-primary {
    font-size: 0.875rem;
  }
`;

const StyledMoreMenuItem = styled(RcMenuItem)`
  :hover,
  ${focusVisible} {
    background-color: ${palette2('nav', 'menuBg', 0.08)};
  }

  ${focusVisible} {
    box-shadow: inset 0px 0px 0px 1px ${palette2('action', 'primary')};
  }
`;

const StyledBadge = styled(RcBadge)`
  top: 3px;
`;

const StyledItemIcon = styled(RcListItemIcon)`
  img {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }
`;

export function MoreMenu({
  open,
  onClose,
  anchorEl,
  tabs = [],
  currentPath,
  goTo,
}) {
  return (
    <RcMenu
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
    >
      {
        tabs.map((tab, index) => {
          const active = tab.isActive?.(currentPath);
          const color = active ? 'nav.iconSelected' : 'nav.iconDefault';
          const tabIcon = (
            <TabIcon
              icon={tab.icon}
              activeIcon={tab.activeIcon}
              iconUri={tab.iconUri}
              activeIconUri={tab.activeIconUri}
              active={active}
              alt={tab.label}
            />
          );
          return (
            <StyledMoreMenuItem
              key={index}
              onClick={() => {
                goTo(tab);
                onClose();
              }}
              selected={active}
              icon={tab.noticeCounts && tab.noticeCounts > 0 ? (
                <StyledBadge
                  badgeContent={tab.noticeCounts}
                  max={99}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <StyledItemIcon>
                    { tabIcon }
                  </StyledItemIcon>
                </StyledBadge>
              ) : (
                <StyledItemIcon>
                  { tabIcon }
                </StyledItemIcon>
              )}
              color={color}
              data-sign={tab.dataSign || tab.label}
            >
              <StyledMoreMenuText
                primary={tab.label}
                primaryTypographyProps={{
                  variant: 'body1',
                  color,
                }}
              />
            </StyledMoreMenuItem>
          )
        })
      }
    </RcMenu>
  );
}
