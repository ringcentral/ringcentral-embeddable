import type { PropsWithChildren } from 'react';
import React, { Component } from 'react';

import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import calleeTypes from '@ringcentral-integration/commons/enums/calleeTypes';
import { sleep } from '@ringcentral-integration/commons/utils';
import sessionStatus from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';

import { callCtrlLayouts } from '@ringcentral-integration/widgets/enums/callCtrlLayouts';
import i18n from '@ringcentral-integration/widgets/components/CallCtrlContainer/i18n';

import CallCtrlPanel from '../../components/CallCtrlPanel';

export type CallCtrlContainerProps = PropsWithChildren<{
  session: {
    id?: string;
    direction?: string;
    startTime?: number;
    isOnMute?: boolean;
    isOnHold?: boolean;
    isOnFlip?: boolean;
    recordStatus?: string;
    to?: string;
    from?: string;
    contactMatch?: object;
    warmTransferSessionId?: string;
    callStatus?: string;
    isOnTransfer?: boolean;
    callQueueName?: string;
    fromUserName?: string;
    toUserName?: string;
  };
  currentLocale: string;
  onMute: (...args: any[]) => any;
  onUnmute: (...args: any[]) => any;
  onHold: (...args: any[]) => any;
  onUnhold: (...args: any[]) => any;
  onRecord: (...args: any[]) => any;
  onStopRecord: (...args: any[]) => any;
  onHangup: (...args: any[]) => any;
  sendDTMF: (...args: any[]) => any;
  formatPhone: (...args: any[]) => any;
  onAdd?: (...args: any[]) => any;
  onMerge?: (...args: any[]) => any;
  onBeforeMerge?: (...args: any[]) => any;
  onFlip: (...args: any[]) => any;
  onPark: (...args: any[]) => any;
  onTransfer: (...args: any[]) => any;
  nameMatches: any[];
  areaCode: string;
  countryCode: string;
  getAvatarUrl: (...args: any[]) => any;
  updateSessionMatchedContact: (...args: any[]) => any;
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBackButtonClick?: (...args: any[]) => any;
  brand: string;
  showContactDisplayPlaceholder: boolean;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  showSpinner?: boolean;
  conferenceCallParties?: any[];
  conferenceCallEquipped?: boolean;
  hasConferenceCall?: boolean;
  lastCallInfo?: object;
  gotoParticipantsCtrl?: (...args: any[]) => any;
  getInitialLayout?: (...args: any[]) => any;
  closeMergingPair?: (...args: any[]) => any;
  afterHideMergeConfirm?: (...args: any[]) => any;
  afterConfirmMerge?: (...args: any[]) => any;
  afterOnMerge?: (...args: any[]) => any;
  disableFlip?: boolean;
  showCallQueueName?: boolean;
  onCompleteTransfer?: (...args: any[]) => any;
  phoneNumber?: string;
  showPark?: boolean;
  controlBusy?: boolean;
}>;
type CallCtrlContainerState = {
  layout: any;
  mergeDisabled: any;
  addDisabled: any;
  selectedMatcherIndex: number;
  avatarUrl: null | any;
};
export class CallCtrlContainer extends Component<
  CallCtrlContainerProps,
  CallCtrlContainerState
