import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { BlockPlugin } from '@ringcentral-integration/micro-core/src/app/plugins';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import {
  autobind,
  dynamic,
  injectable,
  RcViewModule,
  RouterPlugin,
  useConnector,
  useParams,
} from '@ringcentral-integration/next-core';
import { useObservableState } from 'observable-hooks';
import React, { type ComponentType } from 'react';

import { RingCX } from '../../services/RingCX';
import type { CxViewModule } from '../../services/RingCX/RingCX.interface';
import { CxAgentStartingPanel } from './CxAgentStartingPanel';
import { CxAgentTabPanel } from './CxAgentTabPanel';
import i18n from './i18n';

const AGENT_PATH = '/agent';
const AGENT_HISTORY_TAB = 'history';
const AGENT_DIALER_TAB = 'dialer';
const AGENT_DIALER_PATH = `${AGENT_PATH}/home/${AGENT_DIALER_TAB}`;

type CxAgentHomeView = {
  readonly component: ComponentType<{ initialTab?: string }>;
};

type CxLiveCalls = {
  readonly callIds: readonly string[];
};

@injectable({
  name: 'CxAgentTabView',
})
export class CxAgentTabView extends RcViewModule {
  @dynamic('CxAppView')
  private readonly _cxAppView?: CxViewModule;

  @dynamic('CxAgentView')
  private readonly _cxAgentView?: CxAgentHomeView;

  @dynamic('CxCallHistoryDetailView')
  private readonly _cxCallHistoryDetailView?: CxViewModule;

  @dynamic('CxDispositionView')
  private readonly _cxDispositionView?: CxViewModule;

  @dynamic('CxActiveCallView')
  private readonly _cxActiveCallView?: CxViewModule;

  @dynamic('CxCallMonitor')
  private readonly _cxCallMonitor?: CxLiveCalls;

  constructor(
    private readonly _ringCX: RingCX,
    private readonly _router: RouterPlugin,
    private readonly _locale: Locale,
    private readonly _block: BlockPlugin,
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
   * Main column behind a CX history detail opened in the side widget: the
   * agent home on its History tab.
   */
  @autobind
  HistoryBackground(): React.ReactElement | null {
    return <this.AgentHomeBackground initialTab={AGENT_HISTORY_TAB} />;
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
   * Main column behind a CX disposition opened in the side widget. A call
   * that is still up keeps its control page there, so the agent can work the
   * call while filling in the form; an ended call leaves the agent dialer,
   * which is where the agent lands after submitting.
   */
  @autobind
  DispositionBackground(): React.ReactElement | null {
    const { id } = useParams<{ id?: string }>();
    const isLiveCall = useConnector(() => !!id && this._isLiveCall(id));
    const hydrated = this._useHydrated();
    const CxActiveCall = this._cxActiveCallView?.component;
    if (isLiveCall && hydrated && CxActiveCall) {
      return <CxActiveCall />;
    }
    return <this.AgentHomeBackground initialTab={AGENT_DIALER_TAB} />;
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
   * `RingCX.hydratedOnThisPort$`.
   */
  private _useHydrated(): boolean {
    return useObservableState(this._ringCX.hydratedOnThisPort$, false);
  }

  private _isLiveCall(callId: string): boolean {
    return (
      this._ringCX.loaded &&
      this._ringCX.stage === 'ready' &&
      !!this._cxCallMonitor?.callIds.includes(callId)
    );
  }

  @autobind
  private AgentHomeBackground({
    initialTab,
  }: {
    initialTab: string;
  }): React.ReactElement | null {
    const ready = useConnector(
      () => this._ringCX.loaded && this._ringCX.stage === 'ready',
    );
    const hydrated = this._useHydrated();
    const CxAgentHome = this._cxAgentView?.component;
    if (!ready || !hydrated || !CxAgentHome) {
      return <this.component />;
    }
    return <CxAgentHome initialTab={initialTab} />;
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
