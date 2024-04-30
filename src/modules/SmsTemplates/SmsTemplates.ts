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
    'Alert',
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
        const personalResponse = await this._deps.client.service
          .platform()
          .get('/restapi/v1.0/account/~/extension/~/message-store-templates');
        const personalResult = await personalResponse.json();
        return (personalResult.records || []).toReversed();
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

  async deleteTemplate(templateId: string) {
    try {
      await this._deps.client.service
        .platform()
        .delete(`/restapi/v1.0/account/~/extension/~/message-store-templates/${templateId}`);
      this._deps.dataFetcherV2.updateData(
        this._source,
        this.data.filter((template) => template.id !== templateId),
        Date.now(),
      );
    } catch (e) {
      console.error(e);
      this._deps.alert.danger({
        message: 'deleteSmsTemplateError',
      });
    }
  }

  get canCreateTemplate() {
    const personalTemplates = this.templates.filter(
      (template) => template.scope === 'Personal',
    );
    return personalTemplates.length < 25;
  }

  async createOrUpdateTemplate(template: SmsTemplateRecord) {
    const isUpdate = !!template.id;
    if (!isUpdate && !this.canCreateTemplate) {
      this._deps.alert.danger({
        message: 'smsTemplateMaxLimit',
      });
      return new Error('smsTemplateMaxLimit');
    }
    try {
      const response = await this._deps.client.service
        .platform()
        .send({
          method: isUpdate ? 'PUT' : 'POST',
          url: isUpdate
            ? `/restapi/v1.0/account/~/extension/~/message-store-templates/${template.id}`
            : '/restapi/v1.0/account/~/extension/~/message-store-templates',
          body: {
            displayName: template.displayName,
            body: {
              text: template.body.text,
            },
          },
        });
      const result = await response.json();
      const newData = isUpdate ?
        this.data.map((t) => (t.id === result.id ? result : t)) :
        [result].concat(this.templates);
      this._deps.dataFetcherV2.updateData(
        this._source,
        newData,
        Date.now(),
      );
      return null;
    } catch (e) {
      console.error(e);
      this._deps.alert.danger({
        message: 'saveSmsTemplateError',
      });
      return e;
    }
  }
}
