import {
  delegate,
  injectable,
  optional,
  RcModule,
} from '@ringcentral-integration/next-core';

import type {
  CxHostIntegration,
  CxVoicemailDropResult,
} from '../../../app/services/RingCX/RingCX.interface';
import { getCallAni } from '../../lib/getCxCallNumbers';
import { CxClient } from '../CxClient';
import { CxPresence } from '../CxPresence';

/** Voicemail drop is offered on outbound calls only, as on RingEX. */
const INBOUND_CALL_TYPE = 'INBOUND';

/**
 * CxVoicemailDrop module - drops a pre-recorded voicemail on a CX call
 *
 * RingCX cannot play a recording into a call, and an agent can only have one
 * CX call at a time. So the call is cold-transferred to the agent's own RingEX
 * extension, which frees the agent for the next CX call, and the RingEX
 * webphone plays the message on the transferred call
 * (`plans/cx-voicemail-drop`).
 *
 * This module does the CX half: it tells the webphone which call to expect,
 * then transfers. The host's `CxVoicemailDropRunner` does the rest.
 */
@injectable({
  name: 'CxVoicemailDrop',
})
class CxVoicemailDrop extends RcModule {
  constructor(
    private cxClient: CxClient,
    private cxPresence: CxPresence,
    @optional('CxHostIntegration')
    private readonly _host?: CxHostIntegration,
  ) {
    super();
    // The picker runs its drop on the port that shows it, so every port the
    // chunk loads on registers.
    this._host?.setVoicemailDropHandler((cxCallId, messageId) =>
      this.dropVoicemail(cxCallId, messageId),
    );
    // A picker left open for an ended call has nothing to drop on. Call
    // events only fire where the CX SDK runs.
    this.cxPresence.onCallEnded((call) => {
      if (call?.session) {
        void this.closePicker(this.cxClient.encodeUii(call.session));
      }
    });
  }

  /**
   * The agent's own RingEX extension as a CX transfer destination, or `null`
   * before the host has loaded extension and account info.
   */
  get ownDestination(): string | null {
    const extension = this._host?.currentExtension;
    if (!extension) {
      return null;
    }
    return `${extension.mainNumber}*${extension.extensionNumber}@RC_EXT`;
  }

  /**
   * Whether a drop can be offered on this call: an outbound call that can
   * still be transferred, with a user allowed to drop voicemail and to turn
   * off the RingEX busy state that would send the transfer to voicemail.
   */
  canDropVoicemail(cxCallId: string): boolean {
    const call = this.cxPresence.callsMapping[cxCallId];
    return Boolean(
      this._host?.hasVoicemailDropPermission &&
        this._host.canDisableBusyState &&
        this.ownDestination &&
        call?.allowTransfer &&
        !call.endedCall &&
        call.callType !== INBOUND_CALL_TYPE &&
        getCallAni(call),
    );
  }

  /** Opens the host message picker for this call. */
  async openPicker(cxCallId: string): Promise<void> {
    await this._host?.openVoicemailDropForCxCall(cxCallId);
  }

  /** Closes the picker if it is open for this call. */
  async closePicker(cxCallId: string): Promise<void> {
    await this._host?.closeVoicemailDropForCxCall(cxCallId);
  }

  /**
   * Hands the call to the RingEX webphone for a voicemail drop.
   *
   * RingCX keeps the agent's RingEX busy state on during the call, and RingEX
   * would send the transferred call to voicemail. So the busy state goes off
   * first, and nothing is transferred if that fails.
   *
   * The hint is registered before the transfer, because the transferred
   * INVITE can arrive before the transfer request resolves.
   * @returns `transferred` once the call is on its way; the agent's call
   * then ends.
   */
  @delegate('server')
  async dropVoicemail(
    cxCallId: string,
    messageId: string,
  ): Promise<CxVoicemailDropResult> {
    const call = this.cxPresence.callsMapping[cxCallId];
    const extension = this._host?.currentExtension;
    const dialDest = this.ownDestination;
    if (!this._host || !call || !extension || !dialDest) {
      return 'failed';
    }
    if (!this.canDropVoicemail(cxCallId)) {
      return 'failed';
    }
    const busyState = await this._host.disableBusyState();
    this.logger.info('CX voicemail drop busy state', busyState);
    if (busyState === 'failed') {
      return 'busyStateFailed';
    }
    const hintId = await this._host.registerVoicemailDropHint({
      customerNumber: getCallAni(call),
      extensionNumber: extension.extensionNumber,
      messageId,
    });
    try {
      await this.cxClient.coldTransferCall({ dialDest });
      return 'transferred';
    } catch (error) {
      this.logger.error('CX voicemail drop transfer failed', error);
      await this._host.clearVoicemailDropHint(hintId);
      return 'failed';
    }
  }
}

export { CxVoicemailDrop };
