import type TMCompanyInfo from '@rc-ex/core/lib/definitions/TMCompanyInfo';
import {
  AppFeatures,
  Client,
  DataFetcher,
  DataFetcherConsumer,
  DataSource,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { injectable } from '@ringcentral-integration/next-core';

import type { AppFeatures as EmbeddableAppFeatures } from '../AppFeatures';
import { TEAM_MESSAGING_API_PATH } from './TeamMessaging.constants';
import { isCompanyNotFoundError } from './TeamMessaging.helper';

/**
 * The current account's team messaging company. An account without one has no
 * team messaging, so the feature is turned off, as in the legacy app.
 */
@injectable({
  name: 'TeamMessagingCompany',
})
export class TeamMessagingCompany extends DataFetcherConsumer<TMCompanyInfo> {
  constructor(
    protected _client: Client,
    protected override _dataFetcher: DataFetcher,
    protected _appFeatures: AppFeatures,
  ) {
    super(_dataFetcher);
    this._source = new DataSource({
      key: 'teamMessagingCompany',
      cleanOnReset: true,
      fetchFunction: () => this._fetchCompany(),
      readyCheckFunction: () => this._appFeatures.ready,
      permissionCheckFunction: () => this._appFeatures.hasGlipPermission,
    });
    this._dataFetcher.register(this._source);
  }

  private async _fetchCompany(): Promise<TMCompanyInfo> {
    try {
      const response = await this._client.service
        .platform()
        .get(`${TEAM_MESSAGING_API_PATH}/companies/~`);
      return (await response.json()) as TMCompanyInfo;
    } catch (error) {
      if (!isCompanyNotFoundError(error)) {
        throw error;
      }
      this._disableTeamMessaging();
      return {};
    }
  }

  private _disableTeamMessaging(): void {
    const appFeatures = this._appFeatures as EmbeddableAppFeatures;
    appFeatures.setConfigState({
      ...appFeatures.configState,
      Glip: false,
    });
  }

  get name(): string | undefined {
    return this.data?.name;
  }
}
