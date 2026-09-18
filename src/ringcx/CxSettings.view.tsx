import React from 'react';

import {
  injectable,
  RcViewModule,
  Redirect,
  Route,
  Switch,
} from '@ringcentral-integration/next-core';

import { CxManualDialSettingsView } from './views/CxManualDialSettingsView';
import { CxSessionInfoView } from './views/CxSessionInfoView';
import { cxPath } from './routes';

@injectable({
  name: 'CxSettingsView',
})
export class CxSettingsView extends RcViewModule {
  constructor(
    private readonly _sessionInfoView: CxSessionInfoView,
    private readonly _manualDialSettingsView: CxManualDialSettingsView,
  ) {
    super();
  }

  component(): React.ReactElement {
    return (
      <Switch>
        <Route
          path={cxPath.manualDial()}
          exact
          component={this._manualDialSettingsView.component}
        />
        <Route
          path={cxPath.settings()}
          exact
          component={this._sessionInfoView.component}
        />
        <Redirect to={cxPath.settings()} />
      </Switch>
    );
  }
}
