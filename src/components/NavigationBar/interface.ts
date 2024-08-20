import type { ReactElement } from 'react';
import type { NavigationButtonProps } from './NavigationButton';

interface ActionInHeader {
  icon: ReactElement,
  onClick: () => void,
  title: string,
}

export interface TabPropTypes extends Partial<NavigationButtonProps> {
  path: string;
  virtualPath?: string;
  isActive: (path: string, virtualPath?: string) => boolean;
  noticeCounts?: number;
  childTabs?: TabPropTypes[];
  showHeader: (path: string) => boolean;
  showHeaderBorder?: boolean;
  actionsInHeaderRight?: ActionInHeader[];
}

export interface NavigationBarProps {
  tabs: TabPropTypes[];
  goTo?: (path: string, virtualPath?: string) => any;
  currentPath: string;
  currentVirtualPath?: string;
}
