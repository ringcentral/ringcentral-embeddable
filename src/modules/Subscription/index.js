import { Subscription as SubscriptionBase } from '@ringcentral-integration/commons/modules/SubscriptionV2';
import { Module } from '@ringcentral-integration/commons/lib/di';

import { isFirefox } from '../../lib/isFirefox';

const SUBSCRIPTION_LOCK_KEY = 'subscription-creating-lock';

@Module({
  name: 'Subscription',
  deps: [],
})
export class Subscription extends SubscriptionBase {
  async _createSubscription() {
    await super._createSubscription();
    if (!navigator.locks || isFirefox() || !this._subscription) {
      return;
    }
    if (this._subscription._$$automaticRenewHandler) {
      return;
    }
    // add lock renewal
    this._subscription._$$automaticRenewHandler = this._subscription._automaticRenewHandler;
    this._subscription._automaticRenewHandler = () => {
      return navigator.locks.request('subscription_auto_renew', { mode: 'exclusive'}, async () => {
        const result = await this._subscription._$$automaticRenewHandler();
        return result;
      });
    };
    this._subscription._$$resubscribeAtPubNub = this._subscription.resubscribeAtPubNub;
    this._subscription.resubscribeAtPubNub = () => {
      return navigator.locks.request('subscription_resubscribe_pubnub', { mode: 'exclusive'}, async () => {
        const result = await this._subscription._$$resubscribeAtPubNub();
        return result;
      });
    };
  }

  // TODO: remove this after sdk fixed, fix lock issue at firefox
  async _createSubscriptionWithLock() {
    if (!navigator?.locks?.request || isFirefox()) {
      await this._createSubscription();
    } else {
      await navigator.locks.request(SUBSCRIPTION_LOCK_KEY, () =>
        this._createSubscription(),
      );
    }
  }
}
