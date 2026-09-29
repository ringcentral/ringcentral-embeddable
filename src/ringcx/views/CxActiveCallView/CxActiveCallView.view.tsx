import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  action,
  autobind,
  computed,
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  state,
  storage,
  StoragePlugin,
  useConnector,
  useParams,
  watch,
  PortManager,
  delegate,
  type UIProps,
  type UIFunctions,
} from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { AppFooterNav, AppHeaderNav, AppAnnouncement } from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import { Chip, Icon, Textarea, CallButton, Tooltip } from '@ringcentral/spring-ui';
import {
  ActiveCallMd,
  CaretRightMd,
  TransferCallMd,
  DispositionMd,
  HoldMd,
  MuteMd,
  MicrophoneMd,
  MicrophoneOffFilledMd,
  RecordMd,
  StopMd,
  DialpadMd,
  TeamFilledMd,
} from '@ringcentral/spring-icon';

import { CxPresence } from '../../services/CxPresence';
import { CxCall } from '../../services/CxCall';
import { CxCallMonitor } from '../../services/CxCallMonitor';
import { CxCallDisposition } from '../../services/CxCallDisposition';
import { CxIntegratedSoftphone } from '../../services/CxIntegratedSoftphone';
import { CxActiveCallControl } from '../../services/CxActiveCallControl';
import { CxAgentSession } from '../../services/CxAgentSession';
import { CxTransferCall } from '../../services/CxTransferCall';
import { CxRequeueCall } from '../../services/CxRequeueCall';
import { CxAuth } from '../../services/CxAuth';
import { RingCXSideWidgets } from '../../services/RingCXSideWidgets';
import { dialoutStatuses } from '../../enums';
import { cxPath } from '../../routes';
import { isOnLiveCallPage } from '../../utils/isOnLiveCallPage';
import { resolveLiveActivityCallId } from '../../utils/resolveLiveActivityCallId';
import type { DispositionStepOptions } from '../../utils/shouldShowDispositionSubmitStep';
import { shouldShowDispositionSubmitStep } from '../../utils/shouldShowDispositionSubmitStep';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber/formatPhoneNumber';
import { getCallAni } from '../../lib/getCxCallNumbers';
import type { CxCallData } from '../../services/CxCallDataSource/CxCallDataSource.interface';
import type { CxCallDispositionData } from '../../services/CxCallDisposition/CxCallDisposition.interface';

import { CallControlGrid } from '../../components/CallControlGrid';
import type { CallControlAction } from '../../components/CallControlGrid';
import { IvrAlertPanel } from '../../components/IvrAlertPanel';
import { DialpadPanel } from '../../components/DialpadPanel';
import { EndCallDialog } from '../../components/EndCallDialog';
import { SideWidgetToggleButton } from '../../components/SideWidgetToggleButton';
import { useCxCallContactRenderInfo } from '../../hooks/useCxCallContactRenderInfo';
import { getCxCallSelectionKey } from '../../lib/getCxCallSelectionKey';
import type {
  BasicCallInfo,
  CxActiveCallViewProps,
  CxActiveCallViewUIProps,
  CxActiveCallViewUIFunctions,
  EndCallOptionData,
} from './CxActiveCallView.interface';
import i18n, { t as translate } from './i18n';

/**
 * CxActiveCallView options for configuration
 */
export interface CxActiveCallViewOptions {
  hideCallNote?: boolean;
}

/**
 * CxActiveCallView module - Active call control with Spring UI grid layout
 */
@injectable({
  name: 'CxActiveCallView',
})
class CxActiveCallView extends RcViewModule {
  pickUpDirectly = true;

  private _storeReady = false;

  private _keypadInitialized = false;

