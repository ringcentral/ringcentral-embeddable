import React from 'react';

import type { NavigationButtonIcon } from '@ringcentral-integration/widgets/components/TabNavigationButton';
import type {
  NavigationBarProps,
} from '@ringcentral-integration/widgets/components/NavigationBar/NavigationBar.interface';

export function getTabInfo({
  tab,
  currentPath,
  currentVirtualPath,
}: Pick<NavigationBarProps, 'currentPath' | 'currentVirtualPath'> & {
  tab: NavigationBarProps['tabs'][number];
}) {
  const active =
    tab.isActive?.(currentPath, currentVirtualPath) ||
    (tab.path && tab.path === currentPath) ||
    (tab.virtualPath && tab.virtualPath === currentVirtualPath) ||
    tab.childTabs?.some(
      (childTab) =>
        childTab.path === currentPath ||
        childTab.path === currentPath.slice(0, 9),
    );

  const activeAttr = active ? 'true' : '';

  function getIcon(icon: NavigationButtonIcon | undefined) {
    if (!icon) return icon;

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        // @ts-expect-error
        active: activeAttr,
      });
    }

    const Icon = icon;

    return tab.childTabs ? <Icon currentPath={currentPath} active={active} /> : <Icon active={active} />;
  }

  const { icon, activeIcon } = tab;

  return {
    icon: getIcon(icon),
    activeIcon: getIcon(activeIcon),
    active,
  };
}
