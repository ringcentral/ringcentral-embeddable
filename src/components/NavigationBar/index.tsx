import React, { useEffect, useState, useRef } from 'react';

import { styled, palette2, shadows } from '@ringcentral/juno/foundation';
import { RcList } from '@ringcentral/juno';
import { useEventCallback, useMountState } from '@ringcentral/juno';

import type {
  TabPropTypes,
} from '@ringcentral-integration/widgets/components/NavigationBar/NavigationBar.interface';
import { MoreMenu } from './MoreMenu';
import { NavigationButton } from '../NavigationButton';
import { getTabInfo } from './helper';

const StyledRcList = styled(RcList)`
  display: flex;
  flex-direction: row;
  flex-grow: 10000;
  flex-shrink: 1;
  align-items: center;
  justify-content: space-around;
  height: 60px;
  overflow: hidden;
  gap: 0px;
  padding: 0px 2px;
  background-color: ${palette2('nav', 'b01')};
  box-sizing: border-box;
  box-shadow: ${shadows('3')};
  width: 100%;
  z-index: 10;
`;

export const NavigationBar = ({
  tabs = [],
  currentVirtualPath: currentVirtualPathProp,
  goTo: goToProp,
  currentPath,
}) => {
  const [currentVirtualPath, setCurrentVirtualPath] = useState(
    currentVirtualPathProp,
  );
  const isMounted = useMountState();

  const setCurrentRouteState = useEventCallback((path: string) => {
    if (isMounted.current) {
      setCurrentVirtualPath(path);
    }
  });

  const goTo = async (tab: TabPropTypes) => {
    await goToProp?.(tab.path, tab.virtualPath);

    // @ts-expect-error TS(2345): Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
    setCurrentRouteState(tab.virtualPath);
  };

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreTabRef = useRef<HTMLDivElement>(null);
  const moreTab = tabs.find((tab) => tab.virtualPath === '!moreMenu');
  let moreTabInfo = moreTab ? getTabInfo({
    tab: moreTab,
    currentPath,
    currentVirtualPath,
  }) : null;

  useEffect(() => {
    if (currentVirtualPath) {
      setCurrentRouteState(currentVirtualPath);
    }
  }, [currentVirtualPath, setCurrentRouteState]);

  return (
    <StyledRcList
      role="tablist"
    >
      {
        tabs.filter(tab => {
          return tab.virtualPath !== '!moreMenu'
        }).map((tab, index) => {
          const { active, icon, activeIcon } = getTabInfo({
            tab,
            currentPath,
            currentVirtualPath,
          });
          return (
            <NavigationButton
              icon={icon}
              activeIcon={activeIcon}
              key={index}
              label={tab.label}
              active={active}
              onClick={() => goTo(tab)}
              dataSign={tab.dataSign}
              noticeCounts={tab.noticeCounts}
            />
          )
        })
      }
      {
        moreTab ? (
          <>
            <NavigationButton
              icon={moreTabInfo.icon}
              activeIcon={moreTabInfo.activeIcon}
              label={moreTab.label}
              active={moreTabInfo.active}
              innerRef={moreTabRef}
              onClick={() => {
                setMoreMenuOpen(!moreMenuOpen);
              }}
              dataSign={moreTab.dataSign}
              noticeCounts={moreTab.noticeCounts}
            />
            <MoreMenu
              open={moreMenuOpen}
              anchorEl={moreTabRef.current}
              onClose={() => {
                setMoreMenuOpen(false);
              }}
              tabs={moreTab.childTabs}
              goTo={goTo}
              currentPath={currentPath}
              currentVirtualPath={currentVirtualPath}
            />
          </>
        ) : null
      }
    </StyledRcList>
  );
};
