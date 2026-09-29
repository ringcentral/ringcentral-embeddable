import React from 'react';

import {
  injectable,
  RcViewModule,
} from '@ringcentral-integration/next-core';

import { CxActiveCallView } from './views/CxActiveCallView';
import { CxDispositionView } from './views/CxDispositionView';

@injectable({
  name: 'CxAnnouncementsView',
})
export class CxAnnouncementsView extends RcViewModule {
  constructor(
    private readonly _activeCallView: CxActiveCallView,
    private readonly _dispositionView: CxDispositionView,
  ) {
    super();
  }

  component(): React.ReactElement {
    return (
      <>
        <this._activeCallView.Announcement />
        <this._dispositionView.Announcement />
      </>
    );
  }
}
