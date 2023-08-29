import { GlobalStorage as GlobalStorageBase } from '@ringcentral-integration/commons/modules/GlobalStorage';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  deps: [],
})
export class GlobalStorage extends GlobalStorageBase {
  private _migratedKeys: String[] = [];
  private _migratedNewKeys: String[] = [];

  override async onInit() {
    const storageKey = `${this.prefix ? `${this.prefix}-` : ''}GlobalStorage`;
    this._storage = new this._StorageProvider({
      storageKey,
    });
    this.storedData = await this._storage.getData();
    await this._migrateOldData(); // Add this line for migrate old v1 settings data
    if (!this._deps.globalStorageOptions?.disableClearUnused) {
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
      if (!Object.prototype.hasOwnProperty.call(this.storedData, key)) {
        this._storage.setItem(key, currentData[key]);
      }
    }
  }

  async _migrateOldData() {
    try {
      this._migrateEnvironmentData();
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
      console.error('migrate old region data error: ', e);
    }
  }

  _migrateEnvironmentData() {
    const oldServer = this.storedData['environmentServer'];
    if (!oldServer) {
      return;
    }
    const migrationPairs = [
      { oldKey: 'environmentServer', newKey: 'environment-server' },
      { oldKey: 'environmentAppKey', newKey: 'environment-clientId' },
      { oldKey: 'environmentAppSecret', newKey: 'environment-clientSecret' },
      { oldKey: 'environmentEnabled', newKey: 'environment-enabled' },
    ];
    this._migrateWithPairs(migrationPairs);
  }

  _migrateWithPairs(migrationPairs) {
    for (const pair of migrationPairs) {
      const oldKey = pair.oldKey;
      const newKey = pair.newKey;
      const oldData = this.storedData[oldKey];
      this.storedData[newKey] = oldData;
      this._migratedKeys.push(oldKey);
      this._migratedNewKeys.push(newKey);
    }
  }
}
