import {
  action,
  getRef,
  injectable,
  inject,
  optional,
  RcModule,
  state,
  storage,
  StoragePlugin,
  watch,
  PortManager,
  delegate,
  delegateRole,
  RoleUnavailableError,
} from '@ringcentral-integration/next-core';
import { EventEmitter } from 'events';
import { Auth } from '@ringcentral-integration/micro-auth/src/app/services';
import { CxSoftphoneEvents } from '../../enums';
import { dialoutStatuses } from '../../enums/dialoutStatus';
import { sleep } from '../../lib/utils';
import { CxCallbackTypes } from '../CxClient/enums';
import type { CxSipRingingData } from '../CxClient/interfaces/CxClientCallMapping.interface';
import type { CxOffhookInitResponse } from '../CxClient/interfaces/CxSdkResponse.interface';
import { CxClient } from '../CxClient';
import { CxAuth } from '../CxAuth';
import { CxSubscription } from '../CxSubscription';
import { CxAgentSession } from '../CxAgentSession';
import { CxPresence } from '../CxPresence';
import type { CxCall } from '../CxCall/CxCall';
import { lastInteractedClientRole } from '../../../app/services/ClientInteraction';
import { WebphoneAlerting } from '../../../app/services/WebphoneAlerting';
import { Webphone as MicroPhoneWebphone } from '@ringcentral-integration/micro-phone/src/app/services';
import type { Webphone } from '../../../app/services/WebphoneV2';
import type {
  CxIntegratedSoftphoneOptions,
  SipState,
} from './CxIntegratedSoftphone.interface';

const SECOND = 1000;
const RECONNECT_DEBOUNCE_TIME = SECOND * 5;
const RECONNECT_DEBOUNCE_TIME_WHEN_CONNECTED = SECOND * 15;
const SIP_MAX_CONNECTING_TIME = SECOND * 30;

/**
 * CxIntegratedSoftphone module - WebRTC softphone integration
 * Handles SIP registration, audio permissions, and call handling via WebRTC
 */
@injectable({
  name: 'CxIntegratedSoftphone',
})
class CxIntegratedSoftphone extends RcModule {
  private _eventEmitter = new EventEmitter();
  private _sipConnected = false;
  private _isCloseWhenCallConnected = false;
  /**
   * Bumped on every reset, so a `connectWebRTC` still waiting out its
   * reconnect debounce can tell that the agent session it started for is gone.
   */
  private _sessionGeneration = 0;

