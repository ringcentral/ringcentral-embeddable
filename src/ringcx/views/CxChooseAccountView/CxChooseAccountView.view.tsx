import {
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import React, { useCallback, useState } from 'react';

import { RingCX } from '../../../app/services/RingCX';
import { CxAuth } from '../../services/CxAuth';
import { ChooseAccountPanel } from '../../components/ChooseAccountPanel';
import { cxPath } from '../../routes';
import type {
  CxChooseAccountViewOptions,
  CxChooseAccountViewProps,
} from './CxChooseAccountView.interface';
import i18n from './i18n';

/**
 * CxChooseAccountView - Agent account selection view
 * Displayed when multiple agent accounts are available after authentication
 */
@injectable({
  name: 'CxChooseAccountView',
})
class CxChooseAccountView extends RcViewModule {
  constructor(
    private _cxAuth: CxAuth,
    private _router: RouterPlugin,
    private _ringCX: RingCX,
    @optional('CxChooseAccountViewOptions')
    private _options?: CxChooseAccountViewOptions,
  ) {
    super();
  }

  /**
   * Leaves the setup flow without an agent session, so the Agent tab falls
   * back to its start screen.
   */
  cancelAgentSetup(): void {
    void this._ringCX.endAgentSession();
    this._router.push(cxPath.agent());
  }

  async selectAgent(agentId: string): Promise<void> {
    await this._cxAuth.setAgentId(agentId);
    this._options?.onAccountSelected?.(agentId);
    await this._cxAuth.openSocketWithSelectedAgentId({
      syncOtherTabs: true,
      retryOpenSocket: true,
    });
    this._router.push(cxPath.sessionConfig());
  }

  component(_props?: CxChooseAccountViewProps) {
    const { t } = useLocale(i18n);
    const [isLoading, setIsLoading] = useState(false);

    const { agents } = useConnector(() => ({
      agents: this._cxAuth.authenticateResponse?.agents || [],
    }));

    const handleSelectAgent = useCallback(
      async (agentId: string) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
          await this.selectAgent(agentId);
        } finally {
          setIsLoading(false);
        }
      },
      [isLoading],
    );

    return (
      <>
        <AppHeaderNav override>
          <PageHeader onBackClick={() => this.cancelAgentSetup()}>
            {t('chooseAccount')}
          </PageHeader>
        </AppHeaderNav>
        <AppFooterNav />
        <ChooseAccountPanel
          agents={agents}
          isLoading={isLoading}
          onSelectAgent={handleSelectAgent}
        />
      </>
    );
  }
}

export { CxChooseAccountView };
