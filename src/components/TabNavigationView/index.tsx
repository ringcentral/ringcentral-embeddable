import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';

import type { NavigationBarProps } from '@ringcentral-integration/widgets/components/NavigationBar';
import { styled } from '@ringcentral/juno/foundation';
import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';

import { NavigationBar } from '../NavigationBar';

export interface TabNavigationViewProps {
  children?: ReactNode;
  className?: string;
  currentPath: string;
  currentVirtualPath?: string;
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
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const ContentView = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 10;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  max-height: calc(100% - 60px);
`;

export const TabNavigationView: FunctionComponent<TabNavigationViewProps> = ({
  onLoading,
  holdReady,
  tabs,
  goTo,
  currentPath,
  currentVirtualPath,
  children,
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
      currentVirtualPath={currentVirtualPath}
    />
  );

  return (
    <Container>
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
