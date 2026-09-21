import {
  action,
  computed,
  injectable,
  optional,
  PortManager,
  RcModule,
  state,
  storage,
  StoragePlugin,
  watch,
  delegate,
} from '@ringcentral-integration/next-core';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';

import type { CxHostIntegration } from '../../../app/services/RingCX/RingCX.interface';
import { dialoutStatuses, messageTypes } from '../../enums';
import { t } from './i18n';
import { callErrors } from '../../enums/callErrors';
import { CxCallbackTypes } from '../CxClient/enums';
import type {
  CxOffhookInitResponse,
  CxBaseCall,
  CxEndedCall,
} from '../CxClient/interfaces';
import { CxClient } from '../CxClient';
import { CxAuth } from '../CxAuth';
import { CxSettings } from '../CxSettings';
import { CxPresence } from '../CxPresence';
import { CxAgentSession } from '../CxAgentSession';
import { CxIntegratedSoftphone } from '../CxIntegratedSoftphone';
import { CxSubscription } from '../CxSubscription';
import { CxWorkingState } from '../CxWorkingState';
import { parseNumber } from '../../lib/parseNumber';
import { checkCountryCode } from '../../lib/checkCountryCode';
import { track } from '../Analytics/track';
import { trackEvents } from '../../lib/trackEvents';
import type {
  CxCallOptions,
  CxDialoutOptions,
  DialoutFormGroup,
  ManualOutdialParams,
  RingTimeLimit,
} from './CxCall.interface';
import { hasRemainingLiveCall } from '../../utils/hasRemainingLiveCall';

const DEFAULT_OUTBOUND_SETTING: DialoutFormGroup = {
  dialoutCallerId: '-1',
  dialoutQueueId: '-1',
  dialoutCountryId: 'USA',
  dialoutRingTime: 30,
};

/**
 * CxCall module - Outbound call management
 * Handles dialout settings, outbound dialing, and call initiation
 */
@injectable({
  name: 'CxCall',
})
class CxCall extends RcModule {
  ringTimeLimit: RingTimeLimit = {
    min: 20,
    max: 120,
  };

