import type { NavigationButtonProps } from '../NavigationButton';

export interface TabPropTypes extends Partial<NavigationButtonProps> {
  path: string;
  virtualPath?: string;
  isActive: (path: string, virtualPath?: string) => boolean;
  noticeCounts?: number;
  childTabs?: TabPropTypes[];
  showHeader: (path: string) => boolean;
}

export interface NavigationBarProps {
  tabs: TabPropTypes[];
  goTo?: (path: string, virtualPath?: string) => any;
  currentPath: string;
  currentVirtualPath?: string;
}