  constructor(
    private cxClient: CxClient,
    private auth: Auth,
    private cxAuth: CxAuth,
    private cxSubscription: CxSubscription,
    private cxAgentSession: CxAgentSession,
    private cxPresence: CxPresence,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    private webphoneAlerting: WebphoneAlerting,
    @inject(MicroPhoneWebphone) private webphone: Webphone,
    @optional('CxIntegratedSoftphoneOptions')
    private evIntegratedSoftphoneOptions?: CxIntegratedSoftphoneOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this.initialize();
      });
    } else {
      this.initialize();
    }
  }

  @storage
  @state
  audioPermission = false;

  @storage
  @state
  muteActive = false;

  @state
  sipRegisterSuccess = false;

  @state
  sipRegistering = false;

  @state
  sipUnstableConnection = false;

  /** The SDK is rebuilding the SIP session against another registrar. */
  @state
  attemptingSoftphoneReconnect = false;

  /**
   * Automatic recovery has been exhausted, so the agent is offered a retry.
   * SIP.js will not reconnect its own transport, so without this the softphone
   * stays down with no way back.
   */
  @state
  manualSoftphoneReconnect = false;

  get sipState(): SipState {
    if (this.sipRegistering) {
      return 'registering';
    }
    if (this.sipRegisterSuccess) {
      return 'registered';
    }
    return 'idle';
  }

  get isIntegratedSoftphone(): boolean {
    return this.cxAgentSession.isIntegratedSoftphone;
  }

  /** Whether a call is ringing on the offhook line, waiting for answer. */
  get isRinging(): boolean {
    return this.webphone.cxOffhookRinging;
  }

  /**
   * Determine whether an incoming SIP call should be answered automatically.
   * Reads CxCall from the module map rather than injecting it, because CxCall
   * already depends on this module and importing it back would be a cycle.
   * - autoAnswer: agent configured auto-answer in session settings
   * - isMonitoring: monitoring/coaching inbound calls must always be auto-answered
   */
  get shouldAutoAnswer(): boolean {
    if (this.cxAgentSession.autoAnswer) {
      return true;
    }
    const cxCall = getRef(this).modules?.CxCall as CxCall | undefined;
    return Boolean(cxCall?.currentCall?.isMonitoring);
  }

  @action
  _setAudioPermission(permission: boolean) {
    this.audioPermission = permission;
  }

  @delegate('server')
  async setAudioPermission(permission: boolean) {
    this._setAudioPermission(permission);
  }

  @action
  _setMuteActive(muted: boolean) {
    this.muteActive = muted;
  }

  @delegate('server')
  async setMuteActive(muted: boolean) {
    this._setMuteActive(muted);
  }

  @action
  _setSipRegisterSuccess(success: boolean) {
    this.sipRegisterSuccess = success;
  }

  @delegate('server')
  async setSipRegisterSuccess(success: boolean) {
    this._setSipRegisterSuccess(success);
  }

  @action
  _setSipRegistering(registering: boolean) {
    this.sipRegistering = registering;
  }

  @delegate('server')
  async setSipRegistering(registering: boolean) {
    this._setSipRegistering(registering);
  }

  @action
  _setSipUnstableConnection(unstable: boolean) {
    this.sipUnstableConnection = unstable;
  }

  @delegate('server')
  async setSipUnstableConnection(unstable: boolean) {
    this._setSipUnstableConnection(unstable);
  }

  @action
  _setSoftphoneReconnectState({
    attempting,
    manual,
  }: {
    attempting: boolean;
    manual: boolean;
  }) {
    this.attemptingSoftphoneReconnect = attempting;
    this.manualSoftphoneReconnect = manual;
  }

  @delegate('server')
  async setSoftphoneReconnectState(state: {
    attempting: boolean;
    manual: boolean;
  }) {
    this._setSoftphoneReconnectState(state);
  }

  @action
  _resetController() {
    this.muteActive = false;
  }

  @delegate('server')
  async resetController() {
    this._resetController();
  }

  @action
  _resetSip() {
    this.audioPermission = false;
    this.sipRegistering = false;
    this.sipRegisterSuccess = false;
    this.sipUnstableConnection = false;
    this.attemptingSoftphoneReconnect = false;
    this.manualSoftphoneReconnect = false;
  }

  @delegate('server')
  async resetSip() {
    this._resetSip();
  }

  private async _resetAllState() {
    // Before the early returns: a logout that lands while `connectWebRTC` is
    // still debouncing has nothing to tear down yet, but must still stop it.
    this._sessionGeneration += 1;
    if (!this.portManager.isServer) {
      return;
    }
    if (!this._sipConnected && !this.webphone.engageAgentEptEnabled) {
      return;
    }
    this.logger.info('resetAllState~~');
    this._sipConnected = false;
    await this.resetSip();
    try {
      await this.webphone.setEngageAgentEptEnabled(false);
    } catch (error) {
      this.logger.warn('disable Engage EPT headers failed', error);
    }
    this._eventEmitter.emit(CxSoftphoneEvents.RESET);
  }

  initialize() {
    this._bindingIntegratedSoftphone();
    this._bindWebphoneState();
    this._bindAgentSessionReconcile();
    this._initOffhookFlagSync();
    this.cxPresence.onCallEnded(() => {
      void this._unmuteAfterCallEnded();
    });
    this.cxAuth.beforeAgentLogout(async () => {
      this.logger.info('beforeAgentLogout~~');
      await this._resetAllState();
    });
    this.auth.addBeforeLogoutHandler(async () => {
      this.logger.info('addBeforeLogoutHandler~~');
      await this._resetAllState();
    });
    this.cxAgentSession.onReConfigFail(() => {
      if (this.cxAgentSession.isIntegratedSoftphone) {
        this._emitRegistrationFailed();
      }
    });
    this.cxAgentSession.onConfigSuccess(async () => {
      this.logger.info('onConfigSuccess~~');
      this.logger.info(
        'isIntegratedSoftphone~~',
        this.cxAgentSession.isIntegratedSoftphone,
      );
      if (this.cxAgentSession.isIntegratedSoftphone) {
        this.logger.info('sipConnected~~', this._sipConnected);
        if (this._sipConnected) {
          return;
        }
        await this.connectWebRTC();
      } else {
        await this._resetAllState();
      }
    });
  }

  override async onInitSuccess() {
    if (!this.portManager.isServer) {
      return;
    }
    await this._reconcileEngageAgentEpt();
  }

  /**
   * A persistent offhook session carries every CX call, so a mute set on one
   * call would carry over to the next. Agent One unmutes on every END_CALL;
   * do the same so each call starts with a live microphone.
   */
  private async _unmuteAfterCallEnded(): Promise<void> {
    if (!this.portManager.isServer || !this.webphone.cxOffhookMuted) {
      return;
    }
    try {
      await this.sipToggleMute(false);
    } catch (error) {
      this.logger.warn('unmute after CX call ended failed', error);
    }
  }

  /**
   * The EPT roles outlive a reload now that they are persisted, so a session
   * that is not restored as an integrated one has to drop them again.
   * Registering with the Engage role without a live agent session would let
   * the SIP edge place a hidden offhook leg this app can no longer control.
   */
  private async _reconcileEngageAgentEpt(): Promise<void> {
    const keepsRoles =
      this.cxAgentSession.configured && this.isIntegratedSoftphone;
    if (keepsRoles || !this.webphone.engageAgentEptEnabled) {
      return;
    }
    this.logger.info('reconcileEngageAgentEpt~~ dropping stale EPT roles');
    await this.webphone.setEngageAgentEptEnabled(false);
  }

  private _bindAgentSessionReconcile(): void {
    watch(
      this,
      () =>
        [
          this.cxAgentSession.configured,
          this.cxAgentSession.isIntegratedSoftphone,
        ] as const,
      async () => {
        if (!this.portManager.isServer) {
          return;
        }
        await this._reconcileEngageAgentEpt();
      },
      { multiple: true },
    );
  }

  override async onReset() {
    try {
      await this._resetAllState();
    } catch (error) {
      // ignore error during reset
    }
  }

  /**
   * Keep the SDK's reconnect flags in step with the agent's offhook state.
   *
   * The SDK hands these back on `SIP_DIAL_DEST_CHANGED` after it rotates
   * registrars, and that is the only point at which the app learns whether the
   * agent had an audio leg before the drop. Pushing them on every change keeps
   * the answer correct no matter when the network fails.
   */
  private _initOffhookFlagSync(): void {
    watch(
      this,
      () => [this.cxPresence.isOffhook, this.cxPresence.isManualOffhook] as const,
      async ([isOffhook, isManualOffhook]) => {
        if (!this.isIntegratedSoftphone) {
          return;
        }
        await this.cxClient.setOffhookFlags({
          autoStartOH: isOffhook,
          maintainOH: isManualOffhook,
        });
      },
      { multiple: true },
    );
  }

  /**
   * IQ refuses an offhook init while it still believes the agent's previous
   * audio leg is up ("Login Session is already off-hook available"). The
   * platform exposes no dedicated error code for it, so the detail text is
   * the only discriminator.
   */
  private _isStaleOffhookRefusal(data: Partial<CxOffhookInitResponse>): boolean {
    return /already off-?hook/i.test(`${data.detail ?? ''} ${data.message ?? ''}`);
  }

  @delegate('server')
  async retrySoftphoneSession(): Promise<void> {
    this.logger.info('retrySoftphoneSession~~');
    await this.setSoftphoneReconnectState({ attempting: true, manual: false });
    try {
      await this.webphone.reconnectWithCurrentHeaders();
      await this.setSoftphoneReconnectState({
        attempting: false,
        manual: false,
      });
    } catch (error) {
      this.logger.error('retrySoftphoneSession failed', error);
      await this.setSoftphoneReconnectState({
        attempting: false,
        manual: true,
      });
    }
  }

  private _bindWebphoneState() {
    this._bindOffhookRinging();
    watch(
      this,
      () =>
        [
          this.webphone.connected,
          this.webphone.engageAgentEptEnabled,
          this.webphone.connectionStatus,
          this.webphone.cxOffhookConnected,
          this.webphone.cxOffhookMuted,
        ] as const,
      async (
        [connected, eptEnabled, status, offhookConnected, offhookMuted],
        previous,
      ) => {
        if (!this.portManager.isServer) {
          return;
        }
        if (eptEnabled && connected) {
          this._sipConnected = true;
          await this.setSipRegisterSuccess(true);
          await this.setSipRegistering(false);
          await this.setSipUnstableConnection(false);
          await this.setSoftphoneReconnectState({
            attempting: false,
            manual: false,
          });
          this._emitRegistered();
        } else if (eptEnabled && status === 'reconnecting') {
          await this.setSipUnstableConnection(true);
        } else if (
          eptEnabled &&
          (status === 'connectFailed' || status === 'connectError')
        ) {
          this._sipConnected = false;
          await this.setSipRegisterSuccess(false);
          await this.setSipRegistering(false);
          this._emitRegistrationFailed();
        } else if (!eptEnabled || status === 'disconnected') {
          if (this.sipRegisterSuccess) {
            this.cxSubscription.emit(CxCallbackTypes.SIP_UNREGISTERED, null);
          }
          this._sipConnected = false;
          await this.setSipRegisterSuccess(false);
        }
        const wasOffhook = previous?.[3];
        if (offhookConnected && !wasOffhook) {
          await this.cxPresence.setOffhook(true);
          await this.resetController();
        }
        if (!offhookConnected && wasOffhook) {
          await this.cxSubscription.emit(CxCallbackTypes.SIP_ENDED, null);
        }
        await this.setMuteActive(offhookMuted);
      },
      { multiple: true },
    );
  }

  /**
   * Follow CX Embeddable's SIP_RINGING policy: answer immediately when the
   * session requires it, otherwise alert the agent and present the invitation.
   */
  private _bindOffhookRinging(): void {
    watch(
      this,
      () => this.webphone.cxOffhookRinging,
      async (ringing) => {
        if (!this.portManager.isServer) {
          return;
        }
        if (ringing) {
          if (this.shouldAutoAnswer) {
            await this.sipAnswer();
            return;
          }
          await this.webphoneAlerting.setRingCxSoftphoneRinging(true);
          this._eventEmitter.emit(CxCallbackTypes.SIP_RINGING);
          return;
        }
        await this.webphoneAlerting.setRingCxSoftphoneRinging(false);
        this._eventEmitter.emit(CxSoftphoneEvents.RINGING_ENDED);
        // A ring that never connected still has to take the invitation down,
        // because the offhook leg never reaches the state that ends a call.
        if (!this.webphone.cxOffhookConnected) {
          await this.cxSubscription.emit(CxCallbackTypes.SIP_ENDED, null);
        }
      },
    );
  }

  private _bindingIntegratedSoftphone() {
    this.logger.info('_bindingIntegratedSoftphone~~');
    // Every way the offhook leg can end funnels through here, so a ring the
    // agent rejected leaves the agent as idle as a call that really connected.
    this.cxSubscription.subscribe(CxCallbackTypes.SIP_ENDED, async () => {
      this.logger.info('SIP_ENDED~~');
      await this.cxPresence.setOffhook(false);
      await this.cxPresence.setDialoutStatus(dialoutStatuses.idle);
    });
    this.cxSubscription.subscribe(
      CxCallbackTypes.OFFHOOK_INIT,
      async (data?: Partial<CxOffhookInitResponse>) => {
        if (!data) {
          return;
        }
        if (data.status === 'OK') {
          return;
        }
        if (this._isStaleOffhookRefusal(data)) {
          if (!this.cxPresence.isOffhook) {
            this.logger.info(
              'OFFHOOK_INIT refused~~ terminating stale server-side leg',
            );
            await this.cxClient.offhookTerm();
          }
        }
        // Any other refusal, including the agent rejecting the offhook leg, is
        // reported by CxPresence. WebphoneV2 keeps its own registration alive,
        // so a failed offhook is no reason to reconnect it.
      },
    );
  }

  /**
   * Request audio permission
   *
   * Runs in the tab the agent last interacted with, which is where the ringtone
   * plays and call media goes, so a first-time browser prompt shows up in front
   * of the agent instead of in a background main tab.
   */
  async requestAudioPermission(): Promise<boolean> {
    if (!this.portManager.shared) {
      return this._requestAudioPermissionLocally();
    }
    try {
      return await this._requestAudioPermissionOnLastInteractedClient();
    } catch (error) {
      if (!(error instanceof RoleUnavailableError)) {
        throw error;
      }
      return this._requestAudioPermissionOnMainClient();
    }
  }

  @delegateRole(lastInteractedClientRole)
  protected async _requestAudioPermissionOnLastInteractedClient(): Promise<boolean> {
    return this._requestAudioPermissionLocally();
  }

  @delegate('mainClient')
  protected async _requestAudioPermissionOnMainClient(): Promise<boolean> {
    return this._requestAudioPermissionLocally();
  }

  /**
   * Ask for microphone access in this tab and record the result.
   */
  private async _requestAudioPermissionLocally(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      await this.setAudioPermission(true);
      return true;
    } catch (error) {
      await this.setAudioPermission(false);
      return false;
    }
  }

  /**
   * Initialize SIP
   */
  async sipInit(): Promise<void> {
    if (!this.audioPermission) {
      const hasPermission = await this.requestAudioPermission();
      if (!hasPermission) {
        throw new Error('Audio permission denied');
      }
    }
  }

  /**
   * Register SIP
   */
  async sipRegister(): Promise<void> {
    await this.connectWebRTC();
  }

  /**
   * Answer SIP call
   *
   * Runs on the calling port instead of the main client: `webphone.answer`
   * claims call media for the tab it runs in. Auto-answer on the server leaves
   * media with the tab the agent last interacted with; a tab's Answer button
   * claims it for that tab.
   */
  async sipAnswer(): Promise<void> {
    await this.webphoneAlerting.setRingCxSoftphoneRinging(false);
    const sessionId = this.webphone.cxOffhookSessionId;
    if (!sessionId) {
      return;
    }
    await this.webphone.answer(sessionId);
  }

  /**
   * Hangup SIP call
   *
   * This and the other offhook controls below run on the server, next to the
   * WebPhone and the server-side CX modules whose state they change. None of
   * them starts media, so unlike `sipAnswer` the calling tab does not matter.
   */
  @delegate('server')
  async sipHangUp(): Promise<void> {
    const sessionId = this.webphone.cxOffhookSessionId;
    if (!sessionId) {
      return;
    }
    await this.webphone.hangup(sessionId);
  }

  /**
   * Reject SIP call.
   *
   * The alert is silenced up front rather than waiting for the offhook leg to
   * disappear, because the SIP teardown is a round trip the agent should not
   * have to listen through.
   */
  @delegate('server')
  async sipReject(): Promise<void> {
    this.cxPresence.showOffHookInitError = false;
    await this.webphoneAlerting.setRingCxSoftphoneRinging(false);
    const sessionId = this.webphone.cxOffhookSessionId;
    if (sessionId) {
      try {
        await this.webphone.reject(sessionId);
      } catch (error) {
        this.logger.warn('CX offhook reject failed', error);
      }
    }
    this._eventEmitter.emit(CxSoftphoneEvents.CALL_REJECTED);
  }

  /**
   * Terminate SIP
   */
  @delegate('server')
  async sipTerminate(): Promise<void> {
    await this.webphone.setEngageAgentEptEnabled(false);
    await this.setSipRegisterSuccess(false);
  }

  /**
   * Send DTMF
   */
  @delegate('server')
  async sipSendDTMF(dtmf: string): Promise<void> {
    const sessionId = this.webphone.cxOffhookSessionId;
    if (!sessionId) {
      return;
    }
    await this.webphone.sendDTMF(dtmf, sessionId);
  }

  /**
   * Mute or unmute the hidden offhook Webphone session.
   */
  @delegate('server')
  async sipToggleMute(state: boolean): Promise<void> {
    const sessionId = this.webphone.cxOffhookSessionId;
    if (!sessionId) {
      return;
    }
    if (state) {
      await this.webphone.mute(sessionId);
      return;
    }
    await this.webphone.unmute(sessionId);
  }

  private _emitRegistered() {
    this._eventEmitter.emit(CxSoftphoneEvents.REGISTERED);
  }

  private _emitRegistrationFailed() {
    this.cxSubscription.emit(CxCallbackTypes.SIP_REGISTRATION_FAILED, null);
  }

  /**
   * Register callback for SIP registered event
   */
  onRegistered(callback: () => void): this {
    this._eventEmitter.on(CxSoftphoneEvents.REGISTERED, callback);
    return this;
  }

  /**
   * Register callback for SIP ringing event
   */
  onRinging(callback: (call?: CxSipRingingData) => void): this {
    this._eventEmitter.on(CxCallbackTypes.SIP_RINGING, callback);
    return this;
  }

  /**
   * Register callback for the offhook leg leaving the ringing state, whether it
   * was answered, rejected, or ended, from this app or from the host page.
   */
  onRingingEnded(callback: () => void): this {
    this._eventEmitter.on(CxSoftphoneEvents.RINGING_ENDED, callback);
    return this;
  }

  /**
   * Wait for SIP registration to complete with timeout
   * Rejects if RESET event fires or timeout (30s) is reached
   */
  onceRegistered(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this.sipRegisterSuccess) {
        resolve();
        return;
      }
      let settled = false;
      const cleanup = () => {
        settled = true;
        clearTimeout(timer);
        this._eventEmitter.off(CxSoftphoneEvents.REGISTERED, onRegistered);
        this._eventEmitter.off(CxSoftphoneEvents.RESET, onReset);
      };
      const onRegistered = () => {
        if (settled) return;
        cleanup();
        resolve();
      };
      const onReset = () => {
        if (settled) return;
        cleanup();
        this._emitRegistrationFailed();
        reject(new Error('SIP registration reset'));
      };
      const timer = setTimeout(() => {
        if (settled) return;
        cleanup();
        this._emitRegistrationFailed();
        reject(new Error('SIP registration timeout'));
      }, SIP_MAX_CONNECTING_TIME);
      this._eventEmitter.once(CxSoftphoneEvents.REGISTERED, onRegistered);
      this._eventEmitter.once(CxSoftphoneEvents.RESET, onReset);
    });
  }

  /**
   * Ask for audio permission with optional force parameter
   */
  async askAudioPermission(force = true): Promise<boolean> {
    if (!force && this.audioPermission) {
      return true;
    }
    return this.requestAudioPermission();
  }

  /**
   * Connect WebRTC with SIP init and register
   * Includes reconnect debounce for force login / reconnection scenarios
   */
  async connectWebRTC(): Promise<void> {
    this.logger.info('connectWebRTC~~');
    const generation = this._sessionGeneration;
    await this.askAudioPermission();
    if (this.sipRegistering) {
      throw new Error('SIP is already registering');
    }
    try {
      this.logger.info('setSipRegistering true~~');
      await this.setSipRegistering(true);
      if (
        this.cxAgentSession.isReconnected ||
        this.cxAgentSession.isForceLogin
      ) {
        this.logger.info('reconnect debounce~~');
        const debounceTime = this._isCloseWhenCallConnected
          ? RECONNECT_DEBOUNCE_TIME_WHEN_CONNECTED
          : RECONNECT_DEBOUNCE_TIME;
        await sleep(debounceTime);
      }
      // Registering the EPT roles for a session that has already ended would
      // leave a stale Engage registration behind this app's back.
      if (generation !== this._sessionGeneration) {
        this.logger.info('connectWebRTC~~ agent session reset, skip EPT');
        await this.setSipRegistering(false);
        return;
      }
      await this.webphone.setEngageAgentEptEnabled(true);
      // Enabling the roles no longer forces a connection of its own, so the
      // session still has to make sure one exists. Both calls are no-ops when
      // the webphone already registered with the roles after a reload.
      await this.webphone.connect();
      if (this.webphone.connected) {
        this._sipConnected = true;
        await this.setSipRegisterSuccess(true);
        await this.setSipRegistering(false);
        this._emitRegistered();
        return;
      }
      await this.onceRegistered();
      await this.setSipRegistering(false);
    } catch (error) {
      await this.setSipRegistering(false);
      this.logger.error('WebRTC connection error:', error);
      throw error;
    }
  }
}

export { CxIntegratedSoftphone };
