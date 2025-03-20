import { computed, storage, state, action } from '@ringcentral-integration/core';

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
    'Storage',
    { dep: 'SmsTemplatesOptions', optional: true }
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
      storageKey: 'SmsTemplates',
      enableCache: true,
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
        return (personalResult.records || []).sort((a, b) => {
          return Number.parseInt(a.id, 10) > Number.parseInt(b.id, 10) ? -1 : 1;
        });
      },
    });
    this._deps.dataFetcherV2.register(this._source);
  }

  @storage
  @state
  orderedIds: string[] = [];

  @action
  _setOrderedIds(orderedIds: string[]) {
    this.orderedIds = orderedIds;
  }

  @action
  clearOrderedIds() {
    const orderedIds = [];
    const list = this.data ?? [];
    this.orderedIds.forEach((id) => {
      if (list.find((template) => template.id === id)) {
        orderedIds.push(id);
      }
    });
    this.orderedIds = orderedIds;
  }

  @action
  setToFirstOrder(templateId: string) {
    const orderedIds = this.orderedIds.filter((id) => id !== templateId);
    this.orderedIds = [templateId].concat(orderedIds);
  }

  sort(ids: string[]) {
    this._setOrderedIds(ids);
  }

  @computed(({ data, orderedIds }: SmsTemplates) => [data, orderedIds])
  get templates() {
    const originalList = this.data ?? [];
    const listMap = originalList.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
    const orderedList = [];
    this.orderedIds.forEach((id) => {
      if (listMap[id]) {
        orderedList.push(listMap[id]);
        delete listMap[id];
      }
    });
    const unorderedList = [];
    originalList.forEach((item) => {
      if (listMap[item.id]) {
        unorderedList.push(item);
      }
    });
    return orderedList.concat(unorderedList);
  }

  get _hasPermission() {
    return this._deps.appFeatures.showSmsTemplate;
  }

  async sync() {
    if (!this._hasPermission) {
      return;
    }
    await this._deps.dataFetcherV2.fetchData(this._source);
    this.clearOrderedIds();
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
      this.clearOrderedIds();
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
      if (!isUpdate) {
        this.setToFirstOrder(result.id);
      }
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
