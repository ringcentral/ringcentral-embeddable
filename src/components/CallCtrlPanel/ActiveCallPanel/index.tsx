import React from 'react';

import { styled, palette2, RcText } from '@ringcentral/juno';
import callCtrlLayouts from '@ringcentral-integration/widgets/enums/callCtrlLayouts';

import DurationCounter from '@ringcentral-integration/widgets/components/DurationCounter';
import i18n from '@ringcentral-integration/widgets/components/CallCtrlContainer/i18n';
import { VOICEMAIL_DROP_STATUS_MAP } from '../../../modules/WebphoneV2/voicemailDropStatus';

import { BackHeaderView } from '../../BackHeaderView';
import CallInfo from './CallInfo';
import ConferenceInfo from './ConferenceInfo';
import MergeInfo from './MergeInfo';
import ActiveCallPad from '../ActiveCallPad';
import ActiveKeyPad from '../ActiveKeyPad';
import { EndButtonGroup } from '../EndButtonGroup';

const StyledPanel = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  padding-bottom: 14px;
  padding-top: 16px;
  background-color: ${palette2('neutral', 'b01')};
  justify-content: space-around;
`;

const StyledTimeCounter = styled(RcText)`
  position: absolute;
  top: 10px;
  right: 16px;
  padding: 0;
  text-align: right;