  constructor(
    private cxPresence: CxPresence,
    private cxCall: CxCall,
    private cxCallMonitor: CxCallMonitor,
    private cxCallDisposition: CxCallDisposition,
    private cxIntegratedSoftphone: CxIntegratedSoftphone,
    private cxActiveCallControl: CxActiveCallControl,
    private cxAgentSession: CxAgentSession,
    private cxTransferCall: CxTransferCall,
    private cxRequeueCall: CxRequeueCall,
    private cxAuth: CxAuth,
    private router: RouterPlugin,
    private toast: Toast,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    @optional('CxActiveCallViewOptions')
    private activeCallViewOptions?: CxActiveCallViewOptions,
    @optional()
    private ringCXSideWidgets?: RingCXSideWidgets,
    @optional('CxDispositionViewOptions')
    private dispositionViewOptions?: DispositionStepOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this._initializeKeypadIfReady();
      });
    }
  }

  /**
   * Shared-port callbacks can run during construction, before this module has
   * a store slice. Keypad actions wait until `onInit`.
   */
  override onInit(): void {
    this._storeReady = true;
    this._initializeKeypadIfReady();
  }

  private _initializeKeypadIfReady(): void {
    if (
      !this._storeReady ||
      this._keypadInitialized ||
      (this.portManager?.shared && !this.portManager.isServer)
    ) {
      return;
    }
    this._keypadInitialized = true;
    this.initialize();
  }

  @storage
  @state
  isKeypadOpen = false;

  @storage
  @state
  keypadValue = '';

  @state
  viewCallId = '';

  @action
  setKeypadOpen(isOpen: boolean) {
    this.isKeypadOpen = isOpen;
  }

  @action
  setKeypadValue(value: string) {
    this.keypadValue = value;
  }

  @action
  _setViewCallId(id: string) {
    this.viewCallId = id;
  }

  @delegate('server')
  async setViewCallId(id: string) {
    this._setViewCallId(id);
  }

  @action
  resetKeypadStatus() {
    this.keypadValue = '';
    this.isKeypadOpen = false;
  }

  @action
  reset() {
    this.isKeypadOpen = false;
    this.keypadValue = '';
  }

  /**
   * Set default recording state on call ringing
   */
  initialize() {
    this.resetKeypadStatus();
    this.cxCallMonitor.onCallRinging(() => {
      const stopWatching = watch(
        this,
        () => this.currentMainCall,
        (currentMainCall: any) => {
          if (currentMainCall) {
            this.cxActiveCallControl.setIsRecording(this.isDefaultRecord);
          }
          stopWatching();
        },
      );
    });
  }

  get callId(): string {
    return this.viewCallId || this.cxCall.activityCallId;
  }

  get currentCall() {
    const id = this.callId;
    if (!id) return null;
    const call = this.cxPresence.callsMapping[id];
    if (!call) return null;
    const monitorCallId = this.cxCallMonitor.getCallId(call.session || {});
    return this.cxCallMonitor.callsMapping[monitorCallId] || call;
  }

  get currentMainCall() {
    const call = this.currentCall;
    if (!call) return null;
    return this.cxActiveCallControl.getMainCall(call.uii);
  }

  get agentRecording() {
    return this.currentMainCall?.agentRecording;
  }

  get isDefaultRecord(): boolean {
    return this.agentRecording?.default === 'ON';
  }

  get isInbound(): boolean {
    return this.cxCall.isInbound;
  }

  get isInComingCall(): boolean {
    return this.cxCall.isInbound && !this.pickUpDirectly;
  }

  @computed((that: CxActiveCallView) => [
    that.callId,
    that.cxCallMonitor.callIds,
    that.cxCallMonitor.otherCallIds,
    that.cxCallMonitor.callsMapping,
  ])
  get callList(): any[] {
    const { callIds, otherCallIds, callsMapping } = this.cxCallMonitor;
    return this.cxCallMonitor.getActiveCallList(
      callIds,
      otherCallIds,
      callsMapping,
      this.callId,
    );
  }

  @computed((that: CxActiveCallView) => [that.callList])
  get isMultipleCalls(): boolean {
    return this.callList.length > 2;
  }

  /**
   * The ways a conference can be ended, in the order they are offered.
   *
   * `callList` is ordered [main call, own leg, ...transfer legs], the same
   * shape CxActiveCallListView renders its rows from.
   */
  @computed((that: CxActiveCallView) => [that.callList])
  get endCallOptions(): EndCallOptionData[] {
    const [mainCall, ownCall, ...transferCalls] = this.callList;
    if (!mainCall?.session || !ownCall?.session) return [];
    const options: EndCallOptionData[] = [
      {
        id: 'everyone',
        type: 'everyone',
        sessionId: mainCall.session.sessionId,
      },
      {
        id: 'justMe',
        type: 'justMe',
        sessionId: ownCall.session.sessionId,
      },
    ];
    transferCalls.forEach((call: any) => {
      const session = call?.session;
      if (!session) return;
      options.push({
        id: `cancelTransfer:${session.sessionId}`,
        type: 'cancelTransfer',
        sessionId: session.sessionId,
        destination: session.transferSessions?.[session.sessionId]?.destination,
      });
    });
    return options;
  }

  @computed((that: CxActiveCallView) => [
    that.isMultipleCalls,
    that.callList,
    that.currentMainCall,
  ])
  get isOnHold(): boolean {
    if (this.isMultipleCalls) {
      return !!this.callList.find(
        (call: any) =>
          !(call.session?.agentId === this.cxAuth.agentId) && !!call.isHold,
      );
    }
    return !!(this.currentMainCall as any)?.isHold || !!this.currentMainCall?.hold;
  }

  get allowTransferCall(): boolean {
    const call = this.currentCall;
    return !!(call?.allowTransfer && !call?.endedCall);
  }

  get allowTransfer(): boolean {
    return this.allowTransferCall || this.cxRequeueCall.allowRequeueCall;
  }

  @computed((that: CxActiveCallView) => [that.currentCall])
  get ivrAlertData(): Array<{ subject: string; body: string }> {
    const call = this.currentCall;
    const result: Array<{ subject: string; body: string }> = [];
    if (call?.baggage) {
      for (let i = 1; i <= 3; i++) {
        const subject = call.baggage[`ivrAlertSubject_${i}`];
        const body = call.baggage[`ivrAlertBody_${i}`];
        if (subject || body) {
          result.push({ subject: subject || '', body: body || '' });
        }
      }
    }
    return result;
  }

  @computed((that: CxActiveCallView) => [
    that.currentCall,
    that.currentMainCall,
    that.agentRecording,
  ])
  get callControlPermissions() {
    return {
      allowTransferCall: this.allowTransferCall,
      allowHoldCall: this.currentMainCall?.allowHold ?? true,
      allowHangupCall: this.currentMainCall?.allowHangup ?? true,
      allowRecordControl: this.agentRecording?.agentRecording ?? false,
      allowPauseRecord: typeof this.agentRecording?.pause === 'number' && this.agentRecording?.pause > 0,
    };
  }

  @computed((that: CxActiveCallView) => [that.currentCall])
  get basicInfo(): BasicCallInfo | null {
    const call = this.currentCall as any;
    if (!call) return null;
    // RingCX reports the customer as `ani` in both directions; `dnis` is the
    // agent's caller ID on an outbound call.
    const phoneNumber = getCallAni(call);
    return {
      phoneNumber: phoneNumber || undefined,
      formattedPhoneNumber: formatPhoneNumber({ phoneNumber: phoneNumber || '' }),
      contactMatches: call.contactMatches || [],
      queueName: call.queue?.name,
    };
  }

  getContactName(call: any): string {
    if (!call) return '';
    const ani = getCallAni(call);
    const contactMatches = call.contactMatches || [];
    if (contactMatches.length > 0) {
      return contactMatches[0].name || ani;
    }
    return ani;
  }

  // Call Control Actions

  @delegate('server')
  async hangUp() {
    if (this.currentCall?.session?.sessionId) {
      await this.cxActiveCallControl.hangUp(this.currentCall.session.sessionId);
    }
  }

  /**
   * End the call for every party by hanging up the main leg, the same call the
   * participant list makes from its "Everyone" row.
   */
  @delegate('server')
  async hangupEveryone(sessionId: string) {
    await this.cxActiveCallControl.hangupSession({ sessionId });
  }

  /**
   * Drop a transfer target. `hangUp` rather than `hangupSession` so the unhold
   * a warm transfer armed takes the customer off hold once the consult leg is
   * gone.
   */
  @delegate('server')
  async hangupTransferLeg(sessionId: string) {
    await this.cxActiveCallControl.hangUp(sessionId);
  }

  async endCall(optionId: string) {
    const option = this.endCallOptions.find(({ id }) => id === optionId);
    if (!option) return;
    if (option.type === 'everyone') {
      await this.hangupEveryone(option.sessionId);
      return;
    }
    if (option.type === 'cancelTransfer') {
      await this.hangupTransferLeg(option.sessionId);
      return;
    }
    await this.hangUp();
  }

  @delegate('server')
  async handleHoldOrUnhold(type: 'hold' | 'unhold') {
    if (this.isMultipleCalls) {
      this.goToActiveCallList();
      return;
    }
    this.cxActiveCallControl[type]();
  }

  hold = () => {
    this.handleHoldOrUnhold('hold');
  };

  unhold = () => {
    this.handleHoldOrUnhold('unhold');
  };

  mute = () => {
    this.cxActiveCallControl.mute();
  };

  unmute = () => {
    this.cxActiveCallControl.unmute();
  };

  // Recording Actions

  onRecord = async () => {
    try {
      await this.cxActiveCallControl.record();
    } catch (error: any) {
      console.error(error?.message);
    }
  };

  onStopRecord = async () => {
    try {
      await this.cxActiveCallControl.stopRecord();
    } catch (error: any) {
      console.error(error?.message);
    }
  };

  onPauseRecord = async () => {
    try {
      await this.cxActiveCallControl.pauseRecord();
      this.toast.success({ message: translate('recordPaused') });
    } catch (error: any) {
      console.error(error?.message);
    }
  };

  onResumeRecord = () => {
    this.cxActiveCallControl.resumeRecord();
    this.toast.success({ message: translate('recordResume') });
  };

  onRestartTimer = async () => {
    try {
      await this.cxActiveCallControl.pauseRecord();
    } catch (error: any) {
      console.error(error?.message);
    }
  };

  // Keypad Actions

  sendDTMF = (digit: string) => {
    this.cxActiveCallControl.onKeypadClick(digit);
  };

  handleKeypadChange = (value: string) => {
    if (value.length > this.keypadValue.length) {
      const newDigit = value.charAt(value.length - 1);
      this.sendDTMF(newDigit);
    }
    this.setKeypadValue(value);
  };

  handleKeypadKeyPress = (digit: string) => {
    this.sendDTMF(digit);
  };

  // Notes Actions

  @delegate('server')
  async onUpdateNotes(value: string) {
    const callId = this.callId;
    const currentData = this.cxCallDisposition.getDisposition(callId) || {
      dispositionId: null,
      notes: '',
      summary: '',
    };
    const updatedData: CxCallDispositionData = {
      dispositionId: currentData.dispositionId,
      notes: value,
      summary: currentData.summary,
    };
    this.cxCallDisposition.setDisposition(callId, updatedData);
  };

  // Navigation Actions

  /**
   * Delegated because the reset and the agent list are CxTransferCall state:
   * resetting from the client port is undone by the next full-state sync, so
   * the transfer panel opened on whatever the previous transfer left behind.
   */
  @delegate('server')
  async prepareTransferPage() {
    this.cxTransferCall.resetTransferStatus();
    await this.cxTransferCall.fetchAgentList();
    this.router.replace(cxPath.transfer(this.callId));
  }

  goToTransferPage = () => {
    this.prepareTransferPage();
  };

  goToActiveCallList = () => {
    this.router.replace(cxPath.participants(this.callId));
  };

  goToDispositionPage = () => {
    this.router.push(cxPath.disposition(this.callId));
  };

  @delegate('server')
  async goBack() {
    this.cxCall.setDialoutStatus(dialoutStatuses.idle);
    this._setViewCallId('');
    const liveCallId: string = this.liveActivityCallId;
    if (liveCallId) {
      this.router.replace(cxPath.home('dialer'));
      this.reset();
      return;
    }
    this.router.goBack();
    this.reset();
  }

  /**
   * A call that is over and has nothing left to disposition. Its control page
   * can only be reached again through history, for example Back from the call
   * log page opened after the disposition that was pushed on top of it.
   */
  isFinishedCall(callId: string): boolean {
    if (!callId || this.cxCallMonitor.callIds.includes(callId)) {
      return false;
    }
    if (this.cxCallDisposition.isDisposed(callId)) {
      return true;
    }
    const call = this.cxPresence.callsMapping[callId];
    return (
      !!call?.endedCall &&
      !shouldShowDispositionSubmitStep(call, this.dispositionViewOptions)
    );
  }

  @delegate('server')
  async leaveFinishedCall(callId: string) {
    if (
      !this.isFinishedCall(callId) ||
      this.router.currentPath !== cxPath.call(callId)
    ) {
      return;
    }
    if (this.viewCallId === callId) {
      this._setViewCallId('');
    }
    this.reset();
    this.router.replace(cxPath.home('dialer'));
  }

  @delegate('server')
  async setCallId(id: string) {
    this.cxCall.setActivityCallId(id);
  }

  goToActiveCall = () => {
    const liveCallId: string = this.liveActivityCallId;
    if (!liveCallId) {
      return;
    }
    if (this.cxCall.activityCallId !== liveCallId) {
      void this.setCallId(liveCallId);
    }
    this.router.push(cxPath.call(liveCallId));
  };

  @computed((that: CxActiveCallView) => [
    that.cxCall.activityCallId,
    that.cxCallMonitor.callIds,
  ])
  get liveActivityCallId(): string {
    return resolveLiveActivityCallId({
      activityCallId: this.cxCall.activityCallId,
      callIds: this.cxCallMonitor.callIds,
    });
  }

  get isOnActiveCallPage(): boolean {
    return isOnLiveCallPage(this.router.currentPath, this.liveActivityCallId);
  }

  /**
   * Build the ordered list of call control action buttons.
   * Add, remove, or reorder entries here to change the grid layout.
   */
  /**
   * Build the ordered list of call control action buttons.
   * All buttons are always present; disabled when the user lacks permission.
   * Add or reorder entries here to change the grid layout.
   */
  buildCallActions({
    t,
    isMuted,
    isOnHold,
    isRecording,
    isDefaultRecord,
    isInComingCall,
    isCallDisposed,
    callControlPermissions,
    isIntegratedSoftphone,
    allowTransfer,
    showRecordButton,
    uiFunctions,
    handleHoldToggle,
    handleMuteToggle,
    handleRecordClick,
  }: {
    t: (key: string) => string;
    isMuted: boolean;
    isOnHold: boolean;
    isRecording: boolean;
    isDefaultRecord: boolean;
    isInComingCall: boolean;
    isCallDisposed: boolean;
    callControlPermissions: CxActiveCallViewUIProps['callControlPermissions'];
    isIntegratedSoftphone: boolean;
    allowTransfer: boolean;
    showRecordButton: boolean;
    uiFunctions: CxActiveCallViewUIFunctions;
    handleHoldToggle: () => void;
    handleMuteToggle: () => void;
    handleRecordClick: () => void;
  }): CallControlAction[] {
    const disableRecord = !callControlPermissions.allowRecordControl;
    const isAutoIndicator = disableRecord && isDefaultRecord;
    const actions: CallControlAction[] = [
      {
        actionType: 'mute',
        symbol: isIntegratedSoftphone && isMuted ? MicrophoneOffFilledMd : MicrophoneMd,
        label: isMuted ? t('unmute') : t('mute'),
        onClick: handleMuteToggle,
        disabled: isInComingCall || !isIntegratedSoftphone,
        color: isMuted ? 'danger' : 'neutral',
      },
      {
        actionType: 'keypad',
        symbol: DialpadMd,
        label: t('keypad'),
        onClick: () => uiFunctions.setKeypadOpen(true),
        disabled: isInComingCall,
      },
      {
        actionType: 'hold',
        symbol: HoldMd,
        label: isOnHold ? t('unhold') : t('hold'),
        onClick: handleHoldToggle,
        disabled: isInComingCall || !callControlPermissions.allowHoldCall,
        color: isOnHold ? 'warning' : 'neutral',
      },
      {
        actionType: 'transfer',
        symbol: TransferCallMd,
        label: t('transfer'),
        onClick: uiFunctions.onTransfer,
        disabled: isInComingCall || !allowTransfer,
      },
      {
        actionType: 'record' as const,
        symbol: isRecording ? StopMd : RecordMd,
        label: isRecording
          ? (callControlPermissions.allowPauseRecord ? t('pauseRecord') : t('stopRecord'))
          : t('record'),
        onClick: isAutoIndicator ? undefined : handleRecordClick,
        disabled: isAutoIndicator ? false : (isInComingCall || disableRecord || !showRecordButton),
        color: (isAutoIndicator || isRecording) ? 'danger' : 'neutral',
        indicator: isAutoIndicator,
        tooltip: isAutoIndicator ? 'Recording' : undefined,
      },
      {
        actionType: 'disposition',
        symbol: DispositionMd,
        label: t('disposition'),
        onClick: uiFunctions.onDisposition,
        disabled: isInComingCall || isCallDisposed,
      },
    ];
    return actions;
  }

  getUIProps(): UIProps<CxActiveCallViewUIProps> {
    const call = this.currentCall;
    const callId = this.callId;
    const dispositionData = this.cxCallDisposition.getDisposition(callId);
    const isCallDisposed = this.cxCallDisposition.isDisposed(callId);
    return {
      activityCallId: this.cxCall.activityCallId,
      currentCall: call,
      isMuted: this.cxIntegratedSoftphone.muteActive,
      isOnHold: this.isOnHold,
      isRecording: this.cxActiveCallControl.isRecording,
      isKeypadOpen: this.isKeypadOpen,
      keypadValue: this.keypadValue,
      ivrAlertData: this.ivrAlertData,
      callControlPermissions: this.callControlPermissions,
      isIntegratedSoftphone: this.cxAgentSession.isIntegratedSoftphone,
      recordPauseCount: this.agentRecording?.pause,
      timeStamp: this.cxActiveCallControl.timeStamp,
      basicInfo: this.basicInfo,
      isMultipleCalls: this.isMultipleCalls,
      participantCount: this.callList.length,
      endCallOptions: this.endCallOptions,
      isInComingCall: this.isInComingCall,
      isCallDisposed,
      allowTransfer: this.allowTransfer,
      isDefaultRecord: this.isDefaultRecord,
      isInbound: this.isInbound,
      notes: dispositionData?.notes || '',
      sideWidgets: (this.ringCXSideWidgets?.availableWidgetNames ?? []).map(
        (name) => ({ name }),
      ),
      sideWidgetVisible: this.ringCXSideWidgets?.visible ?? false,
    };
  }

  getUIFunctions(): UIFunctions<CxActiveCallViewUIFunctions> {
    return {
      setCallId: async (id: string) => await this.setCallId(id),
      setViewCallId: (id: string) => this.setViewCallId(id),
      onBack: () => this.goBack(),
      onMute: () => this.mute(),
      onUnmute: () => this.unmute(),
      onHold: () => this.hold(),
      onUnhold: () => this.unhold(),
      onHangup: () => this.hangUp(),
      onEndCall: (optionId) => this.endCall(optionId),
      onRecord: () => this.onRecord(),
      onStopRecord: () => this.onStopRecord(),
      onPauseRecord: () => this.onPauseRecord(),
      onResumeRecord: () => this.onResumeRecord(),
      onRestartTimer: () => this.onRestartTimer(),
      onActiveCall: () => this.goToActiveCallList(),
      onTransfer: () => this.goToTransferPage(),
      onDisposition: () => this.goToDispositionPage(),
      setKeypadOpen: (isOpen) => this.setKeypadOpen(isOpen),
      handleKeypadChange: (value) => this.handleKeypadChange(value),
      handleKeypadKeyPress: (digit) => this.handleKeypadKeyPress(digit),
      onUpdateNotes: (value) => this.onUpdateNotes(value),
      onToggleSideWidget: async () => {
        await this.ringCXSideWidgets?.toggle();
      },
    };
  }

  /**
   * Announcement banner for active call notification
   */
  @autobind
  Announcement() {
    const { t } = useLocale(i18n);
    const { hasActiveCall, isOnCallPage, contactName, phoneNumber } =
      useConnector(() => {
        const liveCallId: string = this.liveActivityCallId;
        const call = liveCallId
          ? this.cxPresence.callsMapping[liveCallId]
          : null;
        const hasCall: boolean = !!call && !call.endedCall;
        const name = this.getContactName(call);
        const phone = getCallAni(call);
        return {
          hasActiveCall: hasCall,
          isOnCallPage: isOnLiveCallPage(this.router.currentPath, liveCallId),
          contactName: name,
          phoneNumber: formatPhoneNumber({ phoneNumber: phone }),
        };
      });
    if (!hasActiveCall || isOnCallPage) {
      return null;
    }
    const displayName = contactName || phoneNumber || t('unknown');
    return (
      <AppAnnouncement>
        <div
          tabIndex={0}
          role="button"
          data-sign="activeCallAnnouncement"
          className="bg-gradient-mixed bg-base-primary-b-high-contrast bg-cover-neutral-b0/30 text-neutral-50 w-full py-2 pl-2 pr-4 flex items-center h-14"
          onClick={this.goToActiveCall}
        >
          <div className="relative">
            <Icon
              className="size-9 flex items-center justify-center"
              size="medium"
              symbol={ActiveCallMd}
              data-sign="active-call-icon"
            />
          </div>
          <div className="flex flex-col mx-3 flex-auto w-0">
            <span className="typography-subtitle truncate">{displayName}</span>
            <span className="typography-mainText truncate">
              {t('activeCall')}
            </span>
          </div>
          <Icon
            symbol={CaretRightMd}
            size="small"
            data-sign="goToActiveCallButton"
          />
        </div>
      </AppAnnouncement>
    );
  }

  component(_props?: CxActiveCallViewProps) {
    const params = useParams<{ id?: string }>();
    // Merged so the toggle tooltip can name the widgets without a second copy
    // of their labels living here.
    const { t } = useLocale(i18n);
    const { current: uiFunctions } = useRef(this.getUIFunctions());

    const uiProps = useConnector(() => this.getUIProps());

    const {
      activityCallId,
      currentCall,
      isMuted,
      isOnHold,
      isRecording,
      isKeypadOpen,
      keypadValue,
      ivrAlertData,
      callControlPermissions,
      isIntegratedSoftphone,
      recordPauseCount,
      timeStamp,
      basicInfo,
      isMultipleCalls,
      participantCount,
      endCallOptions,
      isInComingCall,
      isCallDisposed,
      allowTransfer,
      isDefaultRecord,
      isInbound,
      notes,
      sideWidgets,
      sideWidgetVisible,
    } = uiProps;

    const {
      renderInfo: contactRenderInfo,
      Avatar: ContactAvatar,
      DisplayName: ContactDisplayName,
    } = useCxCallContactRenderInfo({
      uii: getCxCallSelectionKey(currentCall),
      phoneNumber: basicInfo?.phoneNumber,
      matches: basicInfo?.contactMatches,
      activityMatches: currentCall?.activityMatches,
      live: true,
    });
    // Like the RingEX call control, the number is shown once: in the subject
    // line when nothing matched, otherwise below the contact name.
    const followInfos = [
      contactRenderInfo.type === 'phoneNumber'
        ? undefined
        : basicInfo?.formattedPhoneNumber,
      basicInfo?.queueName,
    ].filter((info): info is string => !!info);

    // Naming what is behind the toggle is the only cue the agent gets that a
    // script or an assistant is waiting, since a narrow frame no longer opens
    // one on its own.
    const sideWidgetToggle = sideWidgets.length ? (
      <SideWidgetToggleButton
        visible={sideWidgetVisible}
        onToggle={() => void uiFunctions.onToggleSideWidget()}
        label={t(sideWidgetVisible ? 'hideSideWidget' : 'showSideWidget', {
          widgets: sideWidgets.map((widget) => widget.name).join(', '),
        })}
      />
    ) : undefined;

    // Decided once per call id: the call ends while the agent is on this page,
    // which must keep rendering until the call policy moves them on.
    const arrivalRef = useRef<{ id?: string; finished: boolean }>();
    if (!arrivalRef.current || arrivalRef.current.id !== params.id) {
      arrivalRef.current = {
        id: params.id,
        finished: !!params.id && this.isFinishedCall(params.id),
      };
    }
    const isFinishedOnArrival = arrivalRef.current.finished;

    useEffect(() => {
      if (params.id && isFinishedOnArrival) {
        void this.leaveFinishedCall(params.id);
        return;
      }
      if (params.id) {
        uiFunctions.setViewCallId(params.id);
        if (params.id !== activityCallId) {
          // An id the call data does not know cannot become the call being
          // worked on, or a stale link would drop the live call.
          const call = this.cxPresence.callsMapping[params.id];
          if (call && !call.endedCall) {
            uiFunctions.setCallId(params.id);
          }
        }
      }
    }, [params.id]);

    useEffect(() => {
      if (activityCallId) {
        this.reset();
      }
    }, [activityCallId]);

    const handleHoldToggle = useCallback(() => {
      if (isOnHold) {
        uiFunctions.onUnhold();
      } else {
        uiFunctions.onHold();
      }
    }, [isOnHold, uiFunctions]);

    const handleMuteToggle = useCallback(() => {
      if (isMuted) {
        uiFunctions.onUnmute();
      } else {
        uiFunctions.onMute();
      }
    }, [isMuted, uiFunctions]);

    const handleRecordClick = useCallback(() => {
      if (!callControlPermissions.allowRecordControl) return;
      if (isRecording) {
        if (callControlPermissions.allowPauseRecord) {
          uiFunctions.onPauseRecord();
        } else {
          uiFunctions.onStopRecord();
        }
      } else {
        uiFunctions.onRecord();
      }
    }, [isRecording, callControlPermissions, uiFunctions]);

    const handleNotesChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        uiFunctions.onUpdateNotes(e.target.value);
      },
      [uiFunctions],
    );

    const showRecordButton = callControlPermissions.allowRecordControl || isDefaultRecord;

    // Which parties to drop is only a question once the warm transfer added a
    // leg, so a plain call still hangs up straight from the button.
    const [isEndCallDialogOpen, setEndCallDialogOpen] = useState(false);

    const endCallDialogOptions = endCallOptions.map(
      ({ id, type, destination }) => ({
        id,
        label: t(type),
        description:
          type === 'cancelTransfer'
            ? formatPhoneNumber({ phoneNumber: destination ?? '' })
            : undefined,
      }),
    );

    const closeEndCallDialog = useCallback(() => {
      setEndCallDialogOpen(false);
    }, []);

    // A leg dropping on its own leaves the dialog offering options that no
    // longer exist.
    useEffect(() => {
      if (!isMultipleCalls) {
        setEndCallDialogOpen(false);
      }
    }, [isMultipleCalls]);

    const handleHangupClick = useCallback(() => {
      if (isMultipleCalls) {
        setEndCallDialogOpen(true);
        return;
      }
      uiFunctions.onHangup();
    }, [isMultipleCalls, uiFunctions]);

    const handleEndCallConfirm = useCallback(
      (optionId: string) => {
        setEndCallDialogOpen(false);
        uiFunctions.onEndCall(optionId);
      },
      [uiFunctions],
    );

    // Countdown timer for paused recording (replaces record button during pause)
    const [countdownSeconds, setCountdownSeconds] = useState(0);
    const isCountdownActive =
      callControlPermissions.allowPauseRecord &&
      recordPauseCount != null &&
      isRecording === false &&
      !!timeStamp &&
      countdownSeconds >= 0;

    useEffect(() => {
      if (
        !timeStamp ||
        isRecording !== false ||
        !callControlPermissions.allowPauseRecord ||
        recordPauseCount == null
      ) {
        setCountdownSeconds(0);
        return;
      }
      let intervalId: ReturnType<typeof setInterval> | undefined;
      const updateTimer = () => {
        const time = Math.ceil(
          recordPauseCount + (timeStamp - Date.now()) / 1000,
        );
        if (time < 0) {
          if (intervalId !== undefined) {
            clearInterval(intervalId);
          }
          setTimeout(() => uiFunctions.onResumeRecord(), 1000);
          return;
        }
        setCountdownSeconds(time);
      };
      updateTimer();
      intervalId = setInterval(updateTimer, 1000);
      return () => {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
        }
      };
    }, [timeStamp, recordPauseCount, isRecording, callControlPermissions.allowPauseRecord, uiFunctions]);

    if (isFinishedOnArrival) {
      return null;
    }

    if (!currentCall) {
      return (
        <div className="flex flex-col h-full bg-neutral-base">
          <AppHeaderNav override resetImmediately>
            <PageHeader
              onBackClick={uiFunctions.onBack}
              endAdornment={sideWidgetToggle}
            >
              {t('activeCall')}
            </PageHeader>
          </AppHeaderNav>
          <div className="flex-1 flex items-center justify-center text-neutral-b2">
            <p className="typography-mainText">{t('noActiveCall')}</p>
          </div>
          <AppFooterNav />
        </div>
      );
    }

    const callActions = this.buildCallActions({
      t,
      isMuted,
      isOnHold,
      isRecording,
      isDefaultRecord,
      isInComingCall,
      isCallDisposed,
      callControlPermissions,
      isIntegratedSoftphone,
      allowTransfer,
      showRecordButton,
      uiFunctions,
      handleHoldToggle,
      handleMuteToggle,
      handleRecordClick,
    });

    // During pause countdown, replace the record button with a countdown indicator
    // matching old code behavior where CountDownButton replaced RecordControlButton
    if (isCountdownActive) {
      const recordIdx = callActions.findIndex((a) => a.actionType === 'record');
      if (recordIdx >= 0) {
        const display = countdownSeconds > 99 ? '99+' : String(Math.max(0, countdownSeconds));
        const CountdownSymbol = () => (
          <span className="typography-subtitleMini text-danger" data-sign="countdownText">
            {display}
          </span>
        );
        callActions[recordIdx] = {
          ...callActions[recordIdx],
          symbol: CountdownSymbol,
          label: t('restartTimer'),
          onClick: () => uiFunctions.onRestartTimer(),
          color: 'danger',
          disabled: false,
        };
      }
    }

    return (
      <div className="flex flex-col h-full bg-neutral-base overflow-hidden">
        <AppHeaderNav override resetImmediately>
          <PageHeader
            onBackClick={uiFunctions.onBack}
            endAdornment={sideWidgetToggle}
          >
            {t('activeCall')}
          </PageHeader>
        </AppHeaderNav>

        {ivrAlertData.length > 0 && (
          <IvrAlertPanel
            ivrAlertData={ivrAlertData}
            isCallEnd={false}
          />
        )}

        <div
          data-sign="callInformation"
          className="w-full py-2 pl-2 pr-4 flex items-center"
        >
          <ContactAvatar size="large" />
          <div className="flex-auto ml-2 min-w-0">
            <h3
              className="typography-title text-neutral-b0 truncate w-full flex flex-col"
              data-sign="contactName"
            >
              <ContactDisplayName
                displayControl={{
                  maybe: true,
                  viewable: true,
                  matchCounts: true,
                }}
              />
            </h3>
            {/* A conference has no single number to name below the subject. */}
            {isMultipleCalls ? (
              <p
                className="typography-descriptorMini text-neutral-b2 truncate"
                data-sign="conferenceLabel"
              >
                {t('conferenceCall')}
              </p>
            ) : (
              followInfos.map((info, idx) => (
                <p
                  key={idx}
                  className="typography-descriptorMini text-neutral-b2 truncate"
                  data-sign="followInfo"
                >
                  {info}
                </p>
              ))
            )}
            {isMultipleCalls && (
              <Tooltip title={t('viewParticipants')}>
                <Chip
                  className="mt-1"
                  size="medium"
                  clickable
                  startSlot={<Icon symbol={TeamFilledMd} size="small" />}
                  label={t('participants', { count: participantCount })}
                  onClick={uiFunctions.onActiveCall}
                  data-sign="participantsBadge"
                />
              </Tooltip>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 flex flex-col overflow-auto">
            {!this.activeCallViewOptions?.hideCallNote && (
              <div className="px-4 pt-3 min-w-0">
                <Textarea
                  placeholder={t('enterCallNotes')}
                  value={notes}
                  onChange={handleNotesChange}
                  data-sign="quickNotesInput"
                  rows={2}
                  maxLength={32000}
                  fullWidth
                />
              </div>
            )}
            <div className="flex-1" />
            <div className="px-6 py-4">
              <CallControlGrid actions={callActions} />
            </div>
          </div>

          <DialpadPanel
            isOpen={isKeypadOpen}
            value={keypadValue}
            onToggle={uiFunctions.setKeypadOpen}
            onChange={uiFunctions.handleKeypadChange}
            onKeyPress={uiFunctions.handleKeypadKeyPress}
          />
        </div>

        <div className="flex-shrink-0">
          <div className="flex justify-center py-4">
            <CallButton
              variant="end"
              onClick={handleHangupClick}
              disabled={isInComingCall}
              size="medium"
              data-sign="hangupButton"
              TooltipProps={{ title: t('hangUp') }}
            />
          </div>
        </div>

        <EndCallDialog
          open={isEndCallDialogOpen}
          options={endCallDialogOptions}
          onClose={closeEndCallDialog}
          onConfirm={handleEndCallConfirm}
        />
        <AppFooterNav />
      </div>
    );
  }
}

export { CxActiveCallView };
