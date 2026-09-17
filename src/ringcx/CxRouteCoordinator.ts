import {
  injectable,
  RcModule,
  RouterPlugin,
} from '@ringcentral-integration/next-core';

import { CxAuth } from './services/CxAuth';
import { cxPath, isCxAgentPath } from './routes';

@injectable({
  name: 'CxRouteCoordinator',
})
export class CxRouteCoordinator extends RcModule {
  constructor(
    private readonly _router: RouterPlugin,
    private readonly _cxAuth: CxAuth,
  ) {
    super();
    this._cxAuth.onAuthSuccess(() => {
      void this._handleAuthenticationSuccess();
    });
  }

  private async _handleAuthenticationSuccess(): Promise<void> {
    if (this._cxAuth.isOnlyOneAgent) {
      const agent = this._cxAuth.authenticateResponse?.agents[0];
      if (!agent?.agentId) return;
      await this._cxAuth.setAgentId(agent.agentId);
      await this._cxAuth.openSocketWithSelectedAgentId();
      return;
    }
    // Authentication also succeeds for a session restored in the background,
    // so the account picker only takes over the router inside the agent tab or
    // for a session the user just asked for.
    if (this._cxAuth.agentId) {
      return;
    }
    if (
      isCxAgentPath(this._router.currentPath) ||
      this._cxAuth.setupNavigationRequested
    ) {
      this._cxAuth.completeSetupNavigation();
      this._router.push(cxPath.chooseAccount());
    }
  }
}
