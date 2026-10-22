import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import { Webphone as MicroPhoneWebphone } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  action,
  delegate,
  inject,
  injectable,
  optional,
  RcModule,
  state,
} from '@ringcentral-integration/next-core';

import type { CxHostIntegration } from '../../../app/services/RingCX/RingCX.interface';
import type { VoicemailDropStatusDetails } from '../../../app/services/VoicemailDrop/VoicemailDrop.interface';
import type { Webphone } from '../../../app/services/WebphoneV2';
import {
  isVoicemailDropRunning,
  voicemailDropStatus,
} from '../../../app/services/WebphoneV2/voicemailDropStatus';
import { RoutedSideWidgetView } from '../../../app/views/RoutedSideWidgetView';
import type { RingCXAdapterBridge } from '../../interfaces/RingCXAdapterBridge.interface';
import { cxPath } from '../../routes';
import { shouldShowDispositionSubmitStep } from '../../utils/shouldShowDispositionSubmitStep';
import { CxActiveCallControl } from '../CxActiveCallControl';
import { CxCallDisposition } from '../CxCallDisposition';
import { CxClient } from '../CxClient';
import { CxPresence } from '../CxPresence';

import type { CxVoicemailDropState } from './CxVoicemailDrop.interface';
import { t } from './i18n';

/** Voicemail drop is offered on outbound calls only, as on RingEX. */
const INBOUND_CALL_TYPE = 'INBOUND';

/**
 * CxVoicemailDrop module - drops a pre-recorded voicemail on a CX call
 *
 * The CX call's audio runs over the hidden RingEX webphone session (the
 * offhook session), so the RingEX voicemail drop pipeline plays the message
 * on that session and keeps it up for the next CX call. This module follows
 * the drop: it hangs up the CX call when the message ends, and puts the voice
 * channel back when the CX call ends (`plans/cx-voicemail-drop`).
 */
@injectable({
  name: 'CxVoicemailDrop',
})
class CxVoicemailDrop extends RcModule {
  /** Running drops, by CX call id. */
  @state
  drops: Record<string, CxVoicemailDropState> = {};

  /**
   * Server only: the offhook session each CX call dropped on, kept until the
   * CX call ends so the voice channel can be put back then.
   */
  private _droppedCalls = new Map<string, string>();

  constructor(
    private cxClient: CxClient,
    private cxPresence: CxPresence,
    private cxActiveCallControl: CxActiveCallControl,
    private cxCallDisposition: CxCallDisposition,
    private toast: Toast,
    @inject(MicroPhoneWebphone) private webphone: Webphone,
    @optional('CxHostIntegration')
    private readonly _host?: CxHostIntegration,
    @optional('RingCXAdapterBridge')
    private readonly _bridge?: RingCXAdapterBridge,
    @optional()
    private readonly _routedSideWidgetView?: RoutedSideWidgetView,
  ) {
    super();
    // The picker runs its drop on the port that shows it, so every port the
    // chunk loads on registers.
    this._host?.setVoicemailDropHandler((cxCallId, messageId) =>
      this.dropVoicemail(cxCallId, messageId),
    );
    // Call events only fire where the CX SDK runs, the server.
    this.cxPresence.onCallEnded((call) => {
      if (call?.session) {
        this._handleCallEnded(this.cxClient.encodeUii(call.session));
      }
    });
    // Drop progress is reported where the webphone sessions live, the server.
    this.webphone.onVoicemailDropStatusChanged((sessionId, status, details) =>
      this._handleDropStatus(sessionId, status, details),
    );
  }

  /** The running drop's status for a CX call, or `null`. */
  getDropStatus(cxCallId: string): string | null {
    return this.drops[cxCallId]?.status ?? null;
  }

  /** The running drop on a CX call, with its progress, or `null`. */
  getDrop(cxCallId: string): CxVoicemailDropState | null {
    return this.drops[cxCallId] ?? null;
  }

