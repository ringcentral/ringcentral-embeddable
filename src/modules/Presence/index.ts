import { Module } from '@ringcentral-integration/commons/lib/di';
import { Presence as PresenceBase } from '@ringcentral-integration/commons/modules/Presence';

@Module({
  name: 'NewPresence',
  deps: [
    'ExtensionInfo',
  ]
})
export class Presence extends PresenceBase {
  override _handleSubscription(message) {
    if (!this.ready) {
      return;
    }
    if (
      message.event.indexOf('/presence?detailedTelephonyState=true') === -1 ||
      !message.body
    ) {
      return;
    }
    // do not handle presence change for other extensions
    if (
      message.body.extensionId &&
      String(message.body.extensionId) !== String(this._deps.extensionInfo.id)
    ) {
      return;
    }
    return super._handleSubscription(message);
  }
}