> {
  _mounted: any;
  gotoParticipantsCtrl: any;
  onAdd: any;
  onBeforeMerge: any;
  onCompleteTransfer: any;
  onHangup: any;
  onHold: any;
  onKeyPadChange: any;
  onMerge: any;
  onMute: any;
  onPark: any;
  onRecord: any;
  onSelectMatcherName: any;
  onStopRecord: any;
  onUnhold: any;
  onUnmute: any;
  constructor(props: any) {
    super(props);
    const layout = props.getInitialLayout(this.props);
    const { mergeDisabled, addDisabled } = this.disableMergeAndAdd(
      this.props,
      layout,
    );
    this.state = {
      selectedMatcherIndex: 0,
      avatarUrl: null,
      layout,
      mergeDisabled,
      addDisabled,
    };
    this.onLastMergingCallEnded = this.onLastMergingCallEnded.bind(this);
    this.onSelectMatcherName = (option: any) => {
      const nameMatches = this.props.nameMatches || [];
      let selectedMatcherIndex = nameMatches.findIndex(
        (match) => match.id === option.id,
      );
      if (selectedMatcherIndex < 0) {
        selectedMatcherIndex = 0;
      }
      this.setState({
        selectedMatcherIndex,
        avatarUrl: null,
      });
      const contact = nameMatches[selectedMatcherIndex];
      if (contact) {
        this.props.updateSessionMatchedContact(this.props.session.id, contact);
        this.props.getAvatarUrl(contact).then((avatarUrl: any) => {
          this.setState({ avatarUrl });
        });
      }
    };
    this.onMute = () => this.props.onMute(this.props.session.id);
    this.onUnmute = () => this.props.onUnmute(this.props.session.id);
    this.onHold = () => this.props.onHold(this.props.session.id);
    this.onUnhold = () => this.props.onUnhold(this.props.session.id);
    this.onRecord = () => this.props.onRecord(this.props.session.id);
    this.onStopRecord = () => this.props.onStopRecord(this.props.session.id);
    this.onHangup = () =>
      this.props.onHangup(this.props.session.id, this.state.layout);
    this.onKeyPadChange = (value: any) =>
      this.props.sendDTMF(value, this.props.session.id);
    this.onPark = () => this.props.onPark(this.props.session.id);
    // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
    this.onAdd = () => this.props.onAdd(this.props.session.id);
    // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
    this.onMerge = () => this.props.onMerge(this.props.session.id);
    // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
    this.onBeforeMerge = () => this.props.onBeforeMerge(this.props.session.id);
    this.gotoParticipantsCtrl = () =>
      // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      this.props.gotoParticipantsCtrl(this.props.session.id);
    this.onCompleteTransfer = () =>
      // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      this.props.onCompleteTransfer(this.props.session.id);
  }
  static isLastCallEnded({ lastCallInfo }: any) {
    return !!(lastCallInfo && lastCallInfo.status === sessionStatus.finished);
  }

  componentDidMount() {
    this._mounted = true;
    this._updateAvatarAndMatchIndex(this.props);
    this._updateCurrentConferenceCall(this.props);
    this._updateMergingPairToSessionId();
    if (CallCtrlContainer.isLastCallEnded(this.props)) {
      /**
       * if the last has already been terminated after rendering, need to trigger the callback at the point
       */
      this.onLastMergingCallEnded();
    }
  }

  disableMergeAndAdd(nextProps: any, layout: any) {
    const {
      lastCallInfo,
      isWebRTC,
      disableLinks,
      isConferenceCallOverload,
      session,
      hasConferenceCall,
    } = nextProps;
    // const isInboundCall = session.direction === callDirections.inbound;
    // const isMergeAndAddDisabled = !isWebRTC || isInboundCall || !session.partyData;
    const isMergeAndAddDisabled =
      !isWebRTC || !session.partyData || disableLinks;
    let mergeDisabled = isMergeAndAddDisabled;
    let addDisabled = isMergeAndAddDisabled;
    if (
      layout === callCtrlLayouts.mergeCtrl &&
      (!lastCallInfo || lastCallInfo.status === sessionStatus.finished)
    ) {
      mergeDisabled = true;
    }
    if (hasConferenceCall && isWebRTC && isConferenceCallOverload) {
      mergeDisabled = true;
      addDisabled = true;
    }
    return { mergeDisabled, addDisabled };
  }
  async onLastMergingCallEnded() {
    if (this._mounted) {
      await sleep(2000);
      if (this._mounted) {
        this.setState({
          layout: callCtrlLayouts.normalCtrl,
        });
      }
      if (this.props.closeMergingPair) {
        this.props.closeMergingPair();
      }
    }
  }
  getLayout(lastProps: any, nextProps: any) {
    if (nextProps.showSpinner) {
      return callCtrlLayouts.conferenceCtrl;
    }
    // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
    return this.props.getInitialLayout(nextProps);
  }

  // TODO: override to fix page no re-render after warm transfer host call ended
  UNSAFE_componentWillReceiveProps(nextProps, nextState) {
    this._updateMergingPairToSessionId(nextProps, nextState);

    let layout = this.state.layout;
    if (
      nextProps.session.id !== this.props.session.id ||
      nextProps.session.warmTransferSessionId !== this.props.session.warmTransferSessionId
    ) {
      layout = this.getLayout(this.props, nextProps);
      this.setState({
        layout,
      });

      if (layout === callCtrlLayouts.normalCtrl) {
        this._updateAvatarAndMatchIndex(nextProps);
      }
    } else if (
      layout === callCtrlLayouts.mergeCtrl &&
      CallCtrlContainer.isLastCallEnded(this.props) === false &&
      CallCtrlContainer.isLastCallEnded(nextProps) === true
    ) {
      this.onLastMergingCallEnded();
    } else if (
      layout === callCtrlLayouts.conferenceCtrl &&
      this.props.conferenceCallParties !== nextProps.conferenceCallParties
    ) {
      this._updateCurrentConferenceCall(nextProps);
    }
    this._updateMergeAddButtonDisabled(nextProps, layout);
  }

  _updateMergeAddButtonDisabled(nextProps: any, layout: any) {
    const { mergeDisabled, addDisabled } = this.disableMergeAndAdd(
      nextProps,
      layout,
    );
    this.setState({
      mergeDisabled,
      addDisabled,
    });
  }

  componentWillUnmount() {
    this._mounted = false;
  }
  _updateAvatarAndMatchIndex(props: any) {
    let contact = props.session.contactMatch;
    let selectedMatcherIndex = 0;
    if (!contact) {
      contact = props.nameMatches && props.nameMatches[0];
    } else {
      selectedMatcherIndex = props.nameMatches.findIndex(
        (match: any) => match.id === contact.id,
      );
    }
    this.setState({
      selectedMatcherIndex,
      avatarUrl: null,
    });
    if (contact) {
      props.getAvatarUrl(contact).then((avatarUrl: any) => {
        if (!this._mounted) {
          return;
        }
        this.setState({ avatarUrl });
      });
    }
  }
  _updateCurrentConferenceCall(props: any) {
    if (
      this.state.layout === callCtrlLayouts.conferenceCtrl &&
      props.loadConference
    ) {
      props.loadConference(props.conferenceCallId);
    }
  }
  _updateMergingPairToSessionId(
    nextProps = this.props,
    nextState = this.state,
  ) {
    if (
      nextState.layout === callCtrlLayouts.mergeCtrl &&
      nextProps.lastCallInfo
    ) {
      // @ts-expect-error TS(2339): Property 'setMergeParty' does not exist on type 'R... Remove this comment to see the full error message
      nextProps.setMergeParty({ toSessionId: nextProps.session.id });
    }
  }

  render() {
    const { session, showCallQueueName } = this.props;
    if (!session.id) {
      return null;
    }
    let fallbackUserName;
    if (
      session.direction === callDirections.inbound &&
      session.from === 'anonymous'
    ) {
      fallbackUserName = i18n.getString('anonymous', this.props.currentLocale);
    }
    if (!fallbackUserName) {
      fallbackUserName = session.direction === callDirections.inbound ? session.fromUserName : session.toUserName;
    }
    if (!fallbackUserName) {
      fallbackUserName = i18n.getString('unknown', this.props.currentLocale);
    }
    const backButtonLabel = this.props.backButtonLabel
      ? this.props.backButtonLabel
      : i18n.getString('activeCalls', this.props.currentLocale);
    return (
      <CallCtrlPanel
        currentLocale={this.props.currentLocale}
        formatPhone={this.props.formatPhone}
        phoneNumber={this.props.phoneNumber}
        sessionId={session.id}
        callStatus={session.callStatus}
        startTime={session.startTime}
        isOnMute={session.isOnMute}
        isOnHold={session.isOnHold}
        isOnTransfer={session.isOnTransfer}
        isOnWaitingTransfer={!!session.warmTransferSessionId}
        recordStatus={session.recordStatus}
        showBackButton={this.props.showBackButton}
        backButtonLabel={backButtonLabel}
        onBackButtonClick={this.props.onBackButtonClick}
        onMute={this.onMute}
        onUnmute={this.onUnmute}
        onHold={this.onHold}
        onUnhold={this.onUnhold}
        onRecord={this.onRecord}
        onStopRecord={this.onStopRecord}
        onKeyPadChange={this.onKeyPadChange}
        onHangup={this.onHangup}
        onAdd={this.onAdd}
        onMerge={this.onMerge}
        onBeforeMerge={this.onBeforeMerge}
        onFlip={this.props.onFlip}
        onTransfer={this.props.onTransfer}
        onCompleteTransfer={this.onCompleteTransfer}
        onPark={this.onPark}
        disableFlip={this.props.disableFlip}
        showPark={this.props.showPark}
        nameMatches={this.props.nameMatches}
        fallBackName={fallbackUserName}
        showCallQueueName={showCallQueueName}
        callQueueName={showCallQueueName ? session.callQueueName : null}
        areaCode={this.props.areaCode}
        countryCode={this.props.countryCode}
        selectedMatcherIndex={this.state.selectedMatcherIndex}
        onSelectMatcherName={this.onSelectMatcherName}
        avatarUrl={this.state.avatarUrl}
        brand={this.props.brand}
        showContactDisplayPlaceholder={this.props.showContactDisplayPlaceholder}
        sourceIcons={this.props.sourceIcons}
        phoneTypeRenderer={this.props.phoneTypeRenderer}
        phoneSourceNameRenderer={this.props.phoneSourceNameRenderer}
        layout={this.state.layout}
        showSpinner={this.props.showSpinner}
        direction={session.direction}
        addDisabled={this.state.addDisabled}
        mergeDisabled={this.state.mergeDisabled}
        conferenceCallEquipped={this.props.conferenceCallEquipped}
        hasConferenceCall={this.props.hasConferenceCall}
        conferenceCallParties={this.props.conferenceCallParties}
        lastCallInfo={this.props.lastCallInfo}
        getAvatarUrl={this.props.getAvatarUrl}
        gotoParticipantsCtrl={this.gotoParticipantsCtrl}
        afterHideMergeConfirm={this.props.afterHideMergeConfirm}
        afterConfirmMerge={this.props.afterConfirmMerge}
        afterOnMerge={this.props.afterOnMerge}
        controlBusy={this.props.controlBusy}
      >
        {this.props.children}
      </CallCtrlPanel>
    );
  }
}
// @ts-expect-error TS(2339): Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
CallCtrlContainer.defaultProps = {
  children: undefined,
  showBackButton: false,
  backButtonLabel: null,
  onBackButtonClick: null,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  onAdd: undefined,
  onMerge: undefined,
  onBeforeMerge: undefined,
  showSpinner: false,
  conferenceCallEquipped: false,
  hasConferenceCall: false,
  conferenceCallParties: undefined,
  lastCallInfo: { calleeType: calleeTypes.unknown },
  gotoParticipantsCtrl: (i: any) => i,
  getInitialLayout: () => callCtrlLayouts.normalCtrl,
  closeMergingPair: null,
  afterHideMergeConfirm: () => null,
  afterConfirmMerge: () => null,
  afterOnMerge: () => null,
  disableFlip: false,
  showCallQueueName: false,
  onCompleteTransfer: () => null,
  phoneNumber: null,
  showPark: false,
  controlBusy: false,
};