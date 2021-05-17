import CallHistory from 'ringcentral-integration/modules/CallHistory';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewCallHistory',
  deps: []
})
export default class NewCallHistory extends CallHistory {
  // override to fix rate limit issue at multiple tabs
  _addEndedCalls(endedCalls) {
    endedCalls.map((call) => {
      call.result = 'Disconnected';
      return call;
    });
    this.store.dispatch({
      type: this.actionTypes.addEndedCalls,
      endedCalls,
      timestamp: Date.now(),
    });
    if (!this._storage || !this._tabManager || this._tabManager.active) {
      this._callLog.sync();
    }
  }
}
