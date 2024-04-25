import { computed } from '@ringcentral-integration/core';

import { Module } from '@ringcentral-integration/commons/lib/di';
import { DataFetcherV2Consumer, DataSource } from '@ringcentral-integration/commons/modules/DataFetcherV2';

import { Deps, SmsTemplateRecord } from './SmsTemplates.interface';

@Module({
  name: 'SmsTemplates',
  deps: [
    'Client',
    'DataFetcherV2',
    'ExtensionFeatures',
    'AppFeatures',
    { dep: 'CallerIdOptions', optional: true }
  ],
})
export class SmsTemplates extends DataFetcherV2Consumer<
  Deps,
  SmsTemplateRecord[]
> {

  private _source: DataSource<SmsTemplateRecord[]>;

  constructor(deps: Deps) {
    super({
      deps,
    });
    this._source = new DataSource({
      ...deps.smsTemplateOptions,
      key: 'smsTemplates',
      cleanOnReset: true,
      permissionCheckFunction: () =>
        this._hasPermission,
      fetchFunction: async (): Promise<SmsTemplateRecord[]> => {
        let records = [];
        if (this._deps.appFeatures.hasCompanySmsTemplateReadPermission) {
          const companyResponse = await this._deps.client.service
            .platform()
            .get('/restapi/v1.0/account/~/message-store-templates');
          const companyResult = await companyResponse.json();
          records = companyResult.records;
        }
        if (this._deps.appFeatures.hasPersonalSmsTemplatePermission) {
          const personalResponse = await this._deps.client.service
            .platform()
            .get('/restapi/v1.0/account/~/extension/~/message-store-templates');
          const personalResult = await personalResponse.json();
          records = records.concat(personalResult.records);
        }
        return records;
      },
    });
    this._deps.dataFetcherV2.register(this._source);
  }

  @computed(({ data }: SmsTemplates) => [data])
  get templates() {
    return this.data ?? [];
  }

  get _hasPermission() {
    return this._deps.appFeatures.showSmsTemplate;
  }

  async sync() {
    if (!this._hasPermission) {
      return;
    }
    await this._deps.dataFetcherV2.fetchData(this._source);
  }
}
