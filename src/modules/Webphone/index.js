import Webphone from 'ringcentral-integration/modules/Webphone';
import webphoneErrors from 'ringcentral-integration/modules/Webphone/webphoneErrors';
import validateNumbers from 'ringcentral-integration/lib/validateNumbers';
import { Module } from 'ringcentral-integration/lib/di';
import sleep from 'ringcentral-integration/lib/sleep';

@Module({
  name: 'NewWebphone',
  deps: []
})
export default class NewWebphone extends Webphone {
  // TODO: remove this after widgets lib fix transfer issue
  async transfer(transferNumber, sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) {
      return;
    }
    try {
      session.__rc_isOnTransfer = true;
      this._updateSessions();
      let numberResult;
      let validPhoneNumber;
      numberResult = validateNumbers(
        [transferNumber],
        this._regionSettings,
        this._brand.id,
      );
      validPhoneNumber = numberResult && numberResult[0];
      // TODO use session.transfer after web phone sdk fix this issue
      await this.hold(sessionId);
      await sleep(1500);
      await session.blindTransfer(validPhoneNumber);
      session.__rc_isOnTransfer = false;
      this._updateSessions();
      this._onCallEnd(session);
    } catch (e) {
      console.error(e);
      session.__rc_isOnTransfer = false;
      this._updateSessions();
      this._alert.danger({
        message: webphoneErrors.transferError,
      });
    }
  }
}
