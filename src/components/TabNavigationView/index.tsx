import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';

import { styled } from '@ringcentral/juno/foundation';

import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import type { NavigationBarProps } from '../NavigationBar/interface';
import { NavigationBar } from '../NavigationBar';
import { NavigationHeader } from '../NavigationHeader';
export interface TabNavigationViewProps {
  children?: ReactNode;
  className?: string;
  currentPath: string;
  goTo: NavigationBarProps['goTo'];
  navigationPosition?: 'top' | 'bottom' | 'left';
  brandIcon?: ReactNode;
  tabWidth?: string;
  tabHeight?: string;
  tabs: NavigationBarProps['tabs'];
  holdReady?: boolean;
  navBarClassName?: string;
  tabNavigationViewClassName?: string;
  onLoading?: boolean;
  tooltipForceHide?: boolean;
  supportSideDrawer?: boolean;
  sideDrawerOpen?: boolean;
  toggleSideDrawer?: () => void;
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ContentView = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  z-index: 10;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  flex: 1;
`;

function getCurrentTab(
  tabs: NavigationBarProps['tabs'],
  currentPath: string,
) {
  let tab = tabs.find((tab) => {
    return tab.isActive(currentPath)
  });
  if (tab && tab.childTabs) {
    return tab.childTabs.find((childTab) => {
      return childTab.isActive(currentPath)
    });
  }
  return tab;
}

export const TabNavigationView: FunctionComponent<TabNavigationViewProps> = ({
  onLoading,
  holdReady,
  tabs,
  goTo,
  currentPath,
  children,
  supportSideDrawer,
  sideDrawerOpen,
  toggleSideDrawer,
}) => {
  if (onLoading) {
    return <SpinnerOverlay />;
  }

  if (holdReady) return null;

  const navBar = (
    <NavigationBar
      tabs={tabs}
      goTo={goTo}
      currentPath={currentPath}
    />
  );
  const currentTab = getCurrentTab(tabs, currentPath);
  const showHeader = currentTab ? currentTab.showHeader(currentPath) : false;
  return (
    <Container>
      {
        showHeader ? (
          <NavigationHeader
            title={currentTab.label}
            showHeaderBorder={currentTab.showHeaderBorder}
            actionsInHeaderRight={currentTab.actionsInHeaderRight}
            supportSideDrawer={supportSideDrawer && currentTab.showSideDrawerButton}
            sideDrawerOpen={sideDrawerOpen}
            toggleSideDrawer={toggleSideDrawer}
          />
        ) : null
      }
      <ContentView
        data-sign="tabNavigationView"
      >
        {children}
      </ContentView>
      {navBar}
    </Container>
  );
};

TabNavigationView.defaultProps = {
  children: null,
  holdReady: false,
  onLoading: false,
};