  constructor(
    protected cxClient: CxClient,
    protected cxAuth: CxAuth,
    protected cxSettings: CxSettings,
    protected cxPresence: CxPresence,
    protected cxAgentSession: CxAgentSession,
    protected cxIntegratedSoftphone: CxIntegratedSoftphone,
    protected cxSubscription: CxSubscription,
    protected cxWorkingState: CxWorkingState,
    protected toast: Toast,
    protected storagePlugin: StoragePlugin,
    protected portManager: PortManager,
    @optional('CxHostIntegration')
    private readonly _host?: CxHostIntegration,
    @optional('CxCallOptions') protected evCallOptions?: CxCallOptions,
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

  /**
   * Persisted so a page reload can still point at the call being worked on.
   * Without it the pointer is lost on refresh and the agent has no route back
   * to a disposition the server is still waiting for.
   */
  @storage
  @state
  activityCallId = '';

  @action
  setActivityCallId(id: string) {
    this.activityCallId = id;
  }

  @storage
  @state
  dialoutCallerId = DEFAULT_OUTBOUND_SETTING.dialoutCallerId;

  @storage
  @state
  dialoutQueueId = DEFAULT_OUTBOUND_SETTING.dialoutQueueId;

  @storage
  @state
  dialoutCountryId = DEFAULT_OUTBOUND_SETTING.dialoutCountryId;

  @storage
  @state
  dialoutRingTime = DEFAULT_OUTBOUND_SETTING.dialoutRingTime;

  @storage
  @state
  formGroup: DialoutFormGroup = { ...DEFAULT_OUTBOUND_SETTING };

  get ringTime(): number {
    return this.dialoutRingTime;
  }

  get queueId(): string | null {
    return this.dialoutQueueId === '-1' ? null : this.dialoutQueueId;
  }

  get callerId(): string | null {
    return this.dialoutCallerId === '-1' ? null : this.dialoutCallerId;
  }

  get countryId(): string {
    return this.dialoutCountryId;
  }

  get dialoutStatus(): string {
    return this.cxPresence.dialoutStatus;
  }

  get isDialing(): boolean {
    return this.cxPresence.dialoutStatus === dialoutStatuses.dialing;
  }

  get isIdle(): boolean {
    return this.cxPresence.dialoutStatus === dialoutStatuses.idle;
  }

  get currentCall(): CxBaseCall | null {
    const call = this.cxPresence.callsMapping[this.activityCallId];
    return this.activityCallId && call ? call : null;
  }

  get isOnLoginSuccess(): boolean {
    return this.ready && this.cxAuth.isEvLogged;
  }

  get isInbound(): boolean {
    return this.currentCall?.callType === 'INBOUND';
  }

  get callerIds() {
    return this.cxAuth.callerIds;
  }

  get availableQueues() {
    return this.cxAuth.availableQueues;
  }

  get availableCountries() {
    return this.cxAuth.availableCountries;
  }

  @action
  _setFormGroup(data: Partial<DialoutFormGroup>) {
    this.formGroup = { ...this.formGroup, ...data };
  }

  @delegate('server')
  async setFormGroup(data: Partial<DialoutFormGroup>): Promise<void> {
    this._setFormGroup(data);
  }

  @action
  _saveForm() {
    this.dialoutCallerId = this.formGroup.dialoutCallerId;
    this.dialoutQueueId = this.formGroup.dialoutQueueId;
    this.dialoutCountryId = this.formGroup.dialoutCountryId;
    this.dialoutRingTime = this.formGroup.dialoutRingTime;
  }

  @delegate('server')
  async saveForm(): Promise<void> {
    this._saveForm();
  }

  @action
  _resetOutBoundDialSetting() {
    this.dialoutCallerId = DEFAULT_OUTBOUND_SETTING.dialoutCallerId;
    this.dialoutQueueId = DEFAULT_OUTBOUND_SETTING.dialoutQueueId;
    this.dialoutCountryId = DEFAULT_OUTBOUND_SETTING.dialoutCountryId;
    // Fallback to first available country if USA is not available
    if (
      this.cxAuth.availableCountries.length > 0 &&
      !this.cxAuth.availableCountries.find(
        (c: any) => c.countryId === this.dialoutCountryId,
      )
    ) {
      this.dialoutCountryId = this.cxAuth.availableCountries[0].countryId;
    }
    this.dialoutRingTime = DEFAULT_OUTBOUND_SETTING.dialoutRingTime;
    const defaultRingTime = parseInt(
      this.cxAuth.outboundManualDefaultRingtime,
      10,
    );
    if (!Number.isNaN(defaultRingTime)) {
      this.formGroup.dialoutRingTime = defaultRingTime;
      this.dialoutRingTime = defaultRingTime;
    }
    this.formGroup = {
      dialoutCallerId: this.dialoutCallerId,
      dialoutQueueId: this.dialoutQueueId,
      dialoutCountryId: this.dialoutCountryId,
      dialoutRingTime: this.dialoutRingTime,
    };
  }

  @delegate('server')
  async resetOutBoundDialSetting(): Promise<void> {
    this._resetOutBoundDialSetting();
  }

  async resetFormGroup() {
    await this.setFormGroup({
      dialoutCallerId: this.dialoutCallerId,
      dialoutQueueId: this.dialoutQueueId,
      dialoutCountryId: this.dialoutCountryId,
      dialoutRingTime: this.dialoutRingTime,
    });
  }

  /**
   * Alias for resetFormGroup for backwards compatibility
   */
  async resetForm() {
    await this.resetFormGroup();
  }

  setDialoutStatus(status: string) {
    this.cxPresence.setDialoutStatus(status as any);
  }

  setPhoneIdle() {
    this.setDialoutStatus(dialoutStatuses.idle);
  }

  setPhoneDialing() {
    this.setDialoutStatus(dialoutStatuses.dialing);
  }

  /**
   * Check if ring time is within valid range and adjust if necessary
   */
  checkDialoutRingTime(): void {
    const dialoutRingTime = Math.min(
      Math.max(this.formGroup.dialoutRingTime, this.ringTimeLimit.min),
      this.ringTimeLimit.max,
    );
    if (dialoutRingTime !== this.formGroup.dialoutRingTime) {
      this.setFormGroup({ dialoutRingTime });
    }
  }

  /**
   * Check if agent is able to make a call
   */
  checkIsAbleToCall(): boolean {
    if (
      this.dialoutStatus !== dialoutStatuses.idle ||
      this.cxPresence.calls.length > 0 ||
      this.cxWorkingState.isPendingDisposition
    ) {
      this.logger.info(
        'Unavailable to call, have a call or is PendingDisposition.',
      );
      if (this.cxPresence.calls.length === 0) {
        this.setPhoneIdle();
      }
      this.toast.danger({
        message: t(messageTypes.FAILED_TO_CALL),
        ttl: 0,
      });
      return false;
    }
    return true;
  }

  initialize() {
    watch(
      this,
      () => this.isOnLoginSuccess,
      (isOnLoginSuccess) => {
        if (isOnLoginSuccess) {
          this.resetFormGroup();
        }
        if (this.cxAuth.isFreshLogin) {
          this.resetOutBoundDialSetting();
        }
        this.checkQueueId();
      },
    );
    // Subscribe to call ended events. Idle is only restored when this
    // notification ends the last live session -- a queued call can already
    // be in `callIds`, or can land there before this handler runs.
    this.cxSubscription.subscribe(CxCallbackTypes.END_CALL, (data: CxEndedCall) => {
      if (
        hasRemainingLiveCall({
          endedCall: {
            uii: data?.uii ?? '',
            sessionId: data?.sessionId ?? '',
          },
          callIds: this.cxPresence.callIds,
        })
      ) {
        return;
      }
      this.setDialoutStatus(dialoutStatuses.idle);
    });
    // Subscribe to TCPA safe lead state
    this.cxSubscription.subscribe(
      CxCallbackTypes.TCPA_SAFE_LEAD_STATE,
      (data: any) => {
        if (['INTERCEPT', 'BUSY', 'NOANSWER'].includes(data?.leadState)) {
          if (!this.cxSettings.isManualOffhook) {
            this.cxClient.offhookTerm();
          }
          this.setPhoneIdle();
        if (data.leadState === 'INTERCEPT') {
          this.toast.info({
            message: t(messageTypes.INTERCEPT),
          });
        }
        }
      },
    );
    // Subscribe to offhook term
    this.cxSubscription.subscribe(CxCallbackTypes.OFFHOOK_TERM, () => {
      this.setPhoneIdle();
    });
  }

  async checkQueueId() {
    if (this.dialoutQueueId !== DEFAULT_OUTBOUND_SETTING.dialoutQueueId) {
      // Check if queue is exist, if not, reset to default
      const queueExist = this.cxAuth.availableQueues.some(
        (queue) => queue.gateId === this.dialoutQueueId,
      );
      if (!queueExist) {
        console.log('Queue not exist, reset dialout queue to default');
        await this.resetDialoutQueue();
      }
    }
  }

  @action
  _resetDialoutQueue() {
    this.dialoutQueueId = DEFAULT_OUTBOUND_SETTING.dialoutQueueId;
    this.formGroup.dialoutQueueId = DEFAULT_OUTBOUND_SETTING.dialoutQueueId;
  }

  @delegate('server')
  async resetDialoutQueue(): Promise<void> {
    this._resetDialoutQueue();
  }

  /**
   * Parse and validate phone number
   */
  private _checkAndParseNumber(phoneNumber: string): string {
    try {
      checkCountryCode(phoneNumber, this.cxAuth.availableCountries);
      return parseNumber(phoneNumber);
    } catch (error: any) {
      switch (error.type) {
        case messageTypes.NO_SUPPORT_COUNTRY:
          this.toast.danger({
            message: t(messageTypes.NO_SUPPORT_COUNTRY),
            ttl: 0,
          });
          break;
        case callErrors.emergencyNumber:
          this.toast.danger({
            message: t(callErrors.emergencyNumber),
          });
          break;
        default:
          this.toast.danger({
            message: t(callErrors.noToNumber),
          });
          break;
      }
      throw error;
    }
  }

  /**
   * Initiate an outbound call
   */
  @track((that: CxCall) => [
    trackEvents.outbound,
    { value: that.cxAgentSession.loginType },
  ])
  @delegate('server')
  async dialout(
    phoneNumber: string,
    options?: CxDialoutOptions,
  ): Promise<void> {
    this.logger.info('dialout~~', phoneNumber);
    this.cxPresence.setCurrentCallUii('');
    // Handle integrated softphone
    if (this.cxAgentSession.isIntegratedSoftphone) {
      try {
        if (this.cxIntegratedSoftphone.sipRegisterSuccess) {
          await this.cxIntegratedSoftphone.askAudioPermission(false);
        } else {
          await this.cxAgentSession.configureAgent();
          await this.cxIntegratedSoftphone.onceRegistered();
        }
      } catch (error) {
        return;
      }
    }
    await this.checkQueueId();
    try {
      const destination = options?.skipParse
        ? phoneNumber
        : this._checkAndParseNumber(phoneNumber);
      this.logger.info('destination~~', destination);
      try {
        await this._manualOutdial({
          destination,
          callerId: this.callerId,
          countryId: this.countryId,
          queueId: this.queueId,
          ringTime: this.ringTime,
          directory: options?.directory,
        });
      } catch (error) {
        this._host?.clearExBridgeDestination(destination);
        throw error;
      }
    } catch (error) {
      this.setPhoneIdle();
    }
  }

  /**
   * Cancel an ongoing outbound call
   */
  @delegate('server')
  async outdialCancel(): Promise<void> {
    await this.cxClient.manualOutdialCancel(this.cxPresence.currentCallUii);
  }

  /**
   * Preview dial - used for preview campaign dialing
   */
  @delegate('server')
  async previewDial(
    requestId: string,
    leadPhone: string,
    leadPhoneE164: string,
  ): Promise<void> {
    this.logger.info('previewDial~~', requestId, leadPhone, leadPhoneE164);
    this.cxPresence.setCurrentCallUii('');
    // Handle integrated softphone
    if (this.cxAgentSession.isIntegratedSoftphone) {
      try {
        if (this.cxIntegratedSoftphone.sipRegisterSuccess) {
          await this.cxIntegratedSoftphone.askAudioPermission(false);
        } else {
          await this.cxAgentSession.configureAgent();
          await this.cxIntegratedSoftphone.onceRegistered();
        }
      } catch (error) {
        return;
      }
    }
    try {
      await this._previewDial(requestId, leadPhone, leadPhoneE164);
    } catch (error) {
      this.logger.error('previewDial error', error);
      this.setPhoneIdle();
    }
  }

  /**
   * Internal preview dial implementation
   */
  private async _previewDial(
    requestId: string,
    leadPhone: string,
    leadPhoneE164: string,
  ): Promise<void> {
    if (this.dialoutStatus === dialoutStatuses.dialing) {
      return;
    }
    this.setPhoneDialing();
    let offhookInitResult: CxOffhookInitResponse | undefined;
    try {
      if (!this.cxSettings.isOffhook) {
        const getOffhookInitResult = this._getOffhookInitResult();
        this.cxClient.offhookInit();
        offhookInitResult = await getOffhookInitResult;
        this.logger.info('offhookInitResult~~', offhookInitResult);
      }
      if (
        this.cxSettings.isOffhook ||
        (offhookInitResult && offhookInitResult.status === 'OK')
      ) {
        this.cxClient.previewDial(requestId, leadPhone, leadPhoneE164);
      } else {
        throw new Error("'offhookInit' exception error");
      }
    } catch (e) {
      if (!this.cxSettings.isManualOffhook) {
        this.cxClient.offhookTerm();
      }
      throw e;
    }
  }

  /**
   * Internal manual outdial implementation
   */
  private async _manualOutdial({
    callerId = '',
    destination,
    ringTime = DEFAULT_OUTBOUND_SETTING.dialoutRingTime,
    queueId = '',
    countryId = 'USA',
    directory,
  }: ManualOutdialParams): Promise<void> {
    let offhookInitResult: CxOffhookInitResponse | undefined;
    if (this.dialoutStatus !== dialoutStatuses.dialing) {
      this.setPhoneDialing();
    }
    this._host?.dismissExCallUiForCxCall();
    if (directory) {
      this._host?.registerExBridgeDestination(destination, directory);
    }
    try {
      this.logger.info('manualOutdial~~ isOffhook', this.cxSettings.isOffhook);
      if (!this.cxSettings.isOffhook) {
        const getOffhookInitResult = this._getOffhookInitResult();
        await this.cxClient.offhookInit();
        offhookInitResult = await getOffhookInitResult;
        this.logger.info('offhookInitResult~~', offhookInitResult);
      }
      if (
        this.cxSettings.isOffhook ||
        (offhookInitResult && offhookInitResult.status === 'OK')
      ) {
        this.logger.info('manualOutdial~~');
        await this.cxClient.manualOutdial({
          callerId: callerId || '',
          countryId,
          destination,
          queueId: queueId || '',
          ringTime,
        });
      } else {
        throw new Error("'offhookInit' exception error");
      }
    } catch (e) {
      if (!this.cxSettings.isManualOffhook) {
        this.cxClient.offhookTerm();
      }
      throw e;
    }
  }

  /**
   * Wait for offhook init result
   */
  private _getOffhookInitResult(): Promise<CxOffhookInitResponse> {
    return new Promise((resolve, reject) => {
      this.cxPresence.evPresenceEvents.once(
        CxCallbackTypes.OFFHOOK_INIT,
        (data: CxOffhookInitResponse) => {
          if (data.status === 'OK') {
            resolve(data);
          } else {
            reject(data);
          }
        },
      );
    });
  }
}

export { CxCall };
