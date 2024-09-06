import React, { memo, useState, useEffect } from 'react';
import type { FunctionComponent } from 'react';
import callCtrlLayouts from '@ringcentral-integration/widgets/enums/callCtrlLayouts';

import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';

import ActiveCallPanel from './ActiveCallPanel';
import ConfirmMergeModal from './ConfirmMergeModal';

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

const CallCtrlPanel: FunctionComponent<CallCtrlPanelProps> = ({
  onKeyPadChange = () => null,
  actions = [],
  addDisabled = false,
  areaCode,
  avatarUrl = null,
  backButtonLabel = 'Active Calls',
  showBackButton = false,
  onBackButtonClick = null,
  brand = 'RingCentral',
  callStatus = null,
  children = undefined,
  conferenceCallEquipped = false,
  conferenceCallParties = undefined,
  controlBusy = false,
  countryCode,
  currentLocale,
  direction = null,
  fallBackName,
  formatPhone,
  getAvatarUrl = () => null,
  gotoParticipantsCtrl = (i: any) => i,
  hasConferenceCall = false,
  onBeforeMerge = undefined,
  afterOnMerge = () => null,
  afterConfirmMerge = () => null,
  afterHideMergeConfirm = () => null,
  onMerge = undefined,
  isOnHold = false,
  isOnMute = false,
  lastCallInfo = undefined,
  layout,
  mergeDisabled = false,
  nameMatches,
  onAdd = undefined,
  onHangup,
  onHold,
  onMute,
  onPark = () => null,
  onRecord = () => null,
  onSelectMatcherName = () => null,
  onStopRecord = () => null,
  onUnhold,
  onUnmute,
  phoneNumber = null,
  phoneSourceNameRenderer = undefined,
  phoneTypeRenderer = undefined,
  recordStatus = '',
  selectedMatcherIndex,
  sessionId = undefined,
  showContactDisplayPlaceholder = true,
  showSpinner = false,
  sourceIcons = undefined,
  startTime = null,
  callQueueName = null,
  showPark = false,
  isOnWaitingTransfer = false,
  onCompleteTransfer = () => null,
  onTransfer,
  isOnTransfer = false,
  disableFlip = false,
  onFlip = () => null,
}) => {
  const [isShowKeyPad, setIsShowKeyPad] = useState(false);
  const [isShowMergeConfirm, setIsShowMergeConfirm] = useState(false);

  useEffect(() => {
    setIsShowKeyPad(false);
    setIsShowMergeConfirm(false);
  }, [sessionId]);

  useEffect(() => {
    if (!hasConferenceCall && isShowMergeConfirm) {
      setIsShowMergeConfirm(false);
    }
  }, [hasConferenceCall, isShowMergeConfirm]);

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
      recordStatus={recordStatus}
      onMute={onMute}
      onUnmute={onUnmute}
      onHold={onHold}
      onUnhold={onUnhold}
      onRecord={onRecord}
      onStopRecord={onStopRecord}
      onShowKeyPad={() => {
        setIsShowKeyPad(true);
      }}
      onHideKeyPad={() => {
        setIsShowKeyPad(false);
      }}
      onKeyPadChange={onKeyPadChange}
      onHangup={onHangup}
      onPark={onPark}
      onAdd={onAdd}
      onMerge={() => {
        if (typeof onBeforeMerge !== 'function' || onBeforeMerge()) {
          if (
            hasConferenceCall &&
            layout === callCtrlLayouts.normalCtrl
          ) {
            setIsShowMergeConfirm(true);
          } else if (typeof onMerge === 'function') {
            onMerge();
          }
        }
        if (typeof afterOnMerge === 'function') {
          afterOnMerge();
        }
      }}
      onCompleteTransfer={onCompleteTransfer}
      nameMatches={nameMatches}
      fallBackName={fallBackName}
      areaCode={areaCode}
      countryCode={countryCode}
      selectedMatcherIndex={selectedMatcherIndex}
      onSelectMatcherName={onSelectMatcherName}
      avatarUrl={avatarUrl}
      brand={brand}
      showContactDisplayPlaceholder={showContactDisplayPlaceholder}
      onFlip={() => {
        onFlip(sessionId)
      }}
      disableFlip={disableFlip}
      showPark={showPark}
      onTransfer={() => {
        onTransfer(sessionId);
      }}
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
          onMerge={() => {
            setIsShowMergeConfirm(false);
            if (typeof onMerge === 'function') {
              onMerge();
            }
            if (typeof afterConfirmMerge === 'function') {
              afterConfirmMerge();
            }
          }}
          onCancel={() => {
            setIsShowMergeConfirm(false);
            if (typeof afterHideMergeConfirm === 'function') {
              afterHideMergeConfirm();
            }
          }}
        />
      ) : null}
    </ActiveCallPanel>
  );
}

export default memo(CallCtrlPanel);
