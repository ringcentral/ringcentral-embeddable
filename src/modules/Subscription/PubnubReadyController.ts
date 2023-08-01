import { Module } from '@ringcentral-integration/commons/lib/di';

import {
  RcModuleV2,
  state,
  action,
} from '@ringcentral-integration/core';

@Module({
  name: 'PubnubReadyController',
  deps: [],
})
export class PubnubReadyController extends RcModuleV2 {
  constructor(deps) {
    super({
      deps,
    });
  }

  @state
  isReady: boolean = false;

  get ready() {
    return this.isReady;
  }

  @action
  _setReady(ready: boolean) {
    this.isReady = ready;
  }

  setReady() {
    this._setReady(true);
  }
}
