import CallLog from '@ringcentral-integration/commons/modules/CallLog';
import { Module } from '@ringcentral-integration/commons/lib/di';
import debounce from '@ringcentral-integration/commons/lib/debounce';

@Module({
  name: 'NewCallLog',
  deps: []
})
export default class NewCallLog extends CallLog {
  constructor(options) {
    super(options);

    this.sync = debounce(this.sync, 5000, false);
  }
}
