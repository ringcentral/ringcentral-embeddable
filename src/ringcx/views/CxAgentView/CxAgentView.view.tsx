import {
  computed,
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  type UIFunctions,
  type UIProps,
  useConnector,
  useIsMainClient,
} from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  SyncTabView,
  type SyncTabProps,
} from '@ringcentral-integration/micro-core/src/app/views';
import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import { CxDialerView } from '../CxDialerView';
import { CxLeadsView } from '../CxLeadsView';
import { CxCallHistoryView } from '../CxCallHistoryView';
import { CxWorkingStateSelectView } from '../CxWorkingStateSelectView';
import { CxOffhookButtonView } from '../CxOffhookButtonView';
import { CxAgentSession } from '../../services/CxAgentSession';

import type {
  CxAgentViewOptions,
  CxAgentViewProps,
  CxAgentViewPanelProps,
} from './CxAgentView.interface';
import i18n from './i18n';
import { cxPath } from '../../routes';

/**
 * Sync Tab ID for Agent View tabs
 */
export const AGENT_TAB_ID = 'agentTabs';

/**
 * CxAgentView - Tabbed view for agent operations
 * Displays dialer, leads, and history tabs using SyncTabView
 */
@injectable({
  name: 'CxAgentView',
})
class CxAgentView extends RcViewModule {
  constructor(
    protected _router: RouterPlugin,
    protected _syncTabView: SyncTabView,
    protected _dialerView: CxDialerView,
    protected _leadsView: CxLeadsView,
    protected _callHistoryView: CxCallHistoryView,
    protected _workingStateSelectView: CxWorkingStateSelectView,
    protected _offhookButtonView: CxOffhookButtonView,
    protected _cxAgentSession: CxAgentSession,
    @optional('CxAgentViewOptions')
    protected _agentViewOptions?: CxAgentViewOptions,
  ) {
    super();
  }

  @computed
  get isPreviewDialMode(): boolean {
    return this._cxAgentSession.currentDialMode === 'PREVIEW';
  }

  @computed
  get tabs(): SyncTabProps['tabs'] {
    const tabs: SyncTabProps['tabs'] = [
      {
        id: 'dialer',
        label: i18n.getString('dialer'),
        component: <this._dialerView.component />,
      },
    ];
    if (this.isPreviewDialMode) {
      tabs.push({
        id: 'leads',
        label: i18n.getString('leads'),
        component: <this._leadsView.component />,
      });
    }
    tabs.push({
      id: 'history',
      label: i18n.getString('history'),
      component: <this._callHistoryView.component />,
    });
    return tabs;
  }

  get defaultTab(): string {
    return this._agentViewOptions?.defaultTab ?? 'dialer';
  }

  getUIProps(_props: CxAgentViewProps): UIProps<CxAgentViewPanelProps> {
    return {
      tabs: this.tabs,
      currentTab: this.defaultTab,
    };
  }

  getUIFunctions(_props: CxAgentViewProps): UIFunctions<CxAgentViewPanelProps> {
    return {};
  }

  component(props?: CxAgentViewProps) {
    const { t } = useLocale(i18n);
    const isMainClient = useIsMainClient();
    const [routeTabId, setRouteTabId] = useState<string | null>(null);

    const { tabs } = useConnector(() => {
      const uiProps = this.getUIProps(props ?? {});
      return {
        ...props,
        ...uiProps,
      };
    });

    // Allow user to switch to the tab by URL
    this._router.useParams<{ tabId: string | undefined }>((params) => {
      const tabId = params.tabId;
      if (tabId && isMainClient) {
        setRouteTabId(tabId);
      }
    });

    useEffect(() => {
      if (!routeTabId || !tabs.some((tab) => tab.id === routeTabId)) {
        return;
      }
      setRouteTabId(null);
      // This view can still be mounted on a location the router has already
      // left, a call page for example, and a tab asked for by a path that is
      // no longer current must not pull the agent back to it.
      if (this._router.currentPath !== cxPath.home(routeTabId)) {
        return;
      }
      // `replaceActive` writes the tab into the location state itself, which
      // is what syncs it to the other ports.
      this._syncTabView.replaceActive(AGENT_TAB_ID, routeTabId);
    }, [routeTabId, tabs]);
    return (
      <>
        <AppHeaderNav
          title={t('agentTitle')}
        >
          <this._workingStateSelectView.component />
          <this._offhookButtonView.component />
        </AppHeaderNav>
        {
          tabs.length > 0 ? (
            <this._syncTabView.component
              id={AGENT_TAB_ID}
              className={clsx('[&_.sui-tab]:max-w-none [&_.sui-tab]:flex-grow')}
              variant="scrollable"
              tabs={tabs.map((tab) => ({
                ...tab,
                label: t(tab.id as 'dialer' | 'leads' | 'history'),
              }))}
              defaultValue={props?.initialTab ?? this.defaultTab}
            />
          ) : null
        }
      </>
    );
  }
}

export { CxAgentView };
