import ActiveCalls from 'ringcentral-integration/modules/ActiveCalls';
import { Module } from 'ringcentral-integration/lib/di';
import debounce from 'ringcentral-integration/lib/debounce';

@Module({
  name: 'NewActiveCalls',
  deps: []
})
export default class NewActiveCalls extends ActiveCalls {
  constructor(options) {
    super(options);
    
    this.fetchData = debounce(this.fetchData, 5000, false);
  }
}
