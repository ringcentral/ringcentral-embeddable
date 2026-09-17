import React from 'react';

import {
  injectable,
  RcViewModule,
  Redirect,
  Route,
  Switch,
  useConnector,
} from '@ringcentral-integration/next-core';

import { CxAgentView } from './views/CxAgentView';
import { CxCallHistoryDetailView } from './views/CxCallHistoryDetailView';
import { CxChooseAccountView } from './views/CxChooseAccountView';
import { CxSessionConfigView } from './views/CxSessionConfigView';
import { CxSessionUpdateView } from './views/CxSessionUpdateView';
import { CxAgentSession } from './services/CxAgentSession';
import { CxAuth } from './services/CxAuth';
import { cxPath } from './routes';

@injectable({
  name: 'CxAppView',
})
export class CxAppView extends RcViewModule {
  constructor(
    private readonly _cxAuth: CxAuth,
    private readonly _cxAgentSession: CxAgentSession,
    private readonly _chooseAccountView: CxChooseAccountView,
    private readonly _sessionConfigView: CxSessionConfigView,
    private readonly _sessionUpdateView: CxSessionUpdateView,
    private readonly _agentView: CxAgentView,
    private readonly _callHistoryDetailView: CxCallHistoryDetailView,
  ) {
    super();
  }

  component(): React.ReactElement {
    const { agentId, configSuccess, isOnlyOneAgent, loginStatus } =
      useConnector(() => ({
        agentId: this._cxAuth.agentId,
        configSuccess: this._cxAgentSession.configSuccess,
        isOnlyOneAgent: this._cxAuth.isOnlyOneAgent,
        loginStatus: this._cxAuth.loginStatus,
      }));
    const hasAgent = isOnlyOneAgent || !!agentId;
    // The session can end while the user is looking at an agent page, for
    // example when another device takes the login over, and a stored
    // configuration from an earlier run is not a live session either. Routes
    // are gated on the session the app holds right now, so a stale path cannot
    // keep a dead session on screen.
    const hasSession = hasAgent && configSuccess;
    const fallback =
      loginStatus === 'authSuccess'
        ? configSuccess
          ? cxPath.home()
          : hasAgent
            ? cxPath.sessionConfig()
            : cxPath.chooseAccount()
        : cxPath.agent();
    return (
      <Switch>
        <Route
          path={cxPath.chooseAccount()}
          exact
          component={this._chooseAccountView.component}
        />
        {hasAgent && (
          <Route
            path={cxPath.sessionConfig()}
            exact
            component={this._sessionConfigView.component}
          />
        )}
        {hasSession && (
          <Route
            path={cxPath.sessionUpdate()}
            exact
            component={this._sessionUpdateView.component}
          />
        )}
        {hasSession && (
          <Route
            path="/agent/home/:tabId?"
            component={this._agentView.component}
          />
        )}
        {hasSession && (
          <Route
            path="/agent/history/:id"
            exact
            component={this._callHistoryDetailView.component}
          />
        )}
        <Redirect to={fallback} />
      </Switch>
    );
  }
}
