// TODO: fix switch call issue in widgets
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { SpinnerOverlay } from 'ringcentral-widgets/components/SpinnerOverlay';

import InsideModal from 'ringcentral-widgets/components/InsideModal';
import LogSection from 'ringcentral-widgets/components/LogSection';
import LogNotification from 'ringcentral-widgets/components/LogNotification';

import styles from 'ringcentral-widgets/components/ActiveCallsPanel/styles.scss';
import i18n from 'ringcentral-widgets/components/ActiveCallsPanel/i18n';

import ActiveCallList from '../ActiveCallList';

export default class ActiveCallsPanel extends Component {
  componentDidMount() {
    if (
      !this.hasCalls(this.props) &&
      typeof this.props.onCallsEmpty === 'function'
    ) {
      this.props.onCallsEmpty();
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      this.hasCalls(this.props) &&
      !this.hasCalls(nextProps) &&
      typeof this.props.onCallsEmpty === 'function'
    ) {
      this.props.onCallsEmpty();
    }
  }

  hasCalls(props = this.props) {
    return (
      props.activeRingCalls.length > 0 ||
      props.activeOnHoldCalls.length > 0 ||
      props.activeCurrentCalls.length > 0 ||
      props.otherDeviceCalls.length > 0
    );
  }

  renderLogSection() {
    if (!this.props.currentLog) return null;

    const {
      formatPhone,
      currentLocale,
      currentLog,
      // - styles
      // sectionContainerStyles,
      // sectionModalStyles,
      // - aditional
      // additionalInfo,
      // showSaveLogBtn,
      renderEditLogSection,
      renderSaveLogButton,
      onSaveCallLog,
      onUpdateCallLog,
      onCloseLogSection,
      // notification
      logNotification,
      showNotiLogButton,
      onCloseNotification,
      onSaveNotification,
      onExpandNotification,
      onDiscardNotification,
      notificationContainerStyles,
      onLogBasicInfoClick,
      renderSmallCallContrl,
    } = this.props;

    return (
      <div>
        <InsideModal
          title={currentLog.title}
          show={currentLog.showLog}
          onClose={onCloseLogSection}
          clickOutToClose={false}
          maskStyle={styles.maskStyle}
          // containerStyles={sectionContainerStyles}
          // modalStyles={sectionModalStyles}
        >
          <LogSection
            currentLocale={currentLocale}
            currentLog={currentLog}
            formatPhone={formatPhone}
            // additionalInfo={additionalInfo}
            isInnerMask={
              logNotification && logNotification.notificationIsExpand
            }
            // save call log
            renderEditLogSection={renderEditLogSection}
            showSaveLogBtn
            onUpdateCallLog={onUpdateCallLog}
            onSaveCallLog={onSaveCallLog}
            renderSaveLogButton={renderSaveLogButton}
            // active call ctrl
            onLogBasicInfoClick={onLogBasicInfoClick}
            renderSmallCallContrl={renderSmallCallContrl}
          />
        </InsideModal>
        {logNotification ? (
          <InsideModal
            show={logNotification.showNotification}
            showTitle={false}
            containerStyles={classnames(
              styles.notificationContainer,
              notificationContainerStyles,
            )}
            modalStyles={styles.notificationModal}
            contentStyle={styles.notificationContent}
            onClose={onCloseNotification}
          >
            <LogNotification
              showLogButton={showNotiLogButton}
              currentLocale={currentLocale}
              formatPhone={formatPhone}
              currentLog={logNotification}
              isExpand={logNotification.notificationIsExpand}
              onSave={onSaveNotification}
              onExpand={onExpandNotification}
              onDiscard={onDiscardNotification}
              onStay={onCloseNotification}
            />
          </InsideModal>
        ) : null}
      </div>
    );
  }

