import { TabManager as TabManagerBase } from '@ringcentral-integration/commons/modules/TabManager';
import { Module } from '@ringcentral-integration/commons/lib/di';
import { action, state } from '@ringcentral-integration/core';

@Module({
  name: 'NewTabManager',
  deps: []
})
export class TabManager extends TabManagerBase {
  constructor(options) {
    super(options);
    // TODO: fix in widgets lib. 1min+ timeout to avoid timer is throttled
    this.tabbie._heartBeatExpire = 70000;
    window.addEventListener('focus', this._setCurrentTabAsInteracting);
    window.addEventListener('visibilitychange', this._setCurrentTabAsInteracting);
    this.tabbie.on(this.tabbie.events.event, (event, tabId) => {
      if (event !== 'tabInteracting') {
        return;
      }
      if (tabId === this.interactingTabId) {
        return;
      }
      this.setInteractingTabId(tabId);
    });
  }

  @state
  interactingTabId = null;

  @action
  setInteractingTabId(tabId) {
    this.interactingTabId = tabId;
  }

  _setCurrentTabAsInteracting = () => {
    if (document.hidden) {
      return;
    }
    this.setInteractingTabId(this.id);
    this.send('tabInteracting', this.id);
  }

  get autoMainTab() {
    return this._deps.tabManagerOptions.autoMainTab;
  }

  get interacting() {
    return this.interactingTabId === this.id;
  }
}
