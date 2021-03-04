import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ActiveCallItem from 'ringcentral-widgets/components/ActiveCallItem';
import styles from 'ringcentral-widgets/components/ActiveCallList/styles.scss';

import { ActiveCallItem as ActiveCallItemV2 } from './ActiveCallItemV2';

function isConferenceCall(normalizedCall) {
  return (
    normalizedCall &&
    normalizedCall.to &&
    Array.isArray(normalizedCall.to.phoneNumber) &&
    normalizedCall.to.phoneNumber.length === 0 &&
    normalizedCall.toName === 'Conference'
  );
}

const ActiveCallList = ({
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
  clickSwitchTrack,
  showMultipleMatch,
}) => {
  if (!calls.length) {
    return null;
  }
  // if you are using call control SDK for webphone operation, then require to use ActiveCallItem v2
  const Component = useV2 ? ActiveCallItemV2 : ActiveCallItem;

  return (
    <div className={classnames(styles.list, className)} data-sign="callList">
      <div
        className={styles.listTitle}
        style={{
          marginBottom: useV2 && title ? '-5px' : null,
        }}
        title={title}
        data-sign="listTitle"
      >
        {title}
      </div>
      {calls.map((call) => {
        const isOnConferenceCall = call.webphoneSession
          ? isSessionAConferenceCall(call.webphoneSession.id)
          : isConferenceCall(call); // in case it's an other device call

        return (
          <Component
            call={call}
            key={call.id}
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
            webphoneAnswer={webphoneAnswer}
            webphoneReject={webphoneReject}
            webphoneHangup={webphoneHangup}
            webphoneResume={webphoneResume}
            webphoneToVoicemail={webphoneToVoicemail}
            webphoneSwitchCall={webphoneSwitchCall}
            modalConfirm={modalConfirm}
            modalClose={modalClose}
            enableContactFallback={enableContactFallback}
            autoLog={autoLog}
            sourceIcons={sourceIcons}
            phoneTypeRenderer={phoneTypeRenderer}
            phoneSourceNameRenderer={phoneSourceNameRenderer}
            hasActionMenu={!isOnConferenceCall}
            onClick={() => onCallItemClick(call)}
            showAvatar={showAvatar}
            getAvatarUrl={getAvatarUrl}
            conferenceCallParties={conferenceCallParties}
            webphoneHold={webphoneHold}
            showCallDetail={showCallDetail}
            updateSessionMatchedContact={updateSessionMatchedContact}
            renderExtraButton={renderExtraButton}
            renderContactName={renderContactName}
            ringoutHangup={ringoutHangup}
            ringoutTransfer={ringoutTransfer}
            ringoutReject={ringoutReject}
            disableLinks={disableLinks}
            showRingoutCallControl={showRingoutCallControl}
            showMultipleMatch={!showRingoutCallControl && showMultipleMatch} // disabled for salesforce
            showSwitchCall={showSwitchCall}
            showTransferCall={showTransferCall}
            showHoldOnOtherDevice={showHoldOnOtherDevice}
            isOnHold={isOnHold}
            webphoneIgnore={webphoneIgnore}
            showIgnoreBtn={showIgnoreBtn}
            showHoldAnswerBtn={showHoldAnswerBtn}
            useCallDetailV2={useCallDetailV2}
            newCallIcon={newCallIcon}
            clickSwitchTrack={clickSwitchTrack}
          />
        );
      })}
    </div>
  );
};

ActiveCallList.propTypes = {
  currentLocale: PropTypes.string.isRequired,
  className: PropTypes.string,
  title: PropTypes.string.isRequired,
  calls: PropTypes.array.isRequired,
  areaCode: PropTypes.string.isRequired,
  countryCode: PropTypes.string.isRequired,
  brand: PropTypes.string,
  showContactDisplayPlaceholder: PropTypes.bool,
  formatPhone: PropTypes.func.isRequired,
  onClickToSms: PropTypes.func,
  onCreateContact: PropTypes.func,
  onViewContact: PropTypes.func,
  outboundSmsPermission: PropTypes.bool,
  internalSmsPermission: PropTypes.bool,
  isLoggedContact: PropTypes.func,
  onLogCall: PropTypes.func,
  loggingMap: PropTypes.object,
  webphoneAnswer: PropTypes.func,
  webphoneReject: PropTypes.func,
  webphoneHangup: PropTypes.func,
  webphoneResume: PropTypes.func,
  webphoneToVoicemail: PropTypes.func,
  webphoneSwitchCall: PropTypes.func,
  webphoneIgnore: PropTypes.func,
  modalConfirm: PropTypes.func,
  modalClose: PropTypes.func,
  enableContactFallback: PropTypes.bool,
  autoLog: PropTypes.bool,
  sourceIcons: PropTypes.object,
  phoneTypeRenderer: PropTypes.func,
  phoneSourceNameRenderer: PropTypes.func,
  isSessionAConferenceCall: PropTypes.func,
  useV2: PropTypes.bool,
  onCallItemClick: PropTypes.func,
  showAvatar: PropTypes.bool,
  getAvatarUrl: PropTypes.func,
  conferenceCallParties: PropTypes.arrayOf(PropTypes.object),
  webphoneHold: PropTypes.func,
  showCallDetail: PropTypes.bool,
  updateSessionMatchedContact: PropTypes.func,
  renderExtraButton: PropTypes.func,
  renderContactName: PropTypes.func,
  ringoutHangup: PropTypes.func,
  ringoutTransfer: PropTypes.func,
  ringoutReject: PropTypes.func,
  disableLinks: PropTypes.bool,
  showRingoutCallControl: PropTypes.bool,
  showMultipleMatch: PropTypes.bool,
  showSwitchCall: PropTypes.bool,
  showTransferCall: PropTypes.bool,
  showHoldOnOtherDevice: PropTypes.bool,
  isOnHold: PropTypes.func,
  showIgnoreBtn: PropTypes.bool,
  showHoldAnswerBtn: PropTypes.bool,
  useCallDetailV2: PropTypes.bool,
  newCallIcon: PropTypes.bool,
  clickSwitchTrack: PropTypes.func,
};

ActiveCallList.defaultProps = {
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
