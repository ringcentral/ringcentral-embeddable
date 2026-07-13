import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import { Theme } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  injectable,
  optional,
  RcViewModule,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import {
  ThirdParty,
  type LoadAppPageParams,
  type ThirdPartyApp,
  type ThirdPartyWidgetContact,
} from '../../services/ThirdParty';
import { ExpandedView } from '../ExpandedView';

import {
  getSideWidgetAppTabId,
  getSideWidgetContact,
  isSameSideWidgetContact,
  SIDE_WIDGET_APPS_TAB_ID,
} from './SideWidget.helper';
import type {
  SideWidgetOptions,
  SideWidgetTab,
} from './SideWidget.view.interface';
import { SideWidgetPanel } from './SideWidgetPanel';

function createAppsTab(): SideWidgetTab {
  return {
    id: SIDE_WIDGET_APPS_TAB_ID,
    name: 'Apps',
  };
}

@injectable({
  name: 'SideWidgetView',
})
export class SideWidgetView extends RcViewModule {
  constructor(
    private _expandedView: ExpandedView,
    private _thirdParty: ThirdParty,
    private _theme: Theme,
    @optional('SideWidgetOptions')
    private _sideWidgetOptions?: SideWidgetOptions,
  ) {
    super();
  }

  @state
  tabs: SideWidgetTab[] = [createAppsTab()];

  @state
  currentTabId = SIDE_WIDGET_APPS_TAB_ID;

  @state
  selectedAppId: string | null = null;

  @state
  currentContact: ThirdPartyWidgetContact | null = null;

  get enabled(): boolean {
    return this._sideWidgetOptions?.enableSideWidget ?? false;
  }

  @action
  openApps(contact: ThirdPartyWidgetContact): void {
    if (!this.enabled || this._thirdParty.apps.length === 0) {
      return;
    }
    this._setContact(contact);
    this._ensureAppsTab();
    this.currentTabId = SIDE_WIDGET_APPS_TAB_ID;
    this.selectedAppId = null;
    this._expandedView.open(this._expandedHandle);
  }

  @action
  openAppTab(
    app: ThirdPartyApp,
    contact: ThirdPartyWidgetContact | null,
  ): void {
    if (!this.enabled) {
      return;
    }
    if (contact) {
      this._setContact(contact);
    }
    this._ensureAppsTab();
    const tabId = getSideWidgetAppTabId(app.id);
    const tab: SideWidgetTab = {
      id: tabId,
      appId: app.id,
      name: app.name || app.id,
    };
    this.tabs = this.tabs.some(({ id }) => id === tabId)
      ? this.tabs.map((item) => (item.id === tabId ? tab : item))
      : this.tabs.concat(tab);
    this.currentTabId = tabId;
    this.selectedAppId = null;
  }

  @action
  selectTab(tabId: string): void {
    if (!this.tabs.some(({ id }) => id === tabId)) {
      return;
    }
    this.currentTabId = tabId;
  }

  @action
  selectApp(appId: string): void {
    const app = this._thirdParty.apps.find(({ id }) => id === appId);
    if (!app) {
      return;
    }
    if (this._thirdParty.pinAppIds.includes(appId)) {
      this.openAppTab(app, this.currentContact);
      return;
    }
    this.selectedAppId = appId;
  }

  @action
  showApps(): void {
    this.currentTabId = SIDE_WIDGET_APPS_TAB_ID;
    this.selectedAppId = null;
  }

  @action
  closeAppTab(tabId: string): void {
    if (tabId === SIDE_WIDGET_APPS_TAB_ID) {
      this.close();
      return;
    }
    const tabIndex = this.tabs.findIndex(({ id }) => id === tabId);
    if (tabIndex < 0) {
      return;
    }
    const nextTabs = this.tabs.filter(({ id }) => id !== tabId);
    this.tabs = nextTabs;
    if (this.currentTabId === tabId) {
      this.currentTabId =
        nextTabs[Math.max(0, tabIndex - 1)]?.id ?? SIDE_WIDGET_APPS_TAB_ID;
    }
  }

  toggleAppPin(appId: string): void {
    const app = this._thirdParty.apps.find(({ id }) => id === appId);
    if (!app) {
      return;
    }
    const wasPinned = this._thirdParty.pinAppIds.includes(appId);
    this._thirdParty.toggleAppPin(appId);
    if (!wasPinned) {
      this.openAppTab(app, this.currentContact);
    }
  }

  close(): void {
    this._expandedView.close();
  }

  onCallRing(session: NormalizedSession): void {
    this.openApps(getSideWidgetContact(session, 'from'));
  }

  onCallInit(session: NormalizedSession): void {
    const contact = getSideWidgetContact(session, 'to');
    this.openApps(contact);
    this._thirdParty.pinAppIds.forEach((appId) => {
      const app = this._thirdParty.apps.find(({ id }) => id === appId);
      if (app) {
        this.openAppTab(app, contact);
      }
    });
  }

  private _setContact(contact: ThirdPartyWidgetContact): void {
    if (!isSameSideWidgetContact(this.currentContact, contact)) {
      this.tabs = [createAppsTab()];
      this.selectedAppId = null;
    }
    this.currentContact = contact;
  }

  private _ensureAppsTab(): void {
    if (this.tabs.some(({ id }) => id === SIDE_WIDGET_APPS_TAB_ID)) {
      return;
    }
    this.tabs = [createAppsTab(), ...this.tabs];
  }

  private _expandedHandle = this._expandedView.create({
    view: () => {
      const uiProps = useConnector(() => ({
        apps: this._thirdParty.apps.map((app) => {
          // Track the fields rendered by the panel without changing app identity.
          void app.name;
          void app.description;
          void app.iconUri;
          return app;
        }),
        tabs: this.tabs,
        currentTabId: this.currentTabId,
        selectedAppId: this.selectedAppId,
        currentContact: this.currentContact,
        pinAppIds: this._thirdParty.pinAppIds.slice(),
      }));
      const { current: uiFunctions } = useRef({
        onTabChange: (tabId: string) => this.selectTab(tabId),
        onSelectApp: (appId: string) => this.selectApp(appId),
        onBack: () => this.showApps(),
        onClose: () => this.close(),
        onCloseAppTab: (tabId: string) => this.closeAppTab(tabId),
        onTogglePin: (appId: string) => this.toggleAppPin(appId),
        onLoadApp: (params: LoadAppPageParams) =>
          this._thirdParty.loadAppPage({
            ...params,
            theme: this._theme.themeType,
          }),
      });
      return (
        <SideWidgetPanel
          apps={uiProps.apps}
          tabs={uiProps.tabs}
          currentTabId={uiProps.currentTabId}
          selectedAppId={uiProps.selectedAppId}
          contact={uiProps.currentContact}
          pinAppIds={uiProps.pinAppIds}
          {...uiFunctions}
        />
      );
    },
  });

  component() {
    return null;
  }
}