  getCallList(calls, title, showCallDetail = false) {
    const {
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
      enableContactFallback,
      webphoneToVoicemail,
      sourceIcons,
      phoneTypeRenderer,
      phoneSourceNameRenderer,
      activeCurrentCalls,
      isWebRTC,
      isSessionAConferenceCall,
      onCallItemClick,
      showAvatar,
      getAvatarUrl,
      conferenceCallParties,
      webphoneHold,
      webphoneSwitchCall,
      modalConfirm,
      modalClose,
      useV2,
      updateSessionMatchedContact,
      renderExtraButton,
      renderContactName,
      ringoutHangup,
      ringoutTransfer,
      ringoutReject,
      disableLinks,
      showRingoutCallControl,
      showMultipleMatch,
      showSwitchCall,
      showTransferCall,
      showHoldOnOtherDevice,
      isOnHold,
      // customization
      webphoneIgnore,
      showIgnoreBtn,
      showHoldAnswerBtn,
      useCallDetailV2,
      newCallIcon,
      clickSwitchTrack,
    } = this.props;

    return (
      <ActiveCallList
        title={title}
        calls={calls}
        currentLocale={currentLocale}
        areaCode={areaCode}
        countryCode={countryCode}
        brand={brand}
        showContactDisplayPlaceholder={showContactDisplayPlaceholder}
        formatPhone={formatPhone}
        onClickToSms={onClickToSms}
        onCreateContact={onCreateContact}
        onViewContact={onViewContact}
        outboundSmsPermission={outboundSmsPermission}
        internalSmsPermission={internalSmsPermission}
        isLoggedContact={isLoggedContact}
        onLogCall={onLogCall}
        autoLog={autoLog}
        loggingMap={loggingMap}
        webphoneAnswer={webphoneAnswer}
        webphoneReject={webphoneReject}
        webphoneHangup={webphoneHangup}
        webphoneResume={webphoneResume}
        webphoneSwitchCall={webphoneSwitchCall}
        webphoneIgnore={webphoneIgnore}
        modalConfirm={modalConfirm}
        modalClose={modalClose}
        webphoneToVoicemail={webphoneToVoicemail}
        renderExtraButton={renderExtraButton}
        renderContactName={renderContactName}
        enableContactFallback={enableContactFallback}
        sourceIcons={sourceIcons}
        phoneTypeRenderer={phoneTypeRenderer}
        phoneSourceNameRenderer={phoneSourceNameRenderer}
        isWebRTC={isWebRTC}
        currentCall={activeCurrentCalls[0]}
        isSessionAConferenceCall={isSessionAConferenceCall}
        useV2={useV2} // TODO: Maybe we should make all the call item consistent
        onCallItemClick={onCallItemClick}
        showAvatar={showAvatar}
        getAvatarUrl={getAvatarUrl}
        conferenceCallParties={conferenceCallParties}
        webphoneHold={webphoneHold}
        showCallDetail={showCallDetail}
        updateSessionMatchedContact={updateSessionMatchedContact}
        ringoutHangup={ringoutHangup}
        ringoutTransfer={ringoutTransfer}
        ringoutReject={ringoutReject}
        disableLinks={disableLinks}
        showRingoutCallControl={showRingoutCallControl}
        showMultipleMatch={showMultipleMatch}
        showSwitchCall={showSwitchCall}
        showTransferCall={showTransferCall}
        showHoldOnOtherDevice={showHoldOnOtherDevice}
        isOnHold={isOnHold}
        showIgnoreBtn={showIgnoreBtn}
        showHoldAnswerBtn={showHoldAnswerBtn}
        useCallDetailV2={useCallDetailV2}
        newCallIcon={newCallIcon}
        clickSwitchTrack={clickSwitchTrack}
      />
    );
  }

  render() {
    const {
      activeRingCalls,
      activeOnHoldCalls,
      activeCurrentCalls,
      otherDeviceCalls,
      className,
      currentLocale,
      showSpinner,
      showOtherDevice,
      showCallDetail,
    } = this.props;
    const logSection = this.renderLogSection();

    if (!this.hasCalls()) {
      return (
        <div
          data-sign="activeCalls"
          className={classnames(styles.root, className)}
        >
          <p className={styles.noCalls}>
            {i18n.getString('noActiveCalls', currentLocale)}
          </p>
          {logSection}
          {showSpinner ? <SpinnerOverlay className={styles.spinner} /> : null}
        </div>
      );
    }
    const otherDevice = showOtherDevice
      ? this.getCallList(
          otherDeviceCalls,
          i18n.getString('otherDeviceCall', currentLocale),
          true,
        )
      : null;
    return (
      <div data-sign="activeCalls" className={styles.root}>
        <div
          className={classnames(styles.root, className)}
          ref={(target) => {
            this.container = target;
          }}
        >
          {this.getCallList(
            activeRingCalls,
            i18n.getString('ringCall', currentLocale),
            showCallDetail,
          )}
          {this.getCallList(
            activeCurrentCalls,
            i18n.getString('currentCall', currentLocale),
            showCallDetail,
          )}
          {this.getCallList(
            activeOnHoldCalls,
            i18n.getString('onHoldCall', currentLocale),
            showCallDetail,
          )}
          {otherDevice}
        </div>
        {logSection}
        {showSpinner ? <SpinnerOverlay className={styles.spinner} /> : null}
      </div>
    );
  }
}

ActiveCallsPanel.propTypes = {
  currentLocale: PropTypes.string.isRequired,
  className: PropTypes.string,
  activeRingCalls: PropTypes.array.isRequired,
  activeOnHoldCalls: PropTypes.array.isRequired,
  activeCurrentCalls: PropTypes.array.isRequired,
  otherDeviceCalls: PropTypes.array.isRequired,
  areaCode: PropTypes.string.isRequired,
  countryCode: PropTypes.string.isRequired,
  brand: PropTypes.string,
  showContactDisplayPlaceholder: PropTypes.bool,
  formatPhone: PropTypes.func.isRequired,
  onClickToSms: PropTypes.func,
  onCreateContact: PropTypes.func,
  outboundSmsPermission: PropTypes.bool,
  internalSmsPermission: PropTypes.bool,
  isLoggedContact: PropTypes.func,
  onLogCall: PropTypes.func,
  webphoneAnswer: PropTypes.func,
  webphoneReject: PropTypes.func,
  webphoneHangup: PropTypes.func,
  webphoneResume: PropTypes.func,
  webphoneToVoicemail: PropTypes.func,
  webphoneSwitchCall: PropTypes.func,
  webphoneIgnore: PropTypes.func,
  modalConfirm: PropTypes.func,
  modalClose: PropTypes.func,
  autoLog: PropTypes.bool,
  onViewContact: PropTypes.func,
  enableContactFallback: PropTypes.bool,
  loggingMap: PropTypes.object,
  onCallsEmpty: PropTypes.func,
  sourceIcons: PropTypes.object,
  phoneTypeRenderer: PropTypes.func,
  phoneSourceNameRenderer: PropTypes.func,
  isWebRTC: PropTypes.bool.isRequired,
  showSpinner: PropTypes.bool,
  isSessionAConferenceCall: PropTypes.func,
  onCallItemClick: PropTypes.func,
  getAvatarUrl: PropTypes.func,
  conferenceCallParties: PropTypes.arrayOf(PropTypes.object),
  webphoneHold: PropTypes.func,
  useV2: PropTypes.bool,
  updateSessionMatchedContact: PropTypes.func,
  isOnHold: PropTypes.func.isRequired,
  // CallLog related
  currentLog: PropTypes.object,
  renderEditLogSection: PropTypes.func,
  renderSaveLogButton: PropTypes.func,
  renderExtraButton: PropTypes.func,
  onSaveCallLog: PropTypes.func,
  onUpdateCallLog: PropTypes.func,
  onCloseLogSection: PropTypes.func,
  // - Notification
  logNotification: PropTypes.object,
  onCloseNotification: PropTypes.func,
  onDiscardNotification: PropTypes.func,
  onSaveNotification: PropTypes.func,
  onExpandNotification: PropTypes.func,
  showNotiLogButton: PropTypes.bool,
  notificationContainerStyles: PropTypes.string,
  // Contact
  showAvatar: PropTypes.bool,
  renderContactName: PropTypes.func,
  showOtherDevice: PropTypes.bool,
  ringoutHangup: PropTypes.func,
  ringoutTransfer: PropTypes.func,
  ringoutReject: PropTypes.func,
  disableLinks: PropTypes.bool,
  showRingoutCallControl: PropTypes.bool,
  showMultipleMatch: PropTypes.bool,
  showSwitchCall: PropTypes.bool,
  showTransferCall: PropTypes.bool,
  showHoldOnOtherDevice: PropTypes.bool,
  onLogBasicInfoClick: PropTypes.func,
  renderSmallCallContrl: PropTypes.func,
  // customization
  showCallDetail: PropTypes.bool,
  showIgnoreBtn: PropTypes.bool,
  showHoldAnswerBtn: PropTypes.bool,
  useCallDetailV2: PropTypes.bool,
  newCallIcon: PropTypes.bool,
  clickSwitchTrack: PropTypes.func,
};

ActiveCallsPanel.defaultProps = {
  className: undefined,
  brand: 'RingCentral',
  showContactDisplayPlaceholder: true,
  onCreateContact: undefined,
  onClickToSms: undefined,
  outboundSmsPermission: true,
  internalSmsPermission: true,
  isLoggedContact: undefined,
  onLogCall: undefined,
  onViewContact: undefined,
  webphoneAnswer: undefined,
  webphoneReject: undefined,
  webphoneHangup: undefined,
  webphoneResume: undefined,
  webphoneToVoicemail: undefined,
  webphoneSwitchCall: undefined,
  webphoneIgnore: undefined,
  modalConfirm: undefined,
  modalClose: undefined,
  enableContactFallback: undefined,
  loggingMap: {},
  autoLog: false,
  onCallsEmpty: undefined,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  showSpinner: false,
  isSessionAConferenceCall: () => false,
  onCallItemClick: false,
  getAvatarUrl: undefined,
  conferenceCallParties: [],
  webphoneHold: (i) => i,
  useV2: false,
  updateSessionMatchedContact: (i) => i,
  // CallLog related
  currentLog: undefined,
  renderEditLogSection: undefined,
  renderSaveLogButton: undefined,
  renderExtraButton: undefined,
  onSaveCallLog: undefined,
  onUpdateCallLog: undefined,
  onCloseLogSection: undefined,
  // Notification
  logNotification: undefined,
  onCloseNotification: undefined,
  onDiscardNotification: undefined,
  onSaveNotification: undefined,
  onExpandNotification: undefined,
  showNotiLogButton: true,
  notificationContainerStyles: undefined,
  // Contact
  showAvatar: true,
  renderContactName: undefined,
  showOtherDevice: true,
  ringoutHangup: undefined,
  ringoutTransfer: undefined,
  ringoutReject: undefined,
  disableLinks: false,
  showRingoutCallControl: false,
  showMultipleMatch: true,
  showSwitchCall: false,
  showTransferCall: true,
  showHoldOnOtherDevice: false,
  onLogBasicInfoClick() {},
  renderSmallCallContrl() {},
  // customization
  showCallDetail: false,
  showIgnoreBtn: false,
  showHoldAnswerBtn: false,
  useCallDetailV2: false,
  newCallIcon: false,
  clickSwitchTrack() {},
};
