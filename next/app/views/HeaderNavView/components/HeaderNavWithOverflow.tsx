import React from 'react';

import { HeaderNav } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/HeaderNav';
import { NavButton } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/HeaderNav/NavButton';
import type { HeaderNavPanelProps } from '@ringcentral-integration/micro-core/src/app/views/HeaderNavViewSpring/HeaderNav.view.interface';

import { OverflowMenuButton } from './OverflowMenuButton';

const MAX_VISIBLE_TABS = 5;
const VISIBLE_WHEN_OVERFLOW = 4;

export const HeaderNavWithOverflow = (props: HeaderNavPanelProps) => {
  const { tabs, onChange, currentPath, ...rest } = props;

  if (tabs.length <= MAX_VISIBLE_TABS) {
    return <HeaderNav {...props} />;
  }

  const visibleTabs = tabs.slice(0, VISIBLE_WHEN_OVERFLOW);
  const overflowTabs = tabs.slice(VISIBLE_WHEN_OVERFLOW);

  const isOverflowActive = overflowTabs.some(
    (tab) => tab.active ?? currentPath === tab.to,
  );

  const totalBadgeCount = overflowTabs.reduce(
    (sum, tab) => sum + (Number(tab.BadgeProps?.count) || 0),
    0,
  );

  return (
    <nav
      className="bg-neutral-b5/50 border-t border-neutral-b0-t20 grid auto-fit-0 flex-none h-[52px]"
      data-sign="nav-bar"
    >
      {visibleTabs.map((tab, index) => (
        <NavButton
          {...tab}
          BadgeProps={{
            size: 'small',
            ...(tab.BadgeProps ?? {}),
          }}
          active={tab.active ?? currentPath === tab.to}
          key={index}
          onClick={(e, path) => {
            onChange?.(path);
            tab.onClick?.(e, path);
          }}
        />
      ))}
      <OverflowMenuButton
        overflowTabs={overflowTabs}
        isActive={isOverflowActive}
        totalBadgeCount={totalBadgeCount}
        currentPath={currentPath}
        onChange={onChange}
      />
    </nav>
  );
};
