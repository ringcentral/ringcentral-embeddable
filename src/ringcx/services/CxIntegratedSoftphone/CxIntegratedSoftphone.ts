import {
  action,
  getRef,
  injectable,
  optional,
  RcModule,
  state,
  storage,
  StoragePlugin,
  watch,
  PortManager,
  delegate,
} from '@ringcentral-integration/next-core';
import { EventEmitter } from 'events';
import { Auth } from '@ringcentral-integration/micro-auth/src/app/services';
import { CxSoftphoneEvents } from '../../enums';
import { dialoutStatuses } from '../../enums/dialoutStatus';
import { sleep } from '../../lib/utils';
import { CxCallbackTypes } from '../CxClient/enums';
import type {
  CxSipDialDestChangedData,
  CxSipRingingData,
  CxSipSuspectRegistrationData,
  CxSipSwitchRegistrarData,
} from '../CxClient/interfaces/CxClientCallMapping.interface';
import type { CxOffhookInitResponse } from '../CxClient/interfaces/CxSdkResponse.interface';
import { CxClient } from '../CxClient';
import { CxAuth } from '../CxAuth';
import { CxSubscription } from '../CxSubscription';
import { CxAgentSession } from '../CxAgentSession';
import { CxPresence } from '../CxPresence';
import type { CxCall } from '../CxCall/CxCall';
import { TabManager } from '../../../app/services/TabManager';
import type {
  CxIntegratedSoftphoneOptions,
  SipState,
} from './CxIntegratedSoftphone.interface';
import { audios } from './audios';
import { planOffhookRecovery } from '../../utils/planOffhookRecovery';

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
  private _audio: HTMLAudioElement | null = null;
  private _sipConnected = false;
  private _isCloseWhenCallConnected = false;

  /**
   * State of the current SIP recovery, used to decide whether a superseded
   * user agent's clean close wiped the live registration.
   *
   * `path` is how the session came back: `quick-reinit` means the SDK
   * re-registered on the same registration info straight from its
   * `_unregistered` handler (the vulnerable path); `registrar-switch` means it
   * went through `resetSoftphoneSession` with fresh registration info.
   */
  private _recoveryTrace: {
    unstableAt: number | null;
    switchRegistrarAt: number | null;
    registeredAt: number | null;
    suspectCloseAt: number | null;
    repairedAt: number | null;
    path: 'none' | 'quick-reinit' | 'registrar-switch';
  } = {
    unstableAt: null,
    switchRegistrarAt: null,
    registeredAt: null,
    suspectCloseAt: null,
    repairedAt: null,
    path: 'none',
  };

  constructor(
    private cxClient: CxClient,
    private auth: Auth,
    private cxAuth: CxAuth,
    private cxSubscription: CxSubscription,
    private cxAgentSession: CxAgentSession,
    private cxPresence: CxPresence,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    private tabManager: TabManager,
    @optional('CxIntegratedSoftphoneOptions')
    private evIntegratedSoftphoneOptions?: CxIntegratedSoftphoneOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this.initialize();
        this.portManager.onMainTabChange(async () => {
          // We only run sip instance on main tab,
          // so when main tab is changed, we need to reset the sip state.
          // So it can reconnect at new main tab
          this.logger.info('onMainTabChange~~');
          if (this.tabManager.popupIsBecomingMain) return;
          this._sipConnected = false;
          this._resetSip();
          this._eventEmitter.emit(CxSoftphoneEvents.RESET);
        });
      });
      this.portManager.onClient(() => {
        this._initAudio();
      });
    } else {
      this.initialize();
      this._initAudio();
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
    if (!this.portManager.isServer) {
      return;
    }
    if (!this._sipConnected) {
      return;
    }
    this.logger.info('resetAllState~~');
    this._sipConnected = false;
    await this.resetSip();
    await this.cxClient.sipTerminate();
    this._eventEmitter.emit(CxSoftphoneEvents.RESET);
  }

  get isMainTab(): boolean {
    return this.portManager?.isMainTab || false;
  }

  initialize() {
    this._bindingIntegratedSoftphone();
    this._initOffhookFlagSync();
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
    this.cxAgentSession.onConfigSuccess(async() => {
      this.logger.info('onConfigSuccess~~');
      this.logger.info('isIntegratedSoftphone~~', this.cxAgentSession.isIntegratedSoftphone);
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

  /**
   * A failed offhook is the first hard evidence that the SIP session is gone,
   * because nothing watches the transport itself. Rotating the registrar is
   * the SDK's own repair for that, so it is driven from here.
   */
  private async _switchRegistrarAfterOffhookFailure(): Promise<void> {
    if (!this.portManager.isServer || !this.isIntegratedSoftphone) {
      return;
    }
    this.logger.info('OFFHOOK_INIT failed~~ switching registrar');
    try {
      await this.cxClient.switchSoftphoneRegistrar(
        this.cxPresence.isManualOffhook,
      );
    } catch (error) {
      this.logger.error('switchSoftphoneRegistrar failed', error);
    }
  }

  /**
   * Repair a registration a superseded user agent may have wiped.
   *
   * A `quick-reinit` recovery re-registers on the same registration info from
   * the SDK's `_unregistered` handler and never refetches it, so it is the
   * only path whose fresh binding a late wildcard un-REGISTER from the old
   * user agent can remove. When that happens the softphone reports
   * "registered" but the platform can no longer route to it, and the agent
   * only discovers it when the next offhook fails with an INTERCEPT.
   *
   * Rotating the registrar is the proven repair: it tears the suspect session
   * down and re-registers against fresh registration info, exactly what the
   * offhook-failure handler already does, so drive it here as soon as the
   * clean close is seen rather than waiting for the agent to hit the error.
   *
   * The clean close and the replacement registration race, and either can
   * reach the server first, so this is driven from both the suspect close and
   * `SIP_REGISTERED` and acts only once both facts hold for the cycle.
   *
   * Guards:
   * - only the `quick-reinit` path is vulnerable; a registrar switch already
   *   refetched its registration info.
   * - skip while the agent has a live audio leg, so a call in progress is not
   *   torn down; the failure this prevents only bites the next idle offhook.
   * - repair at most once per recovery cycle.
   */
  private async _maybeRepairSuspectRegistration(): Promise<void> {
    if (!this.portManager.isServer || !this.isIntegratedSoftphone) {
      return;
    }
    const trace = this._recoveryTrace;
    const shouldRepair =
      trace.path === 'quick-reinit' &&
      trace.registeredAt !== null &&
      trace.suspectCloseAt !== null &&
      trace.repairedAt === null &&
      !this.cxPresence.isOffhook;
    if (!shouldRepair) {
      return;
    }
    this._recoveryTrace.repairedAt = Date.now();
    this.logger.info('suspect registration~~ rotating registrar');
    try {
      await this.cxClient.switchSoftphoneRegistrar(
        this.cxPresence.isManualOffhook,
      );
    } catch (error) {
      this.logger.error('suspect registration repair failed', error);
    }
  }

  /**
   * Rebuild the SIP session at the agent's request.
   *
   * `autoStartOH` is always set so the audio leg comes back with the session
   * rather than leaving the agent registered but silent.
   */
  @delegate('server')
  async retrySoftphoneSession(): Promise<void> {
    this.logger.info('retrySoftphoneSession~~');
    await this.setSoftphoneReconnectState({ attempting: true, manual: false });
    await this.cxClient.resetSoftphoneSession({
      maintainOH: this.cxPresence.isManualOffhook,
      autoStartOH: true,
    });
  }

  /**
   * Rebuild the agent's standing audio leg after the SDK rotated registrars,
   * mirroring EAG's `dialDestChanged` handling. Mid-call audio is not
   * recovered — EAG does not attempt it either; a call whose leg died ends in
   * pending disposition and the agent completes it from there.
   */
  private async _recoverOffhookOnReconnect(
    data?: CxSipDialDestChangedData,
  ): Promise<void> {
    const plan = planOffhookRecovery({
      isServer: this.portManager.isServer,
      isIntegratedSoftphone: this.isIntegratedSoftphone,
      isOffhook: this.cxPresence.isOffhook,
      flags: data,
    });
    this.logger.info('SIP_DIAL_DEST_CHANGED~~ plan', plan.reason);
    if (!plan.shouldRestoreOffhook) {
      return;
    }
    try {
      await this.cxClient.offhookInit();
      if (plan.shouldMaintainOffhook) {
        await this.cxPresence.setIsManualOffhook(true);
      }
    } catch (error) {
      this.logger.error('offhook restore after reconnect failed', error);
    }
  }

  /**
   * Subscribe to all SIP events from CxSubscription
   */
  private _bindingIntegratedSoftphone() {
    this.logger.info('_bindingIntegratedSoftphone~~');
    this.cxSubscription.subscribe(CxCallbackTypes.SIP_REGISTERED, () => {
      this.logger.info('SIP_REGISTERED~~');
      const { unstableAt, switchRegistrarAt } = this._recoveryTrace;
      if (unstableAt !== null) {
        this._recoveryTrace.path =
          switchRegistrarAt !== null && switchRegistrarAt >= unstableAt
            ? 'registrar-switch'
            : 'quick-reinit';
      }
      this._recoveryTrace.registeredAt = Date.now();
      // A suspect close can arrive just before this registration completes, so
      // re-check the repair condition now that the path is classified.
      void this._maybeRepairSuspectRegistration();
      this._sipConnected = true;
      this._isCloseWhenCallConnected = false;
      this.setSipRegisterSuccess(true);
      this.setSipRegistering(false);
      this.setSipUnstableConnection(false);
      this.setSoftphoneReconnectState({ attempting: false, manual: false });
      this._emitRegistered();
    });
    this.cxSubscription.subscribe(CxCallbackTypes.SIP_UNREGISTERED, () => {
      this.logger.info('SIP_UNREGISTERED~~');
      this._sipConnected = false;
      this.setSipRegisterSuccess(false);
    });
    this.cxSubscription.subscribe(
      CxCallbackTypes.SIP_REGISTRATION_FAILED,
      async() => {
        this.logger.info('SIP_REGISTRATION_FAILED~~');
        await this.setSipRegistering(false);
        await this._resetAllState();
        // The SDK fires this when its reset/rotation budget is exhausted.
        // `_resetAllState` returns early when SIP never connected in this
        // cycle, so a reconnect attempt that dies here must be resolved to
        // the manual retry or the spinner never ends.
        if (this.attemptingSoftphoneReconnect || this.manualSoftphoneReconnect) {
          await this.setSoftphoneReconnectState({
            attempting: false,
            manual: true,
          });
        }
      },
    );
    this.cxSubscription.subscribe(CxCallbackTypes.SIP_UNSTABLE_CONNECTION, () => {
      this.logger.info('SIP_UNSTABLE_CONNECTION~~');
      this._recoveryTrace = {
        unstableAt: Date.now(),
        switchRegistrarAt: null,
        registeredAt: null,
        suspectCloseAt: null,
        repairedAt: null,
        path: 'none',
      };
      this.setSipUnstableConnection(true);
    });
    this.cxSubscription.subscribe(
      CxCallbackTypes.SIP_SWITCH_REGISTRAR,
      async (data?: CxSipSwitchRegistrarData) => {
        this.logger.info('SIP_SWITCH_REGISTRAR~~', data);
        this._recoveryTrace.switchRegistrarAt = Date.now();
        // 'RESET' means the SDK is rebuilding the session, 'UPDATE' means it
        // declined to and only refreshed its flags, which leaves the agent
        // stuck until they ask for a retry.
        await this.setSoftphoneReconnectState({
          attempting: data?.status === 'RESET',
          manual: data?.status === 'UPDATE',
        });
      },
    );
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
          // IQ still holds a previous audio leg whose BYE was lost with the
          // old network. The SIP side is healthy, so rotating the registrar
          // cannot help; the server itself asks for a disconnect first, and
          // terminating the orphaned leg lets the agent's next offhook
          // attempt succeed.
          if (!this.cxPresence.isOffhook) {
            this.logger.info(
              'OFFHOOK_INIT refused~~ terminating stale server-side leg',
            );
            await this.cxClient.offhookTerm();
          }
          return;
        }
        await this._switchRegistrarAfterOffhookFailure();
      },
    );
    this.cxSubscription.subscribe(
      CxCallbackTypes.SIP_DIAL_DEST_CHANGED,
      async (data?: CxSipDialDestChangedData) => {
        this.logger.info('SIP_DIAL_DEST_CHANGED~~', data);
        await this._recoverOffhookOnReconnect(data);
      },
    );
    this.cxSubscription.subscribe(
      CxCallbackTypes.SIP_SUSPECT_REGISTRATION,
      async (data?: CxSipSuspectRegistrationData) => {
        this.logger.info('SIP_SUSPECT_REGISTRATION~~', data);
        if (this._recoveryTrace.unstableAt === null) {
          // No recovery is in flight, so this is an ordinary teardown.
          return;
        }
        this._recoveryTrace.suspectCloseAt = Date.now();
        await this._maybeRepairSuspectRegistration();
      },
    );
    this.cxSubscription.subscribe(
      CxCallbackTypes.SIP_RINGING,
      (ringingCall?: CxSipRingingData) => {
        this.logger.info('SIP_RINGING~~');
        this.cxPresence.bindBeforeunload();
        if (this.shouldAutoAnswer) {
          this.sipAnswer();
          return;
        }
        this._eventEmitter.emit(CxCallbackTypes.SIP_RINGING, ringingCall);
      },
    );
    this.cxSubscription.subscribe(CxCallbackTypes.SIP_CONNECTED, async () => {
      this.logger.info('SIP_CONNECTED~~');
      await this.cxPresence.setOffhook(true);
      await this._resetSdkMuteState();
      await this.resetController();
    });
    this.cxSubscription.subscribe(CxCallbackTypes.SIP_ENDED, async () => {
      this.logger.info('SIP_ENDED~~');
      await this.cxPresence.setOffhook(false);
      await this.cxPresence.removeBeforeunload();
      await this.cxPresence.setDialoutStatus(dialoutStatuses.idle);
    });
    this.cxSubscription.subscribe(CxCallbackTypes.SIP_MUTE, () => {
      this.logger.info('SIP_MUTE~~');
      this.setMuteActive(true);
    });
    this.cxSubscription.subscribe(CxCallbackTypes.SIP_UNMUTE, () => {
      this.logger.info('SIP_UNMUTE~~');
      this.setMuteActive(false);
    });
  }

  /**
   * Request audio permission
   */

  @delegate('mainClient')
  async requestAudioPermission(): Promise<boolean> {
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
    await this.cxClient.sipInit();
  }

  /**
   * Register SIP
   */
  async sipRegister(): Promise<void> {
    await this.setSipRegistering(true);
    try {
      await this.cxClient.sipRegister();
    } catch (error) {
      await this.setSipRegistering(false);
      throw error;
    }
  }

  /**
   * Answer SIP call
   */
  @delegate('mainClient')
  async sipAnswer(): Promise<void> {
    await this.cxClient.sipAnswer();
  }

  /**
   * Hangup SIP call
   */
  @delegate('mainClient')
  async sipHangUp(): Promise<void> {
    await this.cxClient.sipHangUp();
  }

  /**
   * Reject SIP call
   */
  @delegate('mainClient')
  async sipReject(): Promise<void> {
    this.cxPresence.showOffHookInitError = false;
    await this.cxClient.sipReject();
    this._eventEmitter.emit(CxSoftphoneEvents.CALL_REJECTED);
    this.cxPresence.removeBeforeunload();
  }

  /**
   * Terminate SIP
   */
  @delegate('mainClient')
  async sipTerminate(): Promise<void> {
    await this.cxClient.sipTerminate();
    await this.setSipRegisterSuccess(false);
  }

  /**
   * Send DTMF
   */
  @delegate('mainClient')
  async sipSendDTMF(dtmf: string): Promise<void> {
    await this.cxClient.sipSendDTMF(dtmf);
  }

  /**
   * Mute or unmute the current SIP call.
   *
   * `muteActive` is deliberately not updated here: the agent library fires
   * SIP_MUTE / SIP_UNMUTE for whatever it actually did, and those handlers own
   * the state. Setting it optimistically would let the button show "muted"
   * while the microphone is still live.
   */
  @delegate('mainClient')
  async sipToggleMute(state: boolean): Promise<void> {
    await this.cxClient.sipToggleMute(state);
  }

  /**
   * The agent library keeps its own `softphoneSettings.muteActive` flag and
   * only clears it on sipTerminate, so a call ended while muted leaves it set.
   * Its toggle unmutes whenever that flag is true, which would silently invert
   * the first mute of the next call. A fresh WebRTC session is never muted, so
   * force the flag back in sync when a call connects.
   */
  private async _resetSdkMuteState(): Promise<void> {
    try {
      await this.cxClient.sipToggleMute(false);
    } catch (error) {
      this.logger.warn('reset sdk mute state failed', error);
    }
  }

  private _initAudio() {
    if (typeof document !== 'undefined' && document.createElement) {
      this._audio = document.createElement('audio');
    }
  }

  private _playAudioLoop(type: keyof typeof audios) {
    if (!this._audio) return;
    this._audio.loop = true;
    this._playAudio(type);
  }

  private _playAudio(type: keyof typeof audios) {
    if (!this._audio) return;
    this._audio.currentTime = 0;
    this._audio.src = audios[type];
    this._audio.play();
  }

  private _stopAudio() {
    if (!this._audio) return;
    this._audio.loop = false;
    this._audio.pause();
  }

  /**
   * Play ringtone audio in loop
   */
  async playRingtone(): Promise<void> {
    this._playAudioLoop('ringtone');
  }

  /**
   * Stop ringtone audio
   */
  stopRingtone() {
    this._stopAudio();
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
    await this.askAudioPermission();
    if (this.sipRegistering) {
      throw new Error('SIP is already registering');
    }
    try {
      this.logger.info('setSipRegistering true~~');
      await this.setSipRegistering(true);
      // Reconnect debounce: delay when reconnecting or force login
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
      // `sip/sipRegistrationInfo` is authenticated with the Engage token,
      // which has no refresh token and expires on its own schedule. The socket
      // reconnect only renews the separate WebSocket token, so after an outage
      // long enough to outlive the Engage token this registration would fail
      // with a 401. Re-exchange it first, as every other Engage HTTP call does.
      const authorized = await this.cxAuth.refreshEvToken();
      if (!authorized) {
        throw new Error('Engage token is expired, cannot register softphone');
      }
      this.logger.info('sipInitAndRegister~~');
      await this.cxClient.sipInitAndRegister({
        agentId: this.cxAuth.getAgentId(),
      });
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