`;

type ActiveCallPanelProps = {
  phoneNumber?: string;
  nameMatches: { name: string }[];
  fallBackName: string;
  currentLocale: string;
  startTime?: number;
  startTimeOffset?: number;
  isOnMute?: boolean;
  isOnHold?: boolean;
  recordStatus: string;
  onMute: (...args: any[]) => any;
  onUnmute: (...args: any[]) => any;
  onHold: (...args: any[]) => any;
  onUnhold: (...args: any[]) => any;
  onRecord: (...args: any[]) => any;
  onStopRecord: (...args: any[]) => any;
  onAdd?: (...args: any[]) => any;
  onMerge?: (...args: any[]) => any;
  onHangup: (...args: any[]) => any;
  showBackButton?: boolean;
  backButtonLabel?: string;
  onBackButtonClick?: (...args: any[]) => any;
  onShowKeyPad: (...args: any[]) => any;
  formatPhone: (...args: any[]) => any;
  areaCode: string;
  countryCode: string;
  selectedMatcherIndex: number;
  onSelectMatcherName: (...args: any[]) => any;
  avatarUrl?: string;
  brand?: string;
  showContactDisplayPlaceholder?: boolean;
  onFlip?: (...args: any[]) => any;
  disableFlip?: boolean;
  onPark?: (...args: any[]) => any;
  showPark?: boolean;
  gotoParticipantsCtrl?: (...args: any[]) => any;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  layout: string;
  direction?: string;
  addDisabled?: boolean;
  mergeDisabled?: boolean;
  conferenceCallParties?: any[];
  conferenceCallEquipped?: boolean;
  hasConferenceCall?: boolean;
  lastCallInfo?: object;
  getAvatarUrl?: (...args: any[]) => any;
  actions?: any[];
  controlBusy?: boolean;
  callQueueName?: string;
  isOnWaitingTransfer?: boolean;
  onCompleteTransfer?: (...args: any[]) => any;
  isOnTransfer?: boolean;
  showKeyPad: boolean;
  onKeyPadChange: (...args: any[]) => any;
  onHideKeyPad: (...args: any[]) => any;
  children?: any;
  sessionId?: string;
  callStatus?: string;
  onTransfer: (...args: any[]) => any;
  onVoicemailDrop: (...args: any[]) => any;
  showVoicemailDrop?: boolean;
  voicemailDropStatus?: string;
};

function DurationCounterArea({
  voicemailDropStatus,
  startTime,
  startTimeOffset,
}) {
  if (voicemailDropStatus) {
    return <span>{VOICEMAIL_DROP_STATUS_MAP[voicemailDropStatus]}</span>
  }
  if (!startTime) {
    return <span aria-hidden="true">&nbsp;</span>;
  }
  return <DurationCounter startTime={startTime} offset={startTimeOffset} />;
}

const ActiveCallPanel: React.SFC<ActiveCallPanelProps> = ({
  showBackButton,
  backButtonLabel,
  onBackButtonClick,
  currentLocale,
  nameMatches,
  fallBackName,
  phoneNumber,
  formatPhone,
  startTime,
  startTimeOffset,
  areaCode,
  countryCode,
  selectedMatcherIndex,
  onSelectMatcherName,
  avatarUrl,
  isOnMute,
  isOnHold,
  recordStatus,
  onMute,
  onUnmute,
  onHold,
  onUnhold,
  onRecord,
  onStopRecord,
  onShowKeyPad,
  onHideKeyPad,
  showKeyPad,
  onKeyPadChange,
  onHangup,
  onPark,
  onAdd,
  onMerge,
  onFlip,
  onTransfer,
  gotoParticipantsCtrl,
  children,
  showContactDisplayPlaceholder,
  brand,
  disableFlip,
  showPark,
  sourceIcons,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  layout,
  direction,
  addDisabled,
  mergeDisabled,
  conferenceCallEquipped,
  hasConferenceCall,
  conferenceCallParties,
  lastCallInfo,
  getAvatarUrl,
  actions,
  controlBusy,
  callQueueName,
  isOnTransfer,
  isOnWaitingTransfer,
  onCompleteTransfer,
  onVoicemailDrop,
  showVoicemailDrop,
  voicemailDropStatus,
}) => {
  const timeCounter = (
    <DurationCounterArea
      voicemailDropStatus={voicemailDropStatus}
      startTime={startTime}
      startTimeOffset={startTimeOffset}
    />
  );
  const currentCallTitle = nameMatches?.length
    ? nameMatches[0].name
    : formatPhone(phoneNumber);
  const showCallerIdName =
    (!nameMatches || nameMatches.length === 0) &&
    fallBackName &&
    fallBackName.length > 0 &&
    phoneNumber !== 'anonymous';
  let callInfo;
  switch (layout) {
    case callCtrlLayouts.completeTransferCtrl:
    case callCtrlLayouts.mergeCtrl:
      callInfo = (
        <MergeInfo
          currentLocale={currentLocale}
          timeCounter={timeCounter}
          lastCallInfo={lastCallInfo}
          currentCallAvatarUrl={avatarUrl}
          currentCallTitle={currentCallTitle || fallBackName || i18n.getString('unknown', currentLocale)}
          formatPhone={formatPhone}
          getAvatarUrl={getAvatarUrl}
        />
      );
      break;
    case callCtrlLayouts.conferenceCtrl:
      callInfo = (
        <ConferenceInfo
          currentLocale={currentLocale}
          partyProfiles={conferenceCallParties}
          onClick={gotoParticipantsCtrl}
        />
      );
      break;
    default:
      callInfo = (
        <CallInfo
          currentLocale={currentLocale}
          nameMatches={nameMatches}
          fallBackName={fallBackName || i18n.getString('unknown', currentLocale)}
          phoneNumber={phoneNumber}
          formatPhone={formatPhone}
          areaCode={areaCode}
          countryCode={countryCode}
          selectedMatcherIndex={selectedMatcherIndex}
          onSelectMatcherName={onSelectMatcherName}
          avatarUrl={avatarUrl}
          brand={brand}
          showContactDisplayPlaceholder={showContactDisplayPlaceholder}
          sourceIcons={sourceIcons}
          phoneTypeRenderer={phoneTypeRenderer}
          phoneSourceNameRenderer={phoneSourceNameRenderer}
          callQueueName={callQueueName}
          showCallerIdName={showCallerIdName}
        />
      );
      break;
  }
  const showTimeCounter =
    layout !== callCtrlLayouts.mergeCtrl &&
    layout !== callCtrlLayouts.completeTransferCtrl;
  return (
    <BackHeaderView
      dataSign="activeCallPanel"
      onBack={onBackButtonClick}
      backButtonLabel={backButtonLabel}
      hideHeader={!showBackButton}
    >
      <StyledPanel>
        {showTimeCounter ? (
          <StyledTimeCounter variant="caption1" color="neutral.f04">
            {timeCounter}
          </StyledTimeCounter>
        ) : null}
        {callInfo}
        {
          showKeyPad ? (
            <ActiveKeyPad
              onChange={onKeyPadChange}
            />
          ) : (
            <ActiveCallPad
              currentLocale={currentLocale}
              isOnMute={isOnMute}
              isOnHold={isOnHold}
              recordStatus={recordStatus}
              onMute={onMute}
              onUnmute={onUnmute}
              onHold={onHold}
              onUnhold={onUnhold}
              onRecord={onRecord}
              onStopRecord={onStopRecord}
              onShowKeyPad={onShowKeyPad}
              onHangup={onHangup}
              onAdd={onAdd}
              onMerge={onMerge}
              onTransfer={onTransfer}
              onFlip={onFlip}
              disableFlip={disableFlip}
              onPark={onPark}
              showPark={showPark}
              layout={layout}
              addDisabled={addDisabled}
              mergeDisabled={mergeDisabled}
              conferenceCallEquipped={conferenceCallEquipped}
              hasConferenceCall={hasConferenceCall}
              actions={actions}
              controlBusy={controlBusy}
              isOnTransfer={isOnTransfer}
              isOnWaitingTransfer={isOnWaitingTransfer}
              onCompleteTransfer={onCompleteTransfer}
              onVoicemailDrop={onVoicemailDrop}
              showVoicemailDrop={showVoicemailDrop}
            />
          )
        }
        <EndButtonGroup
          controlBusy={controlBusy}
          onHangup={onHangup}
          showHideKeyPad={showKeyPad}
          onHideKeyPad={onHideKeyPad}
        />
        {children}
      </StyledPanel>
    </BackHeaderView>
  );
};
ActiveCallPanel.defaultProps = {
  startTime: null,
  startTimeOffset: 0,
  isOnMute: false,
  isOnHold: false,
  phoneNumber: null,
  children: undefined,
  avatarUrl: null,
  showBackButton: false,
  backButtonLabel: 'Active Calls',
  onBackButtonClick: null,
  brand: 'RingCentral',
  showContactDisplayPlaceholder: true,
  disableFlip: false,
  showPark: false,
  onAdd: undefined,
  onMerge: undefined,
  onFlip: () => null,
  onPark: () => null,
  gotoParticipantsCtrl: () => null,
  onCompleteTransfer: () => null,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  direction: null,
  addDisabled: false,
  mergeDisabled: false,
  conferenceCallEquipped: false,
  hasConferenceCall: false,
  conferenceCallParties: undefined,
  lastCallInfo: undefined,
  getAvatarUrl: () => null,
  actions: [],
  controlBusy: false,
  callQueueName: null,
  isOnWaitingTransfer: false,
  isOnTransfer: false,
};
export default ActiveCallPanel;