import React from 'react';

import classnames from 'classnames';
import type { Call } from '@ringcentral-integration/widgets/components/ActiveCallItemV2';
import i18n from '@ringcentral-integration/widgets/components/ActiveCallList/i18n';
import styles from '@ringcentral-integration/widgets/components/ActiveCallList/styles.scss';

import { ActiveCallItem } from '../ActiveCallItem';

function isConferenceCall(normalizedCall: any) {
  return (
    normalizedCall &&
    normalizedCall.to &&
    Array.isArray(normalizedCall.to.phoneNumber) &&
    normalizedCall.to.phoneNumber.length === 0 &&
    normalizedCall.toName === 'Conference'
  );
}
type ActiveCallListProps = {
  currentLocale: string;
  className?: string;
  title: string;
  calls: any[];
  areaCode: string;
  countryCode: string;
  brand?: string;
  showContactDisplayPlaceholder?: boolean;
  formatPhone: (...args: any[]) => any;
  onClickToSms?: (...args: any[]) => any;
  onCreateContact?: (...args: any[]) => any;
  onViewContact?: (...args: any[]) => any;
  outboundSmsPermission?: boolean;
  internalSmsPermission?: boolean;
  isLoggedContact?: (...args: any[]) => any;
  onLogCall?: (...args: any[]) => any;
  loggingMap?: object;
  showMergeCall?: boolean;
  onMergeCall?: (webphoneSessionId: string, telephonySessionId: string) => any;
  webphoneAnswer?: (...args: any[]) => any;
  webphoneReject?: (...args: any[]) => any;
  webphoneHangup?: (...args: any[]) => any;
  webphoneResume?: (...args: any[]) => any;
  webphoneToVoicemail?: (...args: any[]) => any;
  webphoneSwitchCall?: (...args: any[]) => any;
  webphoneIgnore?: (...args: any[]) => any;
  modalConfirm?: (...args: any[]) => any;
  modalClose?: (...args: any[]) => any;
  enableContactFallback?: boolean;
  autoLog?: boolean;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  isSessionAConferenceCall?: (...args: any[]) => any;
  useV2?: boolean;
  onCallItemClick?: (...args: any[]) => any;
  showAvatar?: boolean;
  getAvatarUrl?: (...args: any[]) => any;
  conferenceCallParties?: object[];
  webphoneHold?: (...args: any[]) => any;
  showCallDetail?: boolean;
  updateSessionMatchedContact?: (...args: any[]) => any;
  renderExtraButton?: (...args: any[]) => any;
  renderContactName?: (...args: any[]) => any;
  renderSubContactName?: (...args: any[]) => any;
  ringoutHangup?: (...args: any[]) => any;
  ringoutTransfer?: (...args: any[]) => any;
  ringoutReject?: (...args: any[]) => any;
  disableLinks?: boolean;
  showRingoutCallControl?: boolean;
  showMultipleMatch?: boolean;
  showSwitchCall?: boolean;
  showTransferCall?: boolean;
  showHoldOnOtherDevice?: boolean;
  isOnHold?: (...args: any[]) => any;
  showIgnoreBtn?: boolean;
  showHoldAnswerBtn?: boolean;
  useCallDetailV2?: boolean;
  newCallIcon?: boolean;
  clickSwitchTrack?: (...args: any[]) => any;
  onSwitchCall?: (call: Call) => any;
  isWide?: boolean;
  allCalls: any[];
};
const ActiveCallList: React.SFC<ActiveCallListProps> = ({
  calls,
  className,
  currentLocale,
  areaCode,
  countryCode,
  brand,
  showContactDisplayPlaceholder,
  formatPhone,
  onClickToSms,
  onCreateContact,
  onViewContact,
  outboundSmsPermission,
  internalSmsPermission,
  isLoggedContact,
  onLogCall,
  autoLog,
  loggingMap,
  showMergeCall,
  onMergeCall,
  webphoneAnswer,
  webphoneReject,
  webphoneHangup,
  webphoneResume,
  webphoneToVoicemail,
  webphoneSwitchCall,
  modalConfirm,
  modalClose,
  enableContactFallback,
  title,
  sourceIcons,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  isSessionAConferenceCall,
  onCallItemClick,
  showAvatar,
  getAvatarUrl,
  conferenceCallParties,
  useV2, // TODO: For compatibility, after replacing all ActiveCallItem with ActiveCallItemV2, we should remove this.
  webphoneHold,
  showCallDetail,
  updateSessionMatchedContact,
  renderExtraButton,
  renderContactName,
  renderSubContactName,
  ringoutHangup,
  ringoutTransfer,
  ringoutReject,
  disableLinks,
  showRingoutCallControl,
  showSwitchCall,
  showTransferCall,
  showHoldOnOtherDevice,
  isOnHold,
  webphoneIgnore,
  showIgnoreBtn,
  showHoldAnswerBtn,
  useCallDetailV2,
  newCallIcon,
  onSwitchCall,
  clickSwitchTrack,
  showMultipleMatch,
  isWide,
  allCalls,
}) => {
  if (!calls.length) {
    return null;
  }
  return (
    <div className={classnames(styles.list, className)} data-sign="callList">
      <div
        className={styles.listTitle}
        style={{
          // @ts-expect-error TS(2322): Type 'string | null' is not assignable to type 'Ma... Remove this comment to see the full error message
          marginBottom: useV2 && title ? '-5px' : null,
        }}
        title={title}
        data-sign="listTitle"
      >
        {title}
      </div>
      {calls.map((call) => {
        const isOnConferenceCall =
          call.isConferenceCall ??
          (call.webphoneSession
            ? // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
              isSessionAConferenceCall(call.webphoneSession.id)
            : isConferenceCall(call)); // in case it's an other device call

        const { warmTransferInfo } = call;
        let warmTransferRole;
        let originalCall: any;

        if (warmTransferInfo) {
          warmTransferRole = warmTransferInfo.isOriginal
            ? ` (${i18n.getString('callerCall', currentLocale)})`
            : ` (${i18n.getString('transferCall', currentLocale)})`;

          if (!call.warmTransferInfo.isOriginal) {
            originalCall = allCalls?.find(
              (s: any) =>
                s.telephonySessionId ===
                call.warmTransferInfo?.relatedTelephonySessionId,
            );
          }
        }

        return (
          <ActiveCallItem
            warmTransferRole={warmTransferRole}
            call={call}
            key={call.id ?? call.telephonySessionId}
            isOnConferenceCall={isOnConferenceCall}
            currentLocale={currentLocale}
            areaCode={areaCode}
            countryCode={countryCode}
            brand={brand}
            showContactDisplayPlaceholder={showContactDisplayPlaceholder}
            formatPhone={formatPhone}
            onClickToSms={onClickToSms}
            internalSmsPermission={internalSmsPermission}
            outboundSmsPermission={outboundSmsPermission}
            isLoggedContact={isLoggedContact}
            onLogCall={onLogCall}
            onViewContact={onViewContact}
            onCreateContact={onCreateContact}
            loggingMap={loggingMap}
            showMergeCall={showMergeCall}
            onMergeCall={onMergeCall}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            webphoneAnswer={webphoneAnswer}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            webphoneReject={webphoneReject}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            webphoneHangup={webphoneHangup}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            webphoneResume={webphoneResume}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            webphoneToVoicemail={webphoneToVoicemail}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            webphoneSwitchCall={webphoneSwitchCall}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            modalConfirm={modalConfirm}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            modalClose={modalClose}
            enableContactFallback={enableContactFallback}
            autoLog={autoLog}
            sourceIcons={sourceIcons}
            phoneTypeRenderer={phoneTypeRenderer}
            phoneSourceNameRenderer={phoneSourceNameRenderer}
            hasActionMenu={!isOnConferenceCall}
            // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
            onClick={() => onCallItemClick(originalCall || call)}
            showAvatar={showAvatar}
            getAvatarUrl={getAvatarUrl}
            // @ts-expect-error TS(2322): Type 'object[] | undefined' is not assignable to t... Remove this comment to see the full error message
            conferenceCallParties={conferenceCallParties}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            webphoneHold={webphoneHold}
            showCallDetail={showCallDetail}
            updateSessionMatchedContact={updateSessionMatchedContact}
            renderExtraButton={renderExtraButton}
            renderContactName={renderContactName}
            renderSubContactName={renderSubContactName}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            ringoutHangup={ringoutHangup}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            ringoutTransfer={ringoutTransfer}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            ringoutReject={ringoutReject}
            disableLinks={disableLinks}
            showRingoutCallControl={showRingoutCallControl}
            showMultipleMatch={!showRingoutCallControl && showMultipleMatch} // disabled for salesforce
            showSwitchCall={showSwitchCall}
            showTransferCall={showTransferCall}
            showHoldOnOtherDevice={showHoldOnOtherDevice}
            isOnHold={isOnHold}
            // @ts-expect-error TS(2322): Type '((...args: any[]) => any) | undefined' is no... Remove this comment to see the full error message
            webphoneIgnore={webphoneIgnore}
            showIgnoreBtn={showIgnoreBtn}
            showHoldAnswerBtn={showHoldAnswerBtn}
            useCallDetailV2={useCallDetailV2}
            // @ts-expect-error TS(2322): Type 'boolean | undefined' is not assignable to ty... Remove this comment to see the full error message
            newCallIcon={newCallIcon}
            clickSwitchTrack={clickSwitchTrack}
            onSwitchCall={onSwitchCall}
            isWide={isWide}
          />
        );
      })}
    </div>
  );
};
ActiveCallList.defaultProps = {
  isWide: true,
  className: undefined,
  brand: 'RingCentral',
  showContactDisplayPlaceholder: true,
  onCreateContact: undefined,
  onClickToSms: undefined,
  outboundSmsPermission: true,
  internalSmsPermission: true,
  isLoggedContact: undefined,
  onLogCall: undefined,
  loggingMap: {},
  webphoneAnswer: undefined,
  webphoneReject: undefined,
  webphoneHangup: undefined,
  webphoneResume: undefined,
  enableContactFallback: undefined,
  autoLog: false,
  onViewContact: undefined,
  webphoneToVoicemail: undefined,
  webphoneSwitchCall: undefined,
  webphoneIgnore: undefined,
  modalConfirm: undefined,
  modalClose: undefined,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  isSessionAConferenceCall: () => false,
  useV2: false,
  onCallItemClick: (i) => i,
  showAvatar: true,
  getAvatarUrl: undefined,
  conferenceCallParties: [],
  webphoneHold: (i) => i,
  showCallDetail: false,
  updateSessionMatchedContact: (i) => i,
  renderExtraButton: undefined,
  renderContactName: undefined,
  renderSubContactName: undefined,
  ringoutHangup: undefined,
  ringoutTransfer: undefined,
  ringoutReject: undefined,
  disableLinks: false,
  showRingoutCallControl: false,
  showMultipleMatch: true,
  showSwitchCall: false,
  showTransferCall: true,
  showHoldOnOtherDevice: false,
  isOnHold: undefined,
  showIgnoreBtn: false,
  showHoldAnswerBtn: false,
  useCallDetailV2: false,
  newCallIcon: false,
  clickSwitchTrack() {},
};
export default ActiveCallList;
