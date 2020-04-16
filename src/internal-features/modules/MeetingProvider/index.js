import { Module } from 'ringcentral-integration/lib/di';
import DataFetcher from 'ringcentral-integration/lib/DataFetcher';

import { getMeetingProvider } from './service';

import { meetingProviderTypes } from './interface';

/**
 * @class
 * @description: just check meeting provider from RC PLA
 */
@Module({
  deps: ['Auth', 'Client', 'Alert', 'RolesAndPermissions'],
})
export default class MeetingProvider extends DataFetcher {
  constructor({ rolesAndPermissions, ...options }) {
    super({
      cleanOnReset: true,
      ...options,
      async fetchFunction() {
        const data = await getMeetingProvider(this._client);
        return data;
      },
      disableCache: true,
      readyCheckFn: () => this._rolesAndPermissions.ready,
    });
    this._rolesAndPermissions = rolesAndPermissions;
    this._forceProvider = localStorage.getItem('__meeting_provider');
  }

  get provider() {
    if (this._forceProvider) {
      return this._forceProvider;
    }
    return this.data && this.data.provider;
  }

  get isRCV() {
    return this.provider === meetingProviderTypes.video;
  }

  get status() {
    return this.state.status;
  }

  get _name() {
    return 'meetingProvider';
  }

  get _hasPermission() {
    return !!this._rolesAndPermissions.organizeMeetingEnabled;
  }
}
