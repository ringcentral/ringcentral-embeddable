import { AppsMd, Xmd } from '@ringcentral/spring-icon';
import {
  Avatar,
  EmptyState,
  Icon,
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

import type { SideWidgetBlankInfo } from './getSideWidgetBlankInfo';
import { SIDE_WIDGET_APPS_TAB_ID } from './SideWidget.helper';
import type { SideWidgetTab } from './SideWidget.view.interface';
import { SideWidgetAppPanel } from './SideWidgetAppPanel';
import { SideWidgetBlankView } from './SideWidgetBlankView';
import { SideWidgetPageHeader } from './SideWidgetPageHeader';
import { t } from './i18n';

function AvailableApps({
  apps,
  onClose,
  onSelectApp,
  showCloseButton,
}: {
  apps: ThirdPartyApp[];
  onClose: () => void;
  onSelectApp: (appId: string) => void;
  showCloseButton: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SideWidgetPageHeader
        title={t('availableApps')}
        onClose={showCloseButton ? onClose : undefined}
        closeLabel={t('closeApps')}
        data-sign="sideWidgetAvailableAppsHeader"
        closeDataSign="sideWidgetClose"
      />
      {apps.length === 0 ? (
        <div className="flex flex-auto items-center justify-center">
          <EmptyState icon={AppsMd} title={t('noAvailableApps')} />
        </div>
      ) : (
        <ul
          className="grid flex-auto grid-cols-3 content-start gap-3 overflow-y-auto p-4"
          aria-label={t('availableApps')}
        >
          {apps.map((app) => {
            const appName = app.name || app.id;
            return (
              <li key={app.id} className="min-w-0">
                <button
                  type="button"
                  className="flex h-20 w-full min-w-0 flex-col items-center justify-center gap-2 rounded-sm border-0 bg-transparent p-2 text-neutral-b0 hover:bg-neutral-b5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobranding"
                  aria-label={t('openApp', { name: appName })}
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

function SideWidgetTabLabel({
  isActive,
  name,
  onClose,
  tabId,
}: {
  isActive: boolean;
  name: string;
  onClose: (event: React.SyntheticEvent) => void;
  tabId: string;
}): React.ReactElement {
  const closeLabel = t('closeTab', { name });
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="min-w-0 truncate">{name}</span>
      {isActive ? (
        <span
          aria-label={closeLabel}
          className="flex size-5 shrink-0 items-center justify-center rounded-full text-neutral-b2 hover:bg-neutral-b0-t10 hover:text-neutral-b0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobranding"
          data-sign={`sideWidgetCloseTab-${tabId}`}
          role="button"
          tabIndex={0}
          title={closeLabel}
          onClick={onClose}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
              return;
            }
            event.preventDefault();
            onClose(event);
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Icon symbol={Xmd} size="small" />
        </span>
      ) : null}
    </span>
  );
}

export function SideWidgetPanel({
  apps,
  tabs,
  currentTabId,
  selectedAppId,
  contact,
  pinAppIds,
  blankInfo,
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
  blankInfo: SideWidgetBlankInfo;
  onTabChange: (tabId: string) => void;
  onSelectApp: (appId: string) => void;
  onBack: () => void;
  onClose: () => void;
  onCloseTab: (tabId: string) => void;
  onTogglePin: (appId: string) => void;
  renderContent: (tabId: string, showCloseButton: boolean) => ReactNode;
  onLoadApp: (params: LoadAppPageParams) => Promise<unknown | null>;
}) {
  const selectedApp = selectedAppId
    ? apps.find(({ id }) => id === selectedAppId)
    : undefined;
  const showTabs = tabs.length > 1;
  // The Apps tab only exists when it was opened for a call or by the user. It
  // must not appear as a fallback: a drawer that stays open after its last
  // routed tab closed shows the blank view rather than opening Apps on its own.
  const showAppsTab = tabs.some(({ id }) => id === SIDE_WIDGET_APPS_TAB_ID);

  if (tabs.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-neutral-base">
        <SideWidgetBlankView info={blankInfo} onClose={onClose} />
      </div>
    );
  }

  return (
    <TabContext
      value={currentTabId}
      onChange={(_, value) => onTabChange(String(value))}
    >
      <div className="flex h-full flex-col overflow-hidden bg-neutral-base">
        {showTabs ? (
          <Tabs
            variant="moreMenu"
            className="h-9 flex-none px-1"
            data-sign="sideWidgetTabs"
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.id}
                id={`side-widget-tab-${encodeURIComponent(tab.id)}`}
                value={tab.id}
                label={
                  <SideWidgetTabLabel
                    isActive={currentTabId === tab.id}
                    name={tab.name}
                    tabId={tab.id}
                    onClose={(event) => {
                      event.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                  />
                }
                title={tab.name}
                className="flex h-9 flex-1 items-center p-0 pl-2 pr-2"
              />
            ))}
          </Tabs>
        ) : null}
        {showAppsTab ? (
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
                showCloseButton={!showTabs}
                onClose={() => onCloseTab(SIDE_WIDGET_APPS_TAB_ID)}
                onSelectApp={onSelectApp}
              />
            )}
          </TabPanel>
        ) : null}
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
                    showCloseButton={!showTabs}
                    onBack={() => onTabChange(SIDE_WIDGET_APPS_TAB_ID)}
                    onClose={() => onCloseTab(tab.id)}
                    onTogglePin={() => onTogglePin(app.id)}
                    onLoadApp={onLoadApp}
                  />
                ) : (
                  <div className="flex h-full flex-col overflow-hidden">
                    <SideWidgetPageHeader
                      title={tab.name}
                      onClose={showTabs ? undefined : () => onCloseTab(tab.id)}
                      closeLabel={t('closeAppTab')}
                    />
                    <div className="flex flex-auto items-center justify-center">
                      <EmptyState
                        icon={AppsMd}
                        title={t('appUnavailable')}
                        description={t('appNotRegistered')}
                      />
                    </div>
                  </div>
                )}
              </TabPanel>
            );
          })}
        {tabs
          .filter(({ id, appId }) => id !== SIDE_WIDGET_APPS_TAB_ID && !appId)
          .map((tab) => (
            <TabPanel
              key={tab.id}
              value={tab.id}
              keepMounted
              data-sign={`sideWidgetContent-${tab.id}`}
              className="min-h-0 flex-auto overflow-hidden p-0"
            >
              {renderContent(tab.id, !showTabs)}
            </TabPanel>
          ))}
      </div>
    </TabContext>
  );
}
