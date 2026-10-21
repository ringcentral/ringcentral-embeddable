import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import { Webphone as MicroPhoneWebphone } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  inject,
  injectable,
  PortManager,
  RcModule,
  watch,
} from '@ringcentral-integration/next-core';

import type { Webphone } from '../WebphoneV2';
import type { CxVoicemailDropCall } from '../WebphoneV2/cxVoicemailDropSip';

import { t } from './i18n';

/**
 * Finishes a RingCX voicemail drop once its transferred call reaches the
 * RingEX webphone.
 *
 * `Webphone` hides the INVITE that matches a pending hint and lists it in
 * `cxVoicemailDropCalls`. This module answers it silently and plays the
 * message on it.
 *
 * The hint match is the whole check: a call from the customer the agent just
 * transferred, to the agent's own extension, within seconds of the transfer.
 * The RingCX `sipUserToUser` tag on the telephony session is not waited for;
 * it would only cost greeting time.
 *
 * Server port only: the webphone sessions live there.
 */
@injectable({
  name: 'CxVoicemailDropRunner',
})
export class CxVoicemailDropRunner extends RcModule {
  private _handledSessionIds = new Set<string>();

  private _stopWatchingCalls: (() => void) | null = null;

  constructor(
    @inject(MicroPhoneWebphone) private _webphone: Webphone,
    private _toast: Toast,
    private _portManager: PortManager,
  ) {
    super();
  }

  override onInit(): void {
    if (this._portManager.shared && !this._portManager.isServer) return;
    this._stopWatchingCalls = watch(
      this,
      () => this._webphone.cxVoicemailDropCalls,
      (calls) => this._handleCalls(calls),
    );
  }

  override onReset(): void {
    this._stopWatchingCalls?.();
    this._stopWatchingCalls = null;
    this._handledSessionIds.clear();
  }

  private _handleCalls(calls: readonly CxVoicemailDropCall[]) {
    const liveIds = new Set(calls.map((call) => call.sessionId));
    this._handledSessionIds.forEach((sessionId) => {
      if (!liveIds.has(sessionId)) this._handledSessionIds.delete(sessionId);
    });
    calls
      .filter(
        (call) =>
          call.hidden &&
          call.ringing &&
          !this._handledSessionIds.has(call.sessionId),
      )
      .forEach((call) => {
        this._handledSessionIds.add(call.sessionId);
        void this._runDrop(call);
      });
  }

  private async _runDrop(call: CxVoicemailDropCall) {
    try {
      await this._webphone.answerCxVoicemailDrop(call.sessionId);
      const dropped = await this._webphone.dropVoicemailMessage(
        call.sessionId,
        call.messageId,
      );
      if (!dropped) throw new Error('Voicemail drop did not start');
    } catch (error) {
      this.logger.error('CX voicemail drop failed', error);
      await this._failDrop(call.sessionId);
    }
  }

  /**
   * The customer leg is this app's now. Hanging up beats leaving it to ring on
   * into the agent's own mailbox.
   */
  private async _failDrop(sessionId: string) {
    try {
      await this._webphone.hangup(sessionId);
    } catch (error) {
      this.logger.warn('CX voicemail drop hangup failed', error);
    }
    this._toast.danger({ message: t('dropFailed') });
  }
}
