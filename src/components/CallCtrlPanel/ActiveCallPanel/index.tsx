import React from 'react';

import callCtrlLayouts from '@ringcentral-integration/widgets/enums/callCtrlLayouts';
import ActiveCallPad from '@ringcentral-integration/widgets/components/ActiveCallPad';
import BackButton from '@ringcentral-integration/widgets/components/BackButton';
import BackHeader from '@ringcentral-integration/widgets/components/BackHeader';
import DurationCounter from '@ringcentral-integration/widgets/components/DurationCounter';
import Panel from '@ringcentral-integration/widgets/components/Panel';
import ConferenceInfo from '@ringcentral-integration/widgets/components/ActiveCallPanel/ConferenceInfo';
import MergeInfo from '@ringcentral-integration/widgets/components/ActiveCallPanel/MergeInfo';
import styles from '@ringcentral-integration/widgets/components/ActiveCallPanel/styles.scss';

import CallInfo from './CallInfo';

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
};
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
  onHangup,
  onPark,
  onAdd,
  onMerge,
  onFlip,
  // @ts-expect-error TS(2339): Property 'onTransfer' does not exist on type 'Prop... Remove this comment to see the full error message
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
}) => {
  const backHeader = showBackButton ? (
    <BackHeader
      onBackClick={onBackButtonClick}
      backButton={<BackButton label={backButtonLabel} />}
    />
  ) : null;
  const timeCounter = (
    <div className={styles.timeCounter}>
      {startTime ? (
        <DurationCounter startTime={startTime} offset={startTimeOffset} />
      ) : (
        <span aria-hidden="true">&nbsp;</span>
      )}
    </div>
  );
  const currentCallTitle = nameMatches?.length
    ? nameMatches[0].name
    : formatPhone(phoneNumber);
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
          currentCallTitle={currentCallTitle || fallBackName}
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
          fallBackName={fallBackName}
          phoneNumber={phoneNumber}
          formatPhone={formatPhone}
          // @ts-expect-error TS(2322): Type '{ currentLocale: string; nameMatches: { name... Remove this comment to see the full error message
          startTime={startTime}
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
        />
      );
      break;
  }
  const showTimeCounter =
    layout !== callCtrlLayouts.mergeCtrl &&
    layout !== callCtrlLayouts.completeTransferCtrl;
  return (
    <div data-sign="activeCallPanel" className={styles.root}>
      {backHeader}
      <Panel className={styles.panel}>
        {showTimeCounter ? timeCounter : null}
        {callInfo}
        <ActiveCallPad
          className={styles.callPad}
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
          // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
          onFlip={onFlip}
          disableFlip={disableFlip}
          // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
          onPark={onPark}
          showPark={showPark}
          layout={layout}
          direction={direction}
          addDisabled={addDisabled}
          mergeDisabled={mergeDisabled}
          conferenceCallEquipped={conferenceCallEquipped}
          hasConferenceCall={hasConferenceCall}
          actions={actions}
          controlBusy={controlBusy}
          isOnTransfer={isOnTransfer}
          isOnWaitingTransfer={isOnWaitingTransfer}
          // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
          onCompleteTransfer={onCompleteTransfer}
        />
        {children}
      </Panel>
    </div>
  );
};
ActiveCallPanel.defaultProps = {
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'number | un... Remove this comment to see the full error message
  startTime: null,
  startTimeOffset: 0,
  isOnMute: false,
  isOnHold: false,
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
  phoneNumber: null,
  children: undefined,
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
  avatarUrl: null,
  showBackButton: false,
  backButtonLabel: 'Active Calls',
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type '((...args: ... Remove this comment to see the full error message
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
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
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
  // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'string | un... Remove this comment to see the full error message
  callQueueName: null,
  isOnWaitingTransfer: false,
  isOnTransfer: false,
};
export default ActiveCallPanel;