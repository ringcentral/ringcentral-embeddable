import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { BlockPlugin } from '@ringcentral-integration/micro-core/src/app/plugins';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
// The registered token; the app's subclass is provided under it.
import { SyncTabView } from '@ringcentral-integration/micro-core/src/app/views/SyncTabView';
import {
  autobind,
  dynamic,
  injectable,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import { useObservableEagerState } from 'observable-hooks';
import React from 'react';

import { RingCX } from '../../services/RingCX';
import type { CxViewModule } from '../../services/RingCX/RingCX.interface';
import { CxAgentStartingPanel } from './CxAgentStartingPanel';
import { CxAgentTabPanel } from './CxAgentTabPanel';
import i18n from './i18n';

const AGENT_PATH = '/agent';
const AGENT_HISTORY_TAB = 'history';
const AGENT_DIALER_TAB = 'dialer';
const AGENT_DIALER_PATH = `${AGENT_PATH}/home/${AGENT_DIALER_TAB}`;
/**
 * `CxAgentView`'s tab group id (`AGENT_TAB_ID`), repeated here so this tab
 * does not import the lazily loaded RingCX chunk.
 */
const AGENT_TABS_ID = 'agentTabs';
const AGENT_HOME_TABS: readonly string[] = ['dialer', 'leads', 'history'];

type CxLiveCalls = {
  readonly callIds: readonly string[];
};

@injectable({
  name: 'CxAgentTabView',
})
export class CxAgentTabView extends RcViewModule {
  @dynamic('CxAppView')
  private readonly _cxAppView?: CxViewModule;

  @dynamic('CxCallHistoryDetailView')
  private readonly _cxCallHistoryDetailView?: CxViewModule;

  @dynamic('CxDispositionView')
  private readonly _cxDispositionView?: CxViewModule;

  @dynamic('CxCallMonitor')
  private readonly _cxCallMonitor?: CxLiveCalls;

  constructor(
    private readonly _ringCX: RingCX,
    private readonly _router: RouterPlugin,
    private readonly _locale: Locale,
    private readonly _block: BlockPlugin,
    private readonly _syncTabView: SyncTabView,
  ) {
    super();
  }

  /**
   * Leaves the session setup flow and returns to the Agent tab start screen.
   */
  cancelAgentSetup(): void {
    void this._ringCX.endAgentSession();
    this._router.push(AGENT_PATH);
  }

  /**
   * Where a CX history detail opened in the side widget returns to: the agent
   * home tab picked in the main column behind it, History until another is
   * picked. The column only switches its tab there, as the detail page holds
   * the router, so the route alone would send the agent back to History.
   */
  resolveHistoryBackgroundPath(): string {
    const tab = this._syncTabView.getActive(AGENT_TABS_ID);
    const homeTab =
      typeof tab === 'string' && AGENT_HOME_TABS.includes(tab)
        ? tab
        : AGENT_HISTORY_TAB;
    return `${AGENT_PATH}/home/${homeTab}`;
  }

  /**
   * Where the main column parks an Agent tab path behind a routed side widget
   * page, or `null` when it cannot be parked. Only the agent home can, and
   * only in a ready session: the shell redirects any other session state to
   * a setup page, which would take the real route over, and the call pages
   * read the real route. The bare tab path parks as the home, so closing the
   * routed page does not route through the shell's redirect.
   */
  resolveParkedPath(path: string): string | null {
    if (!this._ringCX.loaded || this._ringCX.stage !== 'ready') {
      return null;
    }
    const homePath = `${AGENT_PATH}/home`;
    if (path === AGENT_PATH || path === homePath) {
      return homePath;
    }
    const tab = path.startsWith(`${homePath}/`)
      ? path.slice(homePath.length + 1)
      : null;
    return tab && AGENT_HOME_TABS.includes(tab) ? path : null;
  }

  /**
   * Where a CX disposition opened in the side widget returns to: the call's
   * control page while the call is still up, otherwise the agent dialer.
   */
  resolveDispositionBackgroundPath(callId?: string): string {
    return callId && this._isLiveCall(callId)
      ? `${AGENT_PATH}/calls/${callId}`
      : AGENT_DIALER_PATH;
  }

  /**
   * CX disposition rendered as a routed side-widget page.
   */
  @autobind
  DispositionDetail(): React.ReactElement | null {
    const loaded = useConnector(() => this._ringCX.loaded);
    const hydrated = this._useHydrated();
    const CxDisposition = this._cxDispositionView?.component;
    if (!loaded || !hydrated || !CxDisposition) {
      return null;
    }
    return <CxDisposition />;
  }

  /**
   * Whether this tab holds the CX modules' current state, see
   * `RingCX.hydratedOnThisPort$`. Read eagerly: the subject already holds the
   * answer, and starting from `false` would render the empty fallback for a
   * frame each time a CX page mounts, such as when a history detail opens.
   */
  private _useHydrated(): boolean {
    return useObservableEagerState(this._ringCX.hydratedOnThisPort$);
  }

  private _isLiveCall(callId: string): boolean {
    return (
      this._ringCX.loaded &&
      this._ringCX.stage === 'ready' &&
      !!this._cxCallMonitor?.callIds.includes(callId)
    );
  }

  /**
   * CX history detail rendered as a routed side-widget page.
   */
  @autobind
  HistoryDetail(): React.ReactElement | null {
    const loaded = useConnector(() => this._ringCX.loaded);
    const hydrated = this._useHydrated();
    const CxHistoryDetail = this._cxCallHistoryDetailView?.component;
    if (!loaded || !hydrated || !CxHistoryDetail) {
      return null;
    }
    return <CxHistoryDetail />;
  }

  component(): React.ReactElement {
    const { t } = useLocale(i18n);
    const { currentLocale, currentPath, isBlocked, lastError, loaded, stage } =
      useConnector(() => ({
        currentLocale: this._locale.currentLocale,
        currentPath: this._router.currentPath,
        isBlocked: this._block.blockIds.length > 0,
        lastError: this._ringCX.lastError,
        loaded: this._ringCX.loaded,
        stage: this._ringCX.stage,
      }));
    const hydrated = this._useHydrated();
    const CxApp = this._cxAppView?.component;
    void currentLocale;
    void currentPath;
    const inSession =
      loaded &&
      stage !== 'idle' &&
      stage !== 'loading' &&
      stage !== 'authenticating' &&
      stage !== 'error';
    if (inSession && hydrated && CxApp) {
      return <CxApp />;
    }
    if (inSession) {
      // This tab is still pulling the running session's state; offering to
      // start a session it already has would be wrong.
      return null;
    }
    if (stage === 'loading' || stage === 'authenticating') {
      return (
        <CxAgentStartingPanel
          showSpinner={!isBlocked}
          onCancel={() => this.cancelAgentSetup()}
        />
      );
    }
    return (
      <>
        <AppHeaderNav title={t('agentTab')}>{null}</AppHeaderNav>
        <CxAgentTabPanel
          errorMessage={lastError}
          stage={stage}
          onStart={() => {
            void this._ringCX.startAgentSession();
          }}
        />
      </>
    );
  }
}
