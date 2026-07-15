import { AppsMd, Xmd } from '@ringcentral/spring-icon';
import {
  Avatar,
  EmptyState,
  IconButton,
  PageHeader,
  PageHeaderCenter,
  PageHeaderLeft,
  PageHeaderRight,
  PageHeaderTitle,
  Tab,
  TabContext,
  TabPanel,
  Tabs,
  Text,
} from '@ringcentral/spring-ui';
import React, { type ReactNode } from 'react';

import type {
  LoadAppPageParams,
  ThirdPartyApp,
  ThirdPartyWidgetContact,
} from '../../services/ThirdParty';

import { SIDE_WIDGET_APPS_TAB_ID } from './SideWidget.helper';
import type { SideWidgetTab } from './SideWidget.view.interface';
import { SideWidgetAppPanel } from './SideWidgetAppPanel';

function AvailableApps({
  apps,
  onClose,
  onSelectApp,
}: {
  apps: ThirdPartyApp[];
  onClose: () => void;
  onSelectApp: (appId: string) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        variant="detached"
        className="flex-none border-b border-neutral-b4"
        data-sign="sideWidgetAvailableAppsHeader"
      >
        <PageHeaderLeft />
        <PageHeaderCenter data-sign="sideWidgetAvailableAppsHeaderCenter">
          <PageHeaderTitle>Available apps</PageHeaderTitle>
        </PageHeaderCenter>
        <PageHeaderRight>
          <IconButton
            variant="icon"
            color="secondary"
            size="medium"
            symbol={Xmd}
            data-sign="sideWidgetClose"
            TooltipProps={{ title: 'Close apps' }}
            onClick={onClose}
          />
        </PageHeaderRight>
      </PageHeader>
      {apps.length === 0 ? (
        <div className="flex flex-auto items-center justify-center">
          <EmptyState icon={AppsMd} title="No available apps" />
        </div>
      ) : (
        <ul
          className="grid flex-auto grid-cols-3 content-start gap-3 overflow-y-auto p-4"
          aria-label="Available apps"
        >
          {apps.map((app) => {
            const appName = app.name || app.id;
            return (
              <li key={app.id} className="min-w-0">
                <button
                  type="button"
                  className="flex h-20 w-full min-w-0 flex-col items-center justify-center gap-2 rounded-sm border-0 bg-transparent p-2 text-neutral-b0 hover:bg-neutral-b5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobranding"
                  aria-label={`Open ${appName}`}
                  data-sign={`sideWidgetApp-${app.id}`}
                  onClick={() => onSelectApp(app.id)}
                >
                  <Avatar
                    alt={appName}
                    src={app.iconUri}
                    size="large"
                    variant="squircle"
                  >
                    {appName.slice(0, 1)}
                  </Avatar>
                  <Text
                    component="span"
                    className="typography-descriptor w-full truncate text-center text-neutral-b0"
                    title={appName}
                    titleWhenOverflow={500}
                    noWrap
                  >
                    {appName}
                  </Text>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SideWidgetPanel({
  apps,
  tabs,
  currentTabId,
  selectedAppId,
  contact,
  pinAppIds,
  onTabChange,
  onSelectApp,
  onBack,
  onClose,
  onCloseTab,
  onTogglePin,
  renderContent,
  onLoadApp,
}: {
  apps: ThirdPartyApp[];
  tabs: SideWidgetTab[];
  currentTabId: string;
  selectedAppId: string | null;
  contact: ThirdPartyWidgetContact | null;
  pinAppIds: string[];
  onTabChange: (tabId: string) => void;
  onSelectApp: (appId: string) => void;
  onBack: () => void;
  onClose: () => void;
  onCloseTab: (tabId: string) => void;
  onTogglePin: (appId: string) => void;
  renderContent: (tabId: string) => ReactNode;
  onLoadApp: (params: LoadAppPageParams) => Promise<unknown | null>;
}) {
  const selectedApp = selectedAppId
    ? apps.find(({ id }) => id === selectedAppId)
    : undefined;

  return (
    <TabContext
      value={currentTabId}
      onChange={(_, value) => onTabChange(String(value))}
    >
      <div className="flex h-full flex-col overflow-hidden bg-neutral-base">
        {tabs.length > 1 ? (
          <Tabs
            variant="moreMenu"
            size="small"
            className="flex-none border-b border-neutral-b4 bg-neutral-b5 px-2"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                id={`side-widget-tab-${encodeURIComponent(tab.id)}`}
                value={tab.id}
                label={tab.name}
                title={tab.name}
              />
            ))}
          </Tabs>
        ) : null}
        <TabPanel
          value={SIDE_WIDGET_APPS_TAB_ID}
          className="min-h-0 flex-auto overflow-hidden p-0"
        >
          {selectedApp ? (
            <SideWidgetAppPanel
              app={selectedApp}
              contact={contact}
              isPinned={pinAppIds.includes(selectedApp.id)}
              showBack
              showCloseButton={false}
              onBack={onBack}
              onClose={onBack}
              onTogglePin={() => onTogglePin(selectedApp.id)}
              onLoadApp={onLoadApp}
            />
          ) : (
            <AvailableApps
              apps={apps}
              onClose={() =>
                tabs.length > 1
                  ? onCloseTab(SIDE_WIDGET_APPS_TAB_ID)
                  : onClose()
              }
              onSelectApp={onSelectApp}
            />
          )}
        </TabPanel>
        {tabs
          .filter((tab) => tab.appId)
          .map((tab) => {
            const app = apps.find(({ id }) => id === tab.appId);
            return (
              <TabPanel
                key={tab.id}
                value={tab.id}
                className="min-h-0 flex-auto overflow-hidden p-0"
              >
                {app ? (
                  <SideWidgetAppPanel
                    app={app}
                    contact={contact}
                    isPinned={pinAppIds.includes(app.id)}
                    showBack={false}
                    showCloseButton
                    onBack={() => onTabChange(SIDE_WIDGET_APPS_TAB_ID)}
                    onClose={() => onCloseTab(tab.id)}
                    onTogglePin={() => onTogglePin(app.id)}
                    onLoadApp={onLoadApp}
                  />
                ) : (
                  <div className="flex h-full flex-col overflow-hidden">
                    <PageHeader
                      variant="detached"
                      className="flex-none border-b border-neutral-b4"
                    >
                      <PageHeaderLeft />
                      <PageHeaderCenter>
                        <PageHeaderTitle>{tab.name}</PageHeaderTitle>
                      </PageHeaderCenter>
                      <PageHeaderRight>
                        <IconButton
                          variant="icon"
                          color="secondary"
                          size="small"
                          symbol={Xmd}
                          TooltipProps={{ title: 'Close app tab' }}
                          onClick={() => onCloseTab(tab.id)}
                        />
                      </PageHeaderRight>
                    </PageHeader>
                    <div className="flex flex-auto items-center justify-center">
                      <EmptyState
                        icon={AppsMd}
                        title="App unavailable"
                        description="This app is no longer registered."
                      />
                    </div>
                  </div>
                )}
              </TabPanel>
            );
          })}
        {tabs
          .filter(
            ({ id, appId }) => id !== SIDE_WIDGET_APPS_TAB_ID && !appId,
          )
          .map((tab) => (
            <TabPanel
              key={tab.id}
              value={tab.id}
              keepMounted
              data-sign={`sideWidgetContent-${tab.id}`}
              className="min-h-0 flex-auto overflow-hidden p-0"
            >
              {renderContent(tab.id)}
            </TabPanel>
          ))}
      </div>
    </TabContext>
  );
}
