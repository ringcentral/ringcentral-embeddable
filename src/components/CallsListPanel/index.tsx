import React, { useState, useRef, useEffect } from 'react';

import classnames from 'classnames';

import debounce from '@ringcentral-integration/commons/lib/debounce';
import { styled, palette2 } from '@ringcentral/juno';
import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import i18n from '@ringcentral-integration/widgets/components/CallsListPanel/i18n';
import styles from '@ringcentral-integration/widgets/components/CallsListPanel/styles.scss';

import CallListV2 from '../CallListV2';
import ActiveCallList from '../ActiveCallList';
import {
  SearchAndFilter,
  CALL_TYPE_LIST,
  CALL_TYPE_LIST_WITH_UN_LOGGED,
} from '../SearchAndFilter';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ListRoot = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  overflow: auto;
  background-color: ${palette2('neutral', 'b01')};
  flex: 1;
`;

export function CallsListPanel({
  width = 300,
  height = 315,
  currentLocale,
  className = undefined,
  activeRingCalls,
  activeOnHoldCalls,
  activeCurrentCalls,
  otherDeviceCalls,
  calls,
  onSearchInputChange,
  searchInput = '',
  showSpinner = false,
  areaCode,
  countryCode,
  brand = 'RingCentral',
  showContactDisplayPlaceholder = true,
  formatPhone,
  onClickToSms = undefined,
  onCreateContact = undefined,
  onRefreshContact = undefined,
  createEntityTypes = undefined,
  outboundSmsPermission = true,
  internalSmsPermission = true,
  isLoggedContact = undefined,
  onLogCall = undefined,
  webphoneAnswer = undefined,
  webphoneReject = undefined,
  webphoneHangup = undefined,
  webphoneResume = undefined,
  webphoneToVoicemail = undefined,
  autoLog = false,
  onViewContact = undefined,
  enableContactFallback = undefined,
  loggingMap = {},
  sourceIcons = undefined,
  phoneTypeRenderer = undefined,
  phoneSourceNameRenderer = undefined,
  onClickToDial = undefined,
  disableLinks,
  disableClickToDial = false,
  dateTimeFormatter,
  active = false,
  renderContactName = undefined,
  renderSubContactName = undefined,
  renderExtraButton = undefined,
  contactDisplayStyle = styles.contactDisplay,
  currentLog = undefined,
  externalViewEntity = undefined,
  externalHasEntity = undefined,
  readTextPermission = true,
  children = null,
  onlyHistory = false,
  adaptive = false,
  showChooseEntityModal = true,
  enableCDC = false,
  maxExtensionLength,
  showLogButton = false,
  logButtonTitle = '',
  hideEditLogButton = false,
  showMergeCall,
  showCallDetail,
  onMergeCall,
  webphoneSwitchCall,
  webphoneIgnore,
  modalConfirm,
  modalClose,
  isSessionAConferenceCall = () => false,
  onActiveCallItemClick,
  showAvatar = true,
  showOtherDevice = true,
  getAvatarUrl,
  conferenceCallParties = [],
  webphoneHold = (i: any) => i,
  updateSessionMatchedContact = (i: any) => i,
  ringoutHangup,
  ringoutTransfer,
  ringoutReject,
  showRingoutCallControl = false,
  showMultipleMatch = true,
  showSwitchCall = false,
  showTransferCall = true,
  showHoldOnOtherDevice = false,
  isOnHold,
  showIgnoreBtn = false,
  showHoldAnswerBtn = false,
  useCallDetailV2 = false,
  newCallIcon = false,
  clickSwitchTrack = () => {},
  onSwitchCall,
  isWide = true,
  activeCalls,
  type,
  filterType,
  onFilterTypeChange,
  onViewSmartNote,
  onViewCalls,
  aiNotedCallMapping = {},
  hasMoreCalls,
  loadingMoreCalls,
  loadMoreCalls,
  onLoadCalls = undefined,
}) {
  const [contentHeight, setContentHeight] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const listWrapper = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (showSpinner) {
      return;
    }
    if (typeof onLoadCalls === 'function') {
      onLoadCalls(type, filterType);
    }
  }, [type, showSpinner, filterType]);

  const calculateContentSize = () => {
    if (listWrapper.current && listWrapper.current.getBoundingClientRect) {
      const react = listWrapper.current.getBoundingClientRect();
      setContentHeight(
        react.bottom - react.top,
      );
      setContentWidth(react.right - react.left);
      return;
    }
    setContentHeight(0);
    setContentWidth(0);
  }

  useEffect(() => {
    if (!adaptive) {
      return;
    }
    const _onResize = debounce(() => {
      if (mounted.current) {
        calculateContentSize();
      }
    }, 300);
    mounted.current = true;
    calculateContentSize();
    window.addEventListener('resize', _onResize);
    return () => {
      mounted.current = false;
      window.removeEventListener('resize', _onResize);
    };
  }, []);

  useEffect(() => {
    if (!showSpinner && mounted.current) {
      setTimeout(() => {
        calculateContentSize();
      }, 0);
    }
  }, [showSpinner]);

  if (showSpinner) {
    return (<SpinnerOverlay />);
  }

  const isShowMessageIcon = readTextPermission && !!onClickToSms;
  const callsListView = (
    <CallListV2
      width={adaptive ? contentWidth : width}
      height={adaptive ? contentHeight : height}
      brand={brand}
      currentLocale={currentLocale}
      calls={calls}
      areaCode={areaCode}
      countryCode={countryCode}
      onViewContact={onViewContact}
      onCreateContact={onCreateContact}
      onRefreshContact={onRefreshContact}
      createEntityTypes={createEntityTypes}
      onLogCall={onLogCall}
      onClickToDial={onClickToDial}
      onClickToSms={onClickToSms}
      isLoggedContact={isLoggedContact}
      disableLinks={disableLinks}
      disableClickToDial={disableClickToDial}
      outboundSmsPermission={outboundSmsPermission}
      internalSmsPermission={internalSmsPermission}
      dateTimeFormatter={dateTimeFormatter}
      maxExtensionNumberLength={maxExtensionLength}
      active={active}
      loggingMap={loggingMap}
      webphoneAnswer={webphoneAnswer}
      webphoneReject={webphoneReject}
      webphoneHangup={webphoneHangup}
      webphoneResume={webphoneResume}
      enableContactFallback={enableContactFallback}
      autoLog={autoLog}
      showContactDisplayPlaceholder={showContactDisplayPlaceholder}
      sourceIcons={sourceIcons}
      phoneTypeRenderer={phoneTypeRenderer}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      renderContactName={renderContactName}
      renderSubContactName={renderSubContactName}
      renderExtraButton={renderExtraButton}
      contactDisplayStyle={contactDisplayStyle}
      externalViewEntity={externalViewEntity}
      externalHasEntity={externalHasEntity}
      readTextPermission={isShowMessageIcon}
      showChooseEntityModal={showChooseEntityModal}
      enableCDC={enableCDC}
      showLogButton={showLogButton}
      logButtonTitle={logButtonTitle}
      hideEditLogButton={hideEditLogButton}
      formatPhone={formatPhone}
      isRecording={type === 'recordings'}
      onViewSmartNote={onViewSmartNote}
      onViewCalls={onViewCalls}
      aiNotedCallMapping={aiNotedCallMapping}
      hasMoreCalls={hasMoreCalls}
      loadingMoreCalls={loadingMoreCalls}
      loadMoreCalls={loadMoreCalls}
    />
  );

  const search = onSearchInputChange ? (
    <SearchAndFilter
      searchInput={searchInput}
      onSearchInputChange={onSearchInputChange}
      placeholder={i18n.getString('searchPlaceholder', currentLocale)}
      disableLinks={disableLinks}
      type={filterType}
      onTypeChange={onFilterTypeChange}
      typeList={showLogButton ? CALL_TYPE_LIST_WITH_UN_LOGGED : CALL_TYPE_LIST}
      currentLocale={currentLocale}
      showTypeFilter={type !== 'recordings'}
    />
  ) : null;

  const getCallList = (
    calls: any,
    title: any,
    showCallDetail = false,
    allCalls: any,
    showMergeCallBtn?: boolean,
  ) => (
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
      enableCDC={enableCDC}
      onViewContact={onViewContact}
      outboundSmsPermission={outboundSmsPermission}
      internalSmsPermission={internalSmsPermission}
      isLoggedContact={isLoggedContact}
      onLogCall={onLogCall}
      autoLog={autoLog}
      loggingMap={loggingMap}
      showMergeCall={showMergeCall && showMergeCallBtn}
      onMergeCall={onMergeCall}
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
      renderSubContactName={renderSubContactName}
      enableContactFallback={enableContactFallback}
      sourceIcons={sourceIcons}
      phoneTypeRenderer={phoneTypeRenderer}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      isSessionAConferenceCall={isSessionAConferenceCall}
      onCallItemClick={onActiveCallItemClick}
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
      onSwitchCall={onSwitchCall}
      isWide={isWide}
      allCalls={allCalls}
      logButtonTitle={logButtonTitle}
    />
  );

  const historyCall = showSpinner ? (
    <SpinnerOverlay />
  ) : (
    <div className={classnames(styles.list, className)}>
      {!onlyHistory && activeCalls.length > 0 && (
        <div className={styles.listTitle}>
          {i18n.getString('historyCalls', currentLocale)}
        </div>
      )}
      {callsListView}
    </div>
  );

  const noCalls = otherDeviceCalls.length === 0 && (
    <p className={styles.noCalls}>
      {i18n.getString('noCalls', currentLocale)}
    </p>
  );

  return (
    <Container
      data-sign="callsListPanel"
      className="CallsListPanel_container"
    >
      {children}
      {onlyHistory ||
        getCallList(
          activeRingCalls,
          i18n.getString('ringCall', currentLocale),
          showCallDetail,
          activeCalls,
          false,
        )}
      {onlyHistory ||
        getCallList(
          activeCurrentCalls,
          i18n.getString('currentCall', currentLocale),
          showCallDetail,
          activeCalls,
          false,
        )}
      {onlyHistory ||
        getCallList(
          activeOnHoldCalls,
          i18n.getString('onHoldCall', currentLocale),
          showCallDetail,
          activeCalls,
          true,
        )}
      {onlyHistory ||
        (showOtherDevice ? getCallList(
          otherDeviceCalls,
          i18n.getString('otherDeviceCall', currentLocale),
          showCallDetail,
          activeCalls,
          false,
        ) : null)
      }
      {search}
      <ListRoot
        className="CallsListPanel_root"
        ref={listWrapper}
      >
        {calls.length > 0 ? historyCall : noCalls}
      </ListRoot>
    </Container>
  );
}

export default CallsListPanel;
