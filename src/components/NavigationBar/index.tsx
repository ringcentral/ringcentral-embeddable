import type { FunctionComponent } from 'react';
import React, { useState, useRef } from 'react';

import { styled, palette2, shadows } from '@ringcentral/juno/foundation';
import { RcList } from '@ringcentral/juno';

import type { TabPropTypes, NavigationBarProps } from './interface.ts';
import { MoreMenu } from './MoreMenu';
import { NavigationButton } from '../NavigationButton';
import { getTabInfo } from './helper';

const StyledRcList = styled(RcList)`
  display: flex;
  flex-direction: row;
  flex-shrink: 1;
  align-items: center;
  justify-content: space-around;
  overflow: hidden;
  gap: 0px;
  padding: 0px 2px;
  background-color: ${palette2('nav', 'b01')};
  box-sizing: border-box;
  box-shadow: ${shadows('3')};
  width: 100%;
  height: 60px;
  z-index: 10;
`;

export const NavigationBar: FunctionComponent<NavigationBarProps> = ({
  tabs = [],
  goTo: goToProp,
  currentPath,
}) => {
  const goTo = async (tab: TabPropTypes) => {
    await goToProp?.(tab.path);
  };

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreTabRef = useRef<HTMLDivElement>(null);
  const moreTab = tabs.find((tab) => tab.path === '!moreMenu');
  let moreTabInfo = moreTab ? getTabInfo({
    tab: moreTab,
    currentPath,
  }) : null;

  return (
    <StyledRcList
      role="tablist"
    >
      {
        tabs.filter(tab => {
          return tab.path !== '!moreMenu'
        }).map((tab, index) => {
          const { active, icon, activeIcon } = getTabInfo({
            tab,
            currentPath,
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
            />
          </>
        ) : null
      }
    </StyledRcList>
  );
};
