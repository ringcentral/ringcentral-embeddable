import React, { Component, memo } from 'react';

import callCtrlLayouts from '@ringcentral-integration/widgets/enums/callCtrlLayouts';
import ActiveCallDialPad from '@ringcentral-integration/widgets/components/ActiveCallDialPad';
import ConfirmMergeModal from '@ringcentral-integration/widgets/components/ConfirmMergeModal';
import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';

import ActiveCallPanel from './ActiveCallPanel';

type CallCtrlPanelProps = {
  callStatus?: string;
  sessionId?: string;
  phoneNumber?: string;
  nameMatches: any[];
  fallBackName: string;
  currentLocale: string;
  startTime?: number;
  isOnMute?: boolean;
  isOnHold?: boolean;
  recordStatus?: string;
  onMute: (...args: any[]) => any;
  onUnmute: (...args: any[]) => any;
  onHold: (...args: any[]) => any;
  onUnhold: (...args: any[]) => any;
  onRecord?: (...args: any[]) => any;
  onStopRecord?: (...args: any[]) => any;
  onAdd?: (...args: any[]) => any;
  onMerge?: (...args: any[]) => any;
  onBeforeMerge?: (...args: any[]) => any;
  onPark?: (...args: any[]) => any;
  onHangup: (...args: any[]) => any;
  onFlip?: (...args: any[]) => any;
  onTransfer: (...args: any[]) => any;
  disableFlip?: boolean;
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBackButtonClick?: (...args: any[]) => any;
  onKeyPadChange?: (...args: any[]) => any;
  formatPhone: (...args: any[]) => any;
  areaCode: string;
  countryCode: string;
  selectedMatcherIndex: number;
  onSelectMatcherName?: (...args: any[]) => any;
  avatarUrl?: string;
  brand?: string;
  showContactDisplayPlaceholder?: boolean;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  layout: string;
  showSpinner?: boolean;
  direction?: string;
  addDisabled?: boolean;
  mergeDisabled?: boolean;
  conferenceCallEquipped?: boolean;
  hasConferenceCall?: boolean;
  lastCallInfo?: object;
  conferenceCallParties?: any[];
  getAvatarUrl?: (...args: any[]) => any;
  gotoParticipantsCtrl?: (...args: any[]) => any;
  afterHideMergeConfirm?: (...args: any[]) => any;
  afterConfirmMerge?: (...args: any[]) => any;
  afterOnMerge?: (...args: any[]) => any;
  actions?: any[];
  controlBusy?: boolean;
  callQueueName?: string;
  showPark?: boolean;
  onCompleteTransfer?: (...args: any[]) => any;
  isOnWaitingTransfer?: boolean;
  isOnTransfer?: boolean;
};
type CallCtrlPanelState = {
  isShowKeyPad: boolean;
  isShowMergeConfirm: boolean;
};
class CallCtrlPanel extends Component<CallCtrlPanelProps, CallCtrlPanelState> {
  confirmMerge: any;
  hiddenKeyPad: any;
  hideMergeConfirm: any;
  hideMergeConfirmAlt: any;
  onFlip: any;
  onMerge: any;
  onTransfer: any;
  showKeyPad: any;
  showMergeConfirm: any;
  constructor(props: any) {
    super(props);
    this.state = {
      isShowKeyPad: false,
      isShowMergeConfirm: false,
    };
    this.hiddenKeyPad = () => {
      this.setState({
        isShowKeyPad: false,
      });
    };
    this.showKeyPad = () => {
      this.setState({
        isShowKeyPad: true,
      });
    };
    this.onFlip = () => {
      // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      this.props.onFlip(this.props.sessionId);
    };
    this.onTransfer = () => {
      this.props.onTransfer(this.props.sessionId);
    };
    this.onMerge = () => {
      const { onBeforeMerge } = this.props;
      if (!onBeforeMerge || onBeforeMerge()) {
        if (
          this.props.hasConferenceCall &&
          this.props.layout === callCtrlLayouts.normalCtrl
        ) {
          this.showMergeConfirm();
        } else if (this.props.onMerge) {
          this.props.onMerge();
        }
      }
      // track user click merge
      // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      this.props.afterOnMerge();
    };
    this.showMergeConfirm = () => {
      this.setState({
        isShowMergeConfirm: true,
      });
    };
    this.hideMergeConfirm = () => {
      this.setState({
        isShowMergeConfirm: false,
      });
    };
    this.hideMergeConfirmAlt = () => {
      this.hideMergeConfirm();
      // user action track
      // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      this.props.afterHideMergeConfirm();
    };
    this.confirmMerge = () => {
      this.setState({
        isShowMergeConfirm: false,
      });
      if (this.props.onMerge) {
        this.props.onMerge();
      }
      // user action track
      // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      this.props.afterConfirmMerge();
    };
  }
  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  UNSAFE_componentWillReceiveProps(nextProps: any) {
    if (!nextProps.hasConferenceCall && this.state.isShowMergeConfirm) {
      this.hideMergeConfirm();
    }
    if (this.props.sessionId !== nextProps.sessionId) {
      this.hiddenKeyPad();
      this.hideMergeConfirm();
    }
  }
  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  render() {
    const {
      onKeyPadChange,
      actions,
      addDisabled,
      areaCode,
      avatarUrl,
      backButtonLabel,
      brand,
      callStatus,
      children,
      conferenceCallEquipped,
      conferenceCallParties,
      controlBusy,
      countryCode,
      currentLocale,
      direction,
      fallBackName,
      formatPhone,
      getAvatarUrl,
      gotoParticipantsCtrl,
      hasConferenceCall,
      isOnHold,
      isOnMute,
      lastCallInfo,
      layout,
      mergeDisabled,
      nameMatches,
      onAdd,
      onBackButtonClick,
      onHangup,
      onHold,
      onMute,
      onPark,
      onRecord,
      onSelectMatcherName,
      onStopRecord,
      onUnhold,
      onUnmute,
      phoneNumber,
      phoneSourceNameRenderer,
      phoneTypeRenderer,
      recordStatus,
      selectedMatcherIndex,
      sessionId,
      showBackButton,
      showContactDisplayPlaceholder,
      showSpinner,
      sourceIcons,
      startTime,
      disableFlip,
      callQueueName,
      showPark,
      isOnWaitingTransfer,
      onCompleteTransfer,
      isOnTransfer,
    } = this.props;
    const { isShowKeyPad, isShowMergeConfirm } = this.state;
    return (
      <ActiveCallPanel
        showBackButton={showBackButton}
        showKeyPad={isShowKeyPad}
        backButtonLabel={backButtonLabel}
        onBackButtonClick={onBackButtonClick}
        currentLocale={currentLocale}
        formatPhone={formatPhone}
        phoneNumber={phoneNumber}
        sessionId={sessionId}
        callStatus={callStatus}
        startTime={startTime}
        isOnMute={isOnMute}
        isOnHold={isOnHold}
        isOnTransfer={isOnTransfer}
        isOnWaitingTransfer={isOnWaitingTransfer}
        // @ts-expect-error TS(2322): Type 'string | undefined' is not assignable to typ... Remove this comment to see the full error message
        recordStatus={recordStatus}
        onMute={onMute}
        onUnmute={onUnmute}
        onHold={onHold}
        onUnhold={onUnhold}
        // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
        onRecord={onRecord}
        // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
        onStopRecord={onStopRecord}
        onShowKeyPad={this.showKeyPad}
        onHideKeyPad={this.hiddenKeyPad}
        onKeyPadChange={onKeyPadChange}
        onHangup={onHangup}
        onPark={onPark}
        onAdd={onAdd}
        onMerge={this.onMerge}
        onCompleteTransfer={onCompleteTransfer}
        nameMatches={nameMatches}
        fallBackName={fallBackName}
        areaCode={areaCode}
        countryCode={countryCode}
        selectedMatcherIndex={selectedMatcherIndex}
        // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
        onSelectMatcherName={onSelectMatcherName}
        avatarUrl={avatarUrl}
        brand={brand}
        showContactDisplayPlaceholder={showContactDisplayPlaceholder}
        onFlip={this.onFlip}
        disableFlip={disableFlip}
        showPark={showPark}
        onTransfer={this.onTransfer}
        gotoParticipantsCtrl={gotoParticipantsCtrl}
        sourceIcons={sourceIcons}
        phoneTypeRenderer={phoneTypeRenderer}
        phoneSourceNameRenderer={phoneSourceNameRenderer}
        layout={layout}
        direction={direction}
        addDisabled={addDisabled}
        mergeDisabled={mergeDisabled}
        conferenceCallEquipped={conferenceCallEquipped}
        hasConferenceCall={hasConferenceCall}
        conferenceCallParties={conferenceCallParties}
        lastCallInfo={lastCallInfo}
        getAvatarUrl={getAvatarUrl}
        actions={actions}
        controlBusy={controlBusy}
        callQueueName={callQueueName}
      >
        {children}
        {showSpinner ? <SpinnerOverlay /> : null}
        {layout === callCtrlLayouts.normalCtrl ? (
          <ConfirmMergeModal
            currentLocale={currentLocale}
            show={isShowMergeConfirm}
            onMerge={this.confirmMerge}
            onCancel={this.hideMergeConfirmAlt}
            partyProfiles={conferenceCallParties}
          />
        ) : null}
      </ActiveCallPanel>
    );
  }
}
// @ts-expect-error TS(2339): Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
CallCtrlPanel.defaultProps = {
  startTime: null,
  isOnMute: false,
  isOnHold: false,
  phoneNumber: null,
  children: undefined,
  avatarUrl: null,
  showBackButton: false,
  backButtonLabel: 'Active Calls',
  onBackButtonClick: null,
  sessionId: undefined,
  callStatus: null,
  brand: 'RingCentral',
  showContactDisplayPlaceholder: true,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  onAdd: undefined,
  onMerge: undefined,
  onBeforeMerge: undefined,
  showSpinner: false,
  direction: null,
  addDisabled: false,
  mergeDisabled: false,
  conferenceCallEquipped: false,
  hasConferenceCall: false,
  conferenceCallParties: undefined,
  lastCallInfo: undefined,
  getAvatarUrl: () => null,
  gotoParticipantsCtrl: (i: any) => i,
  afterHideMergeConfirm: () => null,
  afterConfirmMerge: () => null,
  afterOnMerge: () => null,
  onFlip: () => null,
  onRecord: () => null,
  onStopRecord: () => null,
  onPark: () => null,
  onKeyPadChange: () => null,
  onSelectMatcherName: () => null,
  onCompleteTransfer: () => null,
  actions: [],
  recordStatus: '',
  controlBusy: false,
  disableFlip: false,
  callQueueName: null,
  showPark: false,
  isOnWaitingTransfer: false,
  isOnTransfer: false,
};
export default memo(CallCtrlPanel);