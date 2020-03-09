import { Module } from 'ringcentral-integration/lib/di';
import DataFetcher from 'ringcentral-integration/lib/DataFetcher';

import { getMeetingProvider } from './service';

/**
 * @class
 * @description: just check meeting provider from RC PLA
 */
@Module({
  deps: ['Auth', 'Client', 'Alert'],
})
export default class MeetingProvider extends DataFetcher {
  constructor({ ...options }) {
    super({
      cleanOnReset: true,
      ...options,
      async fetchFunction() {
        const data = await getMeetingProvider(this._client);
        return data;
      },
      disableCache: true,
    });
  }

  get provider() {
    return 'RCVideo';
    // return this.data && this.data.provider;
  }

  get status() {
    return this.state.status;
  }

  get _name() {
    return 'meetingProvider';
  }
}
