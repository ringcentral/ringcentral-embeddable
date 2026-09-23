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
} from '@ringcentral-integration/next-core';
import React, { type ComponentType } from 'react';

import { RingCX } from '../../services/RingCX';
import type { CxViewModule } from '../../services/RingCX/RingCX.interface';
import { CxAgentStartingPanel } from './CxAgentStartingPanel';
import { CxAgentTabPanel } from './CxAgentTabPanel';
import i18n from './i18n';

const AGENT_PATH = '/agent';
const AGENT_HISTORY_TAB = 'history';

type CxAgentHomeView = {
  readonly component: ComponentType<{ initialTab?: string }>;
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
    const ready = useConnector(
      () => this._ringCX.loaded && this._ringCX.stage === 'ready',
    );
    const CxAgentHome = this._cxAgentView?.component;
    if (!ready || !CxAgentHome) {
      return <this.component />;
    }
    return <CxAgentHome initialTab={AGENT_HISTORY_TAB} />;
  }

  /**
   * CX history detail rendered as a routed side-widget page.
   */
  @autobind
  HistoryDetail(): React.ReactElement | null {
    const loaded = useConnector(() => this._ringCX.loaded);
    const CxHistoryDetail = this._cxCallHistoryDetailView?.component;
    if (!loaded || !CxHistoryDetail) {
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
    const CxApp = this._cxAppView?.component;
    void currentLocale;
    void currentPath;
    if (
      loaded &&
      CxApp &&
      stage !== 'idle' &&
      stage !== 'loading' &&
      stage !== 'authenticating' &&
      stage !== 'error'
    ) {
      return <CxApp />;
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
