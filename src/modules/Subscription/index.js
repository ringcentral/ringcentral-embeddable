import Subscription from 'ringcentral-integration/modules/Subscription';
import { Module } from 'ringcentral-integration/lib/di';

@Module({
  name: 'NewSubscription',
  deps: []
})
export default class NewSubscription extends Subscription {

  // fix in widgets lib for https://developer.chrome.com/blog/timer-throttling-in-chrome-88/
  _detectSleep() {
    const t = Date.now();
    this._sleepTimeout = setTimeout(async () => {
      if (this.ready && this._subscription && Date.now() - t > 75 * 1000) {
        console.log('==== Sleep Detected =====');
        await this.remove();
        await this._subscribe();
      }
      this._detectSleep();
    }, 20 * 1000);
  }
}
