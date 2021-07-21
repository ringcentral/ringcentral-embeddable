import { Subscriptions } from '@ringcentral/subscriptions';
import Subscription from 'ringcentral-integration/modules/Subscription';
import { Module } from 'ringcentral-integration/lib/di';
import loginStatus from 'ringcentral-integration/modules/Auth/loginStatus';

@Module({
  name: 'NewSubscription',
  deps: []
})
export default class NewSubscription extends Subscription {

  // fix in widgets lib for https://developer.chrome.com/blog/timer-throttling-in-chrome-88/
  _detectSleep() {
    const t = Date.now();
    this._sleepTimeout = setTimeout(async () => {
      if (this.ready && this._subscription && Date.now() - t > 120 * 1000) {
        console.log('==== Sleep Detected =====');
        // to wait automatic renew finish
        if (this._subscription.automaticRenewing()) {
          await this._subscription.automaticRenewing();
        }
        // this._subscription may be removed at renewError event
        if (this._subscription) {
          // force reconnect pubnub
          await this._subscription.resubscribeAtPubNub();
        }
      }
      this._detectSleep();
    }, 20 * 1000);
  }

  async _remove() {
    if (this._subscription) {
      try {
        this.store.dispatch({
          type: this.actionTypes.remove,
        });
        await this._subscription.remove();
      } catch (error) {
        /* falls through */
      }
      if (this._subscription) {
        // check again in case subscription object was removed while waiting
        this._cleanSubscription();
      }
      this._removePromise = null;
    }
  }

  // override to add removeAllListeners
  _cleanSubscription() {
    this._subscription.reset();
    this._subscription.removeAllListeners(); // TODO: fix in widgets lib to clean all listener
    this._oldSubscription = this._subscription;
    this._subscription = null;
    setTimeout(() => {
      if (this._oldSubscription) {
        this._oldSubscription.reset();
        this._oldSubscription.removeAllListeners();
        this._oldSubscription = null;
      }
    }, 8000);
  }

  // override to add removeAllListeners
  _createSubscription() {
    const sdk = this._client.service;
    const subscriptions = new Subscriptions({ sdk });
    this._subscription = subscriptions.createSubscription();
    if (this.cachedSubscription) {
      try {
        this._subscription.setSubscription(this.cachedSubscription);
      } catch (error) {
        this._subscription = subscriptions.createSubscription();
      }
    }
    this._subscription.on(this._subscription.events.notification, (message) => {
      this.store.dispatch({
        type: this.actionTypes.notification,
        message,
      });
    });
    this._subscription.on(this._subscription.events.removeSuccess, () => {
      this.store.dispatch({
        type: this.actionTypes.removeSuccess,
      });
    });
    this._subscription.on(this._subscription.events.removeError, (error) => {
      this.store.dispatch({
        type: this.actionTypes.removeError,
        error,
      });
    });
    this._subscription.on(this._subscription.events.renewSuccess, () => {
      if (this._subscription) {
        this.store.dispatch({
          type: this.actionTypes.renewSuccess,
          subscription: this._subscription.subscription(),
        });
      }
    });
    this._subscription.on(this._subscription.events.renewError, (error) => {
      if (this._subscription) {
        this._subscription.reset();
        this._subscription.removeAllListeners(); // add this
        this._subscription = null;
      }
      this.store.dispatch({
        type: this.actionTypes.renewError,
        error,
      });
      if (
        this._auth.loginStatus === loginStatus.loggedIn &&
        this._storage.ready
      ) {
        // immediately start the retry process after the first renewError
        this._retry(0);
      }
    });
    this._subscription.on(this._subscription.events.subscribeSuccess, () => {
      if (this._subscription) {
        this.store.dispatch({
          type: this.actionTypes.subscribeSuccess,
          subscription: this._subscription.subscription(),
        });
      }
    });
    this._subscription.on(this._subscription.events.subscribeError, (error) => {
      this.store.dispatch({
        type: this.actionTypes.subscribeError,
        error,
      });
      if (
        this._auth.loginStatus === loginStatus.loggedIn &&
        this._storage.ready
      ) {
        this._retry();
      }
    });
  }
}