import { TabManager as TabManagerBase } from '@ringcentral-integration/commons/modules/TabManager';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewTabManager',
  deps: []
})
export class TabManager extends TabManagerBase {
  constructor(options) {
    super(options);
    // TODO: fix in widgets lib. 1min+ timeout to avoid timer is throttled
    this.tabbie._heartBeatExpire = 70000;
  }

  get autoMainTab() {
    return this._deps.tabManagerOptions.autoMainTab;
  }
}