  /**
   * Whether a drop can be offered on this call: an outbound call with a live
   * voice channel, which only the integrated softphone has, and a user
   * allowed to drop voicemail.
   */
  canDropVoicemail(cxCallId: string): boolean {
    const call = this.cxPresence.callsMapping[cxCallId];
    return Boolean(
      this._host?.hasVoicemailDropPermission &&
        this.webphone.cxOffhookSessionId &&
        call &&
        !call.endedCall &&
        call.callType !== INBOUND_CALL_TYPE &&
        !this.getDropStatus(cxCallId),
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
   * Plays the message on the CX voice channel, then opens the call's
   * disposition in the side panel so the agent can fill it in meanwhile.
   *
   * Runs on the port that shows the picker, which is where a side widget page
   * opens, as the call page's Disposition action does.
   * @returns whether the drop started
   */
  async dropVoicemail(cxCallId: string, messageId: string): Promise<boolean> {
    const started = await this.startDrop(cxCallId, messageId);
    if (started) {
      this._showDispositionInSidePanel(cxCallId);
    }
    return started;
  }

  /** Starts the drop on the server, next to the webphone sessions. */
  @delegate('server')
  async startDrop(cxCallId: string, messageId: string): Promise<boolean> {
    const offhookSessionId = this.webphone.cxOffhookSessionId;
    if (!offhookSessionId || !this.canDropVoicemail(cxCallId)) {
      return false;
    }
    const started = await this.webphone.dropVoicemailMessage(
      offhookSessionId,
      messageId,
      { keepSession: true },
    );
    if (started) {
      this._droppedCalls.set(cxCallId, offhookSessionId);
      this._setDropStatus(cxCallId, voicemailDropStatus.waitingForGreetingEnd, {
        now: Date.now(),
      });
    }
    return started;
  }

  /**
   * Stops the message and gives the call back to the agent. A drop that has
   * already finished is left alone: its hang-up is on the way.
   * @returns whether a running drop was stopped
   */
  @delegate('server')
  async takeOver(cxCallId: string): Promise<boolean> {
    const offhookSessionId = this._droppedCalls.get(cxCallId);
    if (!offhookSessionId || !this.getDropStatus(cxCallId)) {
      return false;
    }
    return this.webphone.cancelVoicemailDrop(offhookSessionId);
  }

  @action
  private _setDropStatus(
    cxCallId: string,
    status: string | null,
    {
      now,
      messageDuration,
    }: { now?: number } & VoicemailDropStatusDetails = {},
  ) {
    if (!status) {
      delete this.drops[cxCallId];
      return;
    }
    const drop = this.drops[cxCallId];
    const startedAt = drop?.startedAt ?? now ?? 0;
    if (status === voicemailDropStatus.sending) {
      this.drops[cxCallId] = {
        status,
        startedAt,
        sendingStartedAt: drop?.sendingStartedAt ?? now,
        messageDuration: messageDuration ?? drop?.messageDuration,
      };
      return;
    }
    this.drops[cxCallId] = { ...drop, status, startedAt };
  }

  private _findCallIdBySession(sessionId?: string): string | null {
    if (!sessionId) {
      return null;
    }
    for (const [cxCallId, offhookSessionId] of this._droppedCalls) {
      if (offhookSessionId === sessionId && this.getDropStatus(cxCallId)) {
        return cxCallId;
      }
    }
    return null;
  }

  private _handleDropStatus(
    sessionId: string,
    status: string,
    details?: VoicemailDropStatusDetails,
  ) {
    const cxCallId = this._findCallIdBySession(sessionId);
    if (!cxCallId) {
      return;
    }
    this._notifyHost(cxCallId, status);
    if (isVoicemailDropRunning(status)) {
      this._setDropStatus(cxCallId, status, { ...details, now: Date.now() });
      return;
    }
    this._setDropStatus(cxCallId, null);
    if (status === voicemailDropStatus.finished) {
      void this._hangUp(cxCallId);
      return;
    }
    if (status === voicemailDropStatus.greetingDetectionFailed) {
      // As on RingEX: no greeting end means no drop, and the call ends.
      this.toast.danger({ message: t('greetingNotDetected') });
      void this._hangUp(cxCallId);
    }
    // `cancelled` keeps the call up for the agent; `terminated` means the
    // voice channel is already gone.
  }

  private _handleCallEnded(cxCallId: string) {
    void this.closePicker(cxCallId);
    const offhookSessionId = this._droppedCalls.get(cxCallId);
    if (!offhookSessionId) {
      return;
    }
    this._droppedCalls.delete(cxCallId);
    if (this.getDropStatus(cxCallId)) {
      // The customer hung up or the agent ended the call mid-drop.
      this._notifyHost(cxCallId, voicemailDropStatus.cancelled);
      this._setDropStatus(cxCallId, null);
    }
    // With a persistent offhook the same session carries the next CX call, so
    // whatever happened to the drop, the agent's microphone and speaker must
    // work again. A session that ended with the call has nothing to restore.
    void this.webphone.restoreCxVoiceChannel(offhookSessionId);
  }

  private async _hangUp(cxCallId: string) {
    const sessionId =
      this.cxPresence.callsMapping[cxCallId]?.session?.sessionId;
    if (!sessionId) {
      return;
    }
    try {
      await this.cxActiveCallControl.hangUp(sessionId);
    } catch (error) {
      this.logger.warn('CX voicemail drop hang-up failed', error);
    }
  }

  private _notifyHost(cxCallId: string, status: string) {
    const call = this.cxPresence.callsMapping[cxCallId];
    if (call) {
      this._bridge?.onVoicemailDropped?.(call, status);
    }
  }

  /**
   * Opens disposition as a side widget page while the main column stays on
   * the call page. Without routed side widgets that would move the main
   * column off the call, so the Disposition action is left to the agent.
   */
  private _showDispositionInSidePanel(cxCallId: string) {
    const call = this.cxPresence.callsMapping[cxCallId];
    if (
      !this._routedSideWidgetView ||
      !shouldShowDispositionSubmitStep(call) ||
      this.cxCallDisposition.isDisposed(cxCallId)
    ) {
      return;
    }
    void this._routedSideWidgetView.showPage(cxPath.disposition(cxCallId));
  }
}

export { CxVoicemailDrop };
