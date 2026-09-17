import React from 'react';

import {
  injectable,
  RcViewModule,
  Redirect,
  Route,
  Switch,
} from '@ringcentral-integration/next-core';

import { CxSessionInfoView } from './views/CxSessionInfoView';
import { cxPath } from './routes';

@injectable({
  name: 'CxSettingsView',
})
export class CxSettingsView extends RcViewModule {
  constructor(private readonly _sessionInfoView: CxSessionInfoView) {
    super();
  }

  component(): React.ReactElement {
    return (
      <Switch>
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
