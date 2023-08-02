import { Storage as StorageBase } from '@ringcentral-integration/commons/modules/Storage';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  deps: [],
})
export class Storage extends StorageBase {
  private _migratedKeys: String[] = [];
  private _migratedNewKeys: String[] = [];

  override async onInit() {
    this._storage = new this._StorageProvider({
      storageKey: this.storageKey,
    });
    this.storedData = await this._storage.getData();
    await this._migrateOldData(); // Add this line for migrate old v1 settings data
    if (!this._deps.storageOptions?.disableClearUnused) {
      for (const key in this.storedData) {
        if (!this._storageReducers[key]) {
          delete this.storedData[key];
          await this._storage.removeItem(key);
        }
      }
    }
    this.setData({
      ...this.data,
      ...this.storedData,
    });
    const currentData = this.data;
    for (const key in currentData) {
      if (
        !Object.prototype.hasOwnProperty.call(this.storedData, key) &&
        this.storageWritable
      ) {
        this._storage.setItem(key, currentData[key]);
      }
    }
  }

  async _migrateOldData() {
    try {
      this._migrateRegionSettingsData();
      this._migrateCallLoggerData();
      this._migrateConversationLoggerData();
      const migrationPairs = [
        { oldKey: 'audioSettings', newKey: 'AudioSettings-data' },
        { oldKey: 'rc-widget-webphone', newKey: 'Webphone-data' },
        { oldKey: 'contactMatcherData', newKey: 'ContactMatcher-data' },
        { oldKey: 'activityMatcherData', newKey: 'ActivityMatcher-data' },
        { oldKey: 'conversationMatcherData', newKey: 'ConversationMatcher-data' },
        { oldKey: 'callingSettingsData', newKey: 'CallingSettings-data' },
      ];
      this._migrateWithPairs(migrationPairs);
      if (this._migratedKeys.length > 0) {
        for (const key of this._migratedKeys) {
          delete this.storedData[key];
          await this._storage.removeItem(key);
        }
        this._migratedKeys = [];
      }
      if (this._migratedNewKeys.length > 0) {
        for (const key of this._migratedNewKeys) {
          this._storage.setItem(key, this.storedData[key]);
        }
        this._migratedNewKeys = [];
      }
    } catch (e) {
      console.error('migrate old data error: ', e);
    }
  }

  _migrateRegionSettingsData() {
    const oldCountryCode = this.storedData['regionSettingsCountryCode'];
    if (!oldCountryCode) {
      return;
    }
    const oldAreaCode = this.storedData['regionSettingsAreaCode'];
    this.storedData['RegionSettings-data'] = {
      countryCode: oldCountryCode,
      areaCode: oldAreaCode,
    };
    this._migratedKeys.push('regionSettingsCountryCode');
    this._migratedKeys.push('regionSettingsAreaCode');
    this._migratedNewKeys.push('RegionSettings-data');
  }

  _migrateCallLoggerData() {
    const oldCallLoggerData = this.storedData['callLoggerData'];
    if (!oldCallLoggerData) {
      return;
    }
    this.storedData['CallLogger-autoLog'] = oldCallLoggerData.autoLog;
    this.storedData['CallLogger-logOnRinging'] = oldCallLoggerData.logOnRinging;
    this.storedData['CallLogger-transferredCallsMap'] = oldCallLoggerData.transferredCallsMap;
    this._migratedKeys.push('regionSettingsCountryCode');
    this._migratedNewKeys.push('CallLogger-autoLog');
    this._migratedNewKeys.push('CallLogger-logOnRinging');
    this._migratedNewKeys.push('CallLogger-transferredCallsMap');
  }
  
  _migrateConversationLoggerData() {
    const oldLoggerData = this.storedData['conversationLoggerData'];
    if (!oldLoggerData) {
      return;
    }
    this.storedData['ConversationLogger-_autoLog'] = oldLoggerData.autoLog;
    this._migratedKeys.push('conversationLoggerData');
    this._migratedNewKeys.push('ConversationLogger-_autoLog');
  }

  _migrateWithPairs(migrationPairs) {
    for (const pair of migrationPairs) {
      const oldKey = pair.oldKey;
      const oldData = this.storedData[oldKey];
      if (typeof oldData === 'undefined') {
        continue;
      }
      const newKey = pair.newKey;
      this.storedData[newKey] = oldData;
      this._migratedKeys.push(oldKey);
      this._migratedNewKeys.push(newKey);
    }
  }
}
