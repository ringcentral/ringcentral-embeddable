import Storage from 'ringcentral-integration/modules/Storage';
import loginStatus from 'ringcentral-integration/modules/Auth/loginStatus';
import moduleStatuses from 'ringcentral-integration/enums/moduleStatuses';

export default class UserStorage extends Storage {
  initialize() {
    let storedData = null;
    const self = this;
    this.store.subscribe(() => {
      if (
        this._auth.loginStatus === loginStatus.loggedIn &&
        !this.ready
      ) {
        const storageKey =
          `${this.prefix ? `${this.prefix}-` : ''}storage-${this._auth.ownerId}`;
        this._storage = new this._StorageProvider({
          storageKey,
        });
        storedData = this._storage.getData();
        for (const key in storedData) {
          if (!this._reducers[key]) {
            delete storedData[key];
            this._storage.removeItem(key);
          }
        }
        this.store.dispatch({
          type: this.actionTypes.initSuccess,
          storageKey,
          data: storedData,
        });
        this._storageHandler = ({ key, value }) => {
          if (this.ready) {
            storedData[key] = value;
            this.store.dispatch({
              type: this.actionTypes.sync,
              key,
              value,
            });
          }
        };
        this._storage.on('storage', this._storageHandler);
      } else if (
        this._auth.loginStatus === loginStatus.notLoggedIn &&
        this.ready
      ) {
        this.store.dispatch({
          type: this.actionTypes.reset,
        });
        if (this._storageHandler) {
          this._storage.off('storage', this._storageHandler);
          this._storageHandler = null;
        }
        if (this._storage) {
          this._storage.destroy();
          storedData = this._storage.getData();
          for (const key in this._reducers) {
            if (typeof storedData[key] !== 'undefined') {
              delete storedData[key];
              this._storage.removeItem(key);
            }
          }
          this._storage = null;
        }
        this.store.dispatch({
          type: this.actionTypes.resetSuccess,
        });
      }
      if (this.status !== moduleStatuses.pending) {
        // save new data to storage when changed
        const currentData = this.data;
        for (const key in currentData) {
          if (storedData[key] !== currentData[key]) {
            this._storage.setItem(key, currentData[key]);
            storedData[key] = currentData[key];
          }
        }
      }
    });
  }
}

