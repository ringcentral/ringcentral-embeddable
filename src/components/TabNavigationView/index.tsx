import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';

import classnames from 'classnames';

import DropdownNavigationView from '@ringcentral-integration/widgets/components/DropdownNavigationView';
import type { NavigationBarProps } from '@ringcentral-integration/widgets/components/NavigationBar';

import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';

import { NavigationBar } from '../NavigationBar';
import TabNavigationButton from '../TabNavigationButton';
import styles from './styles.scss';

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

const TabNavigationView: FunctionComponent<TabNavigationViewProps> = ({
  navigationPosition,
  navBarClassName,
  onLoading,
  brandIcon,
  holdReady,
  className,
  tabs,
  goTo,
  tabWidth,
  tabHeight,
  currentPath,
  currentVirtualPath,
  tabNavigationViewClassName,
  tooltipForceHide,
  children,
}) => {
  if (onLoading) {
    return <SpinnerOverlay />;
  }

  if (holdReady) return null;

  const isVertical = navigationPosition === 'left';

  const navBar = (
    <NavigationBar
      button={TabNavigationButton}
      tooltipForceHide={tooltipForceHide}
      // @ts-expect-error TS(2322): Type 'FunctionComponent<DropdownNavigationViewProp... Remove this comment to see the full error message
      childNavigationView={DropdownNavigationView}
      tabs={tabs}
      goTo={goTo}
      tabWidth={tabWidth}
      tabHeight={tabHeight}
      currentPath={currentPath}
      direction={isVertical ? 'vertical' : undefined}
      currentVirtualPath={currentVirtualPath}
      className={navBarClassName}
      role="tablist"
    />
  );

  return (
    <div
      className={classnames(
        styles.root,
        className,
        navigationPosition === 'left' && styles.vertical,
      )}
    >
      <div className={styles.tabContainer}>
        {navigationPosition === 'top' || navigationPosition === 'left' ? (
          <>
            {navBar}
            {navigationPosition === 'left' ? brandIcon : null}
          </>
        ) : null}
      </div>
      <div
        data-sign="tabNavigationView"
        className={classnames(
          styles.main,
          tabNavigationViewClassName,
          !isVertical && styles.hasMaxHeight,
        )}
      >
        {children}
      </div>
      {navigationPosition === 'bottom' ? <>{navBar}</> : null}
    </div>
  );
};

TabNavigationView.defaultProps = {
  children: null,
  navigationPosition: 'top',
  brandIcon: null,
  holdReady: false,
  onLoading: false,
};

export default TabNavigationView;
