import React from 'react';

import classnames from 'classnames';
import PropTypes from 'prop-types';

import debounce from '@ringcentral-integration/commons/lib/debounce';

import InsideModal from '@ringcentral-integration/widgets/components/InsideModal';
import LogNotification from '@ringcentral-integration/widgets/components/LogNotification';
import LogSection from '@ringcentral-integration/widgets/components/LogSection';
import { SearchInput } from '@ringcentral-integration/widgets/components/SearchInput';
import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import i18n from '@ringcentral-integration/widgets/components/CallsListPanel/i18n';
import styles from '@ringcentral-integration/widgets/components/CallsListPanel/styles.scss';

import CallListV2 from '../CallListV2';
import { ActiveCallList } from './ActiveCallList';

const SEARCH_BAR_HEIGHT = 51;

class CallsListPanel extends React.PureComponent {
  _listWrapper: any;
  _mounted: any;
  _root: any;
  constructor(props: any) {
    super(props);
    this.state = {
      contentHeight: 0,
      contentWidth: 0,
    };
    this._mounted = false;
    this._listWrapper = React.createRef();
  }

  override componentDidMount() {
    // @ts-expect-error TS(2339): Property 'adaptive' does not exist on type 'Readon... Remove this comment to see the full error message
    if (this.props.adaptive) {
      this._mounted = true;
      this._calculateContentSize();
      window.addEventListener('resize', this._onResize);
    }
    if (
      !this.hasCalls(this.props) &&
      // @ts-expect-error TS(2339): Property 'onCallsEmpty' does not exist on type 'Re... Remove this comment to see the full error message
      typeof this.props.onCallsEmpty === 'function'
    ) {
      // @ts-expect-error TS(2339): Property 'onCallsEmpty' does not exist on type 'Re... Remove this comment to see the full error message
      this.props.onCallsEmpty();
    }
  }

  override componentWillUnmount() {
    // @ts-expect-error TS(2339): Property 'adaptive' does not exist on type 'Readon... Remove this comment to see the full error message
    if (this.props.adaptive) {
      this._mounted = false;
      window.removeEventListener('resize', this._onResize);
    }
  }

  _onResize = debounce(() => {
    if (this._mounted) {
      this._calculateContentSize();
    }
  }, 300);

  _calculateContentSize() {
    if (
      this._listWrapper &&
      this._listWrapper.current &&
      this._listWrapper.current.getBoundingClientRect
    ) {
      const react = this._listWrapper.current.getBoundingClientRect();
      // @ts-expect-error TS(2339): Property 'onSearchInputChange' does not exist on t... Remove this comment to see the full error message
      const { onSearchInputChange } = this.props;
      this.setState({
        contentHeight:
          react.bottom -
          react.top -
          (onSearchInputChange ? SEARCH_BAR_HEIGHT : 0),
        contentWidth: react.right - react.left,
      });

      return;
    }

    this.setState({
      contentHeight: 0,
      contentWidth: 0,
    });
  }

  override UNSAFE_componentWillReceiveProps(nextProps: any) {
    if (
      this.hasCalls(this.props) &&
      !this.hasCalls(nextProps) &&
      // @ts-expect-error TS(2339): Property 'onCallsEmpty' does not exist on type 'Re... Remove this comment to see the full error message
      typeof this.props.onCallsEmpty === 'function'
    ) {
      // @ts-expect-error TS(2339): Property 'onCallsEmpty' does not exist on type 'Re... Remove this comment to see the full error message
      this.props.onCallsEmpty();
    }
    if (!nextProps.showSpinner && this.props.showSpinner) {
      if (this._mounted) {
        setTimeout(() => {
          this._calculateContentSize();
        }, 0);
      }
    }
  }

  hasCalls(props = this.props) {
    return (
      // @ts-expect-error TS(2339): Property 'activeRingCalls' does not exist on type ... Remove this comment to see the full error message
      props.activeRingCalls.length > 0 ||
      // @ts-expect-error TS(2339): Property 'activeOnHoldCalls' does not exist on typ... Remove this comment to see the full error message
      props.activeOnHoldCalls.length > 0 ||
      // @ts-expect-error TS(2339): Property 'activeCurrentCalls' does not exist on ty... Remove this comment to see the full error message
      props.activeCurrentCalls.length > 0 ||
      // @ts-expect-error TS(2339): Property 'otherDeviceCalls' does not exist on type... Remove this comment to see the full error message
      props.otherDeviceCalls.length > 0 ||
      // @ts-expect-error TS(2339): Property 'calls' does not exist on type 'Readonly<... Remove this comment to see the full error message
      props.calls.length > 0
    );
  }

  renderLogSection() {
    // @ts-expect-error TS(2339): Property 'currentLog' does not exist on type 'Read... Remove this comment to see the full error message
    if (!this.props.currentLog) return null;

    const {
      // @ts-expect-error TS(2339): Property 'formatPhone' does not exist on type 'Rea... Remove this comment to see the full error message
      formatPhone,
      // @ts-expect-error TS(2339): Property 'currentLocale' does not exist on type 'R... Remove this comment to see the full error message
      currentLocale,
      // @ts-expect-error TS(2339): Property 'currentLog' does not exist on type 'Read... Remove this comment to see the full error message
      currentLog,
      // - styles
      // @ts-expect-error TS(2339): Property 'sectionContainerStyles' does not exist o... Remove this comment to see the full error message
      sectionContainerStyles,
      // @ts-expect-error TS(2339): Property 'sectionModalStyles' does not exist on ty... Remove this comment to see the full error message
      sectionModalStyles,
      // - aditional
      // @ts-expect-error TS(2339): Property 'additionalInfo' does not exist on type '... Remove this comment to see the full error message
      additionalInfo,
      // @ts-expect-error TS(2339): Property 'showSaveLogBtn' does not exist on type '... Remove this comment to see the full error message
      showSaveLogBtn,
      // @ts-expect-error TS(2339): Property 'renderEditLogSection' does not exist on ... Remove this comment to see the full error message
      renderEditLogSection,
      // @ts-expect-error TS(2339): Property 'renderSaveLogButton' does not exist on t... Remove this comment to see the full error message
      renderSaveLogButton,
      // @ts-expect-error TS(2339): Property 'onSaveCallLog' does not exist on type 'R... Remove this comment to see the full error message
      onSaveCallLog,
      // @ts-expect-error TS(2339): Property 'onUpdateCallLog' does not exist on type ... Remove this comment to see the full error message
      onUpdateCallLog,
      // @ts-expect-error TS(2339): Property 'onCloseLogSection' does not exist on typ... Remove this comment to see the full error message
      onCloseLogSection,
      // notification
      // @ts-expect-error TS(2339): Property 'logNotification' does not exist on type ... Remove this comment to see the full error message
      logNotification,
      // @ts-expect-error TS(2339): Property 'showNotiLogButton' does not exist on typ... Remove this comment to see the full error message
      showNotiLogButton,
      // @ts-expect-error TS(2339): Property 'onCloseNotification' does not exist on t... Remove this comment to see the full error message
      onCloseNotification,
      // @ts-expect-error TS(2339): Property 'onSaveNotification' does not exist on ty... Remove this comment to see the full error message
      onSaveNotification,
      // @ts-expect-error TS(2339): Property 'onExpandNotification' does not exist on ... Remove this comment to see the full error message
      onExpandNotification,
      // @ts-expect-error TS(2339): Property 'onDiscardNotification' does not exist on... Remove this comment to see the full error message
      onDiscardNotification,
      // @ts-expect-error TS(2339): Property 'notificationContainerStyles' does not ex... Remove this comment to see the full error message
      notificationContainerStyles,
    } = this.props;
    return (
      <div>
        <InsideModal
          title={currentLog.title}
          show={currentLog.showLog}
          onClose={onCloseLogSection}
          clickOutToClose={false}
          containerStyles={sectionContainerStyles}
          modalStyles={sectionModalStyles}
          maskStyle={styles.maskStyle}
        >
          <LogSection
            currentLocale={currentLocale}
            currentLog={currentLog}
            additionalInfo={additionalInfo}
            isInnerMask={
              logNotification && logNotification.notificationIsExpand
            }
            renderEditLogSection={renderEditLogSection}
            renderSaveLogButton={renderSaveLogButton}
            formatPhone={formatPhone}
            onUpdateCallLog={onUpdateCallLog}
            onSaveCallLog={onSaveCallLog}
            showSaveLogBtn={showSaveLogBtn}
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

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  render() {
    const {
      // @ts-expect-error TS(2339): Property 'useNewList' does not exist on type 'Read... Remove this comment to see the full error message
      useNewList,
      // @ts-expect-error TS(2339): Property 'width' does not exist on type 'Readonly<... Remove this comment to see the full error message
      width,
      // @ts-expect-error TS(2339): Property 'height' does not exist on type 'Readonly... Remove this comment to see the full error message
      height,
      // @ts-expect-error TS(2339): Property 'onlyHistory' does not exist on type 'Rea... Remove this comment to see the full error message
      onlyHistory,
      // @ts-expect-error TS(2339): Property 'activeRingCalls' does not exist on type ... Remove this comment to see the full error message
      activeRingCalls,
      // @ts-expect-error TS(2339): Property 'activeOnHoldCalls' does not exist on typ... Remove this comment to see the full error message
      activeOnHoldCalls,
      // @ts-expect-error TS(2339): Property 'activeCurrentCalls' does not exist on ty... Remove this comment to see the full error message
      activeCurrentCalls,
      // @ts-expect-error TS(2339): Property 'otherDeviceCalls' does not exist on type... Remove this comment to see the full error message
      otherDeviceCalls,
      // @ts-expect-error TS(2339): Property 'showSpinner' does not exist on type 'Rea... Remove this comment to see the full error message
      showSpinner,
      // @ts-expect-error TS(2339): Property 'searchInput' does not exist on type 'Rea... Remove this comment to see the full error message
      searchInput,
      // @ts-expect-error TS(2339): Property 'onSearchInputChange' does not exist on t... Remove this comment to see the full error message
      onSearchInputChange,
      // @ts-expect-error TS(2339): Property 'className' does not exist on type 'Reado... Remove this comment to see the full error message
      className,
      // @ts-expect-error TS(2339): Property 'currentLocale' does not exist on type 'R... Remove this comment to see the full error message
      currentLocale,
      // @ts-expect-error TS(2339): Property 'areaCode' does not exist on type 'Readon... Remove this comment to see the full error message
      areaCode,
      // @ts-expect-error TS(2339): Property 'countryCode' does not exist on type 'Rea... Remove this comment to see the full error message
      countryCode,
      // @ts-expect-error TS(2339): Property 'brand' does not exist on type 'Readonly<... Remove this comment to see the full error message
      brand,
      // @ts-expect-error TS(2339): Property 'showContactDisplayPlaceholder' does not ... Remove this comment to see the full error message
      showContactDisplayPlaceholder,
      // @ts-expect-error TS(2339): Property 'formatPhone' does not exist on type 'Rea... Remove this comment to see the full error message
      formatPhone,
      // @ts-expect-error TS(2339): Property 'onClickToSms' does not exist on type 'Re... Remove this comment to see the full error message
      onClickToSms,
      // @ts-expect-error TS(2339): Property 'onCreateContact' does not exist on type ... Remove this comment to see the full error message
      onCreateContact,
      // @ts-expect-error TS(2339): Property 'createEntityTypes' does not exist on typ... Remove this comment to see the full error message
      createEntityTypes,
      // @ts-expect-error TS(2339): Property 'onViewContact' does not exist on type 'R... Remove this comment to see the full error message
      onViewContact,
      // @ts-expect-error TS(2339): Property 'outboundSmsPermission' does not exist on... Remove this comment to see the full error message
      outboundSmsPermission,
      // @ts-expect-error TS(2339): Property 'internalSmsPermission' does not exist on... Remove this comment to see the full error message
      internalSmsPermission,
      // @ts-expect-error TS(2339): Property 'isLoggedContact' does not exist on type ... Remove this comment to see the full error message
      isLoggedContact,
      // @ts-expect-error TS(2339): Property 'onLogCall' does not exist on type 'Reado... Remove this comment to see the full error message
      onLogCall,
      // @ts-expect-error TS(2339): Property 'autoLog' does not exist on type 'Readonl... Remove this comment to see the full error message
      autoLog,
      // @ts-expect-error TS(2339): Property 'loggingMap' does not exist on type 'Read... Remove this comment to see the full error message
      loggingMap,
      // @ts-expect-error TS(2339): Property 'webphoneAnswer' does not exist on type '... Remove this comment to see the full error message
      webphoneAnswer,
      // @ts-expect-error TS(2339): Property 'webphoneReject' does not exist on type '... Remove this comment to see the full error message
      webphoneReject,
      // @ts-expect-error TS(2339): Property 'webphoneHangup' does not exist on type '... Remove this comment to see the full error message
      webphoneHangup,
      // @ts-expect-error TS(2339): Property 'webphoneResume' does not exist on type '... Remove this comment to see the full error message
      webphoneResume,
      // @ts-expect-error TS(2339): Property 'enableContactFallback' does not exist on... Remove this comment to see the full error message
      enableContactFallback,
      // @ts-expect-error TS(2339): Property 'webphoneToVoicemail' does not exist on t... Remove this comment to see the full error message
      webphoneToVoicemail,
      // @ts-expect-error TS(2339): Property 'sourceIcons' does not exist on type 'Rea... Remove this comment to see the full error message
      sourceIcons,
      // @ts-expect-error TS(2339): Property 'phoneTypeRenderer' does not exist on typ... Remove this comment to see the full error message
      phoneTypeRenderer,
      // @ts-expect-error TS(2339): Property 'phoneSourceNameRenderer' does not exist ... Remove this comment to see the full error message
      phoneSourceNameRenderer,
      // @ts-expect-error TS(2339): Property 'onClickToDial' does not exist on type 'R... Remove this comment to see the full error message
      onClickToDial,
      // @ts-expect-error TS(2339): Property 'disableLinks' does not exist on type 'Re... Remove this comment to see the full error message
      disableLinks,
      // @ts-expect-error TS(2339): Property 'disableClickToDial' does not exist on ty... Remove this comment to see the full error message
      disableClickToDial,
      // @ts-expect-error TS(2339): Property 'dateTimeFormatter' does not exist on typ... Remove this comment to see the full error message
      dateTimeFormatter,
      // @ts-expect-error TS(2339): Property 'calls' does not exist on type 'Readonly<... Remove this comment to see the full error message
      calls,
      // @ts-expect-error TS(2339): Property 'active' does not exist on type 'Readonly... Remove this comment to see the full error message
      active,
      // @ts-expect-error TS(2339): Property 'renderContactName' does not exist on typ... Remove this comment to see the full error message
      renderContactName,
      // @ts-expect-error TS(2339): Property 'renderSubContactName' does not exist on ... Remove this comment to see the full error message
      renderSubContactName,
      // @ts-expect-error TS(2339): Property 'renderExtraButton' does not exist on typ... Remove this comment to see the full error message
      renderExtraButton,
      // @ts-expect-error TS(2339): Property 'contactDisplayStyle' does not exist on t... Remove this comment to see the full error message
      contactDisplayStyle,
      // @ts-expect-error TS(2339): Property 'activeContactDisplayStyle' does not exis... Remove this comment to see the full error message
      activeContactDisplayStyle,
      // @ts-expect-error TS(2339): Property 'currentLog' does not exist on type 'Read... Remove this comment to see the full error message
      currentLog,
      // @ts-expect-error TS(2339): Property 'additionalInfo' does not exist on type '... Remove this comment to see the full error message
      additionalInfo,
      // @ts-expect-error TS(2339): Property 'onCloseLogSection' does not exist on typ... Remove this comment to see the full error message
      onCloseLogSection,
      // @ts-expect-error TS(2339): Property 'onUpdateCallLog' does not exist on type ... Remove this comment to see the full error message
      onUpdateCallLog,
      // @ts-expect-error TS(2339): Property 'onSaveCallLog' does not exist on type 'R... Remove this comment to see the full error message
      onSaveCallLog,
      // @ts-expect-error TS(2339): Property 'renderEditLogSection' does not exist on ... Remove this comment to see the full error message
      renderEditLogSection,
      // @ts-expect-error TS(2339): Property 'renderSaveLogButton' does not exist on t... Remove this comment to see the full error message
      renderSaveLogButton,
      // @ts-expect-error TS(2339): Property 'logNotification' does not exist on type ... Remove this comment to see the full error message
      logNotification,
      // @ts-expect-error TS(2339): Property 'onCloseNotification' does not exist on t... Remove this comment to see the full error message
      onCloseNotification,
      // @ts-expect-error TS(2339): Property 'onDiscardNotification' does not exist on... Remove this comment to see the full error message
      onDiscardNotification,
      // @ts-expect-error TS(2339): Property 'onSaveNotification' does not exist on ty... Remove this comment to see the full error message
      onSaveNotification,
      // @ts-expect-error TS(2339): Property 'onExpandNotification' does not exist on ... Remove this comment to see the full error message
      onExpandNotification,
      // @ts-expect-error TS(2339): Property 'showSaveLogBtn' does not exist on type '... Remove this comment to see the full error message
      showSaveLogBtn,
      // @ts-expect-error TS(2339): Property 'showNotiLogButton' does not exist on typ... Remove this comment to see the full error message
      showNotiLogButton,
      // @ts-expect-error TS(2339): Property 'sectionContainerStyles' does not exist o... Remove this comment to see the full error message
      sectionContainerStyles,
      // @ts-expect-error TS(2339): Property 'sectionModalStyles' does not exist on ty... Remove this comment to see the full error message
      sectionModalStyles,
      // @ts-expect-error TS(2339): Property 'notificationContainerStyles' does not ex... Remove this comment to see the full error message
      notificationContainerStyles,
      // @ts-expect-error TS(2339): Property 'externalViewEntity' does not exist on ty... Remove this comment to see the full error message
      externalViewEntity,
      // @ts-expect-error TS(2339): Property 'externalHasEntity' does not exist on typ... Remove this comment to see the full error message
      externalHasEntity,
      // @ts-expect-error TS(2339): Property 'readTextPermission' does not exist on ty... Remove this comment to see the full error message
      readTextPermission,
      children,
      // @ts-expect-error TS(2339): Property 'adaptive' does not exist on type 'Readon... Remove this comment to see the full error message
      adaptive,
      // @ts-expect-error TS(2339): Property 'showChooseEntityModal' does not exist on... Remove this comment to see the full error message
      showChooseEntityModal,
      // @ts-expect-error TS(2339): Property 'enableCDC' does not exist on type 'Reado... Remove this comment to see the full error message
      enableCDC,
      // @ts-expect-error TS(2339): Property 'maxExtensionLength' does not exist on ty... Remove this comment to see the full error message
      maxExtensionLength,
      showLogButton,
      logButtonTitle,
    } = this.props;

    // @ts-expect-error TS(2339): Property 'contentWidth' does not exist on type 'Re... Remove this comment to see the full error message
    const { contentWidth, contentHeight } = this.state;

    if (showSpinner) {
      return <SpinnerOverlay />;
    }
    const isShowMessageIcon = readTextPermission && !!onClickToSms;
    const callsListView = (
      // @ts-expect-error TS(2741): Property 'formatPhone' is missing in type '{ width... Remove this comment to see the full error message
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
      />
    );

    const search = onSearchInputChange ? (
      <div className={classnames(styles.searchContainer)}>
        <SearchInput
          key="100"
          className={styles.searchInput}
          value={searchInput}
          onChange={onSearchInputChange}
          placeholder={i18n.getString('searchPlaceholder', currentLocale)}
          disabled={disableLinks}
        />
      </div>
    ) : null;

    const getCallList = (calls: any, title: any) => (
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
        createEntityTypes={createEntityTypes}
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
        webphoneToVoicemail={webphoneToVoicemail}
        enableContactFallback={enableContactFallback}
        sourceIcons={sourceIcons}
        phoneTypeRenderer={phoneTypeRenderer}
        phoneSourceNameRenderer={phoneSourceNameRenderer}
        disableLinks={disableLinks}
        renderContactName={renderContactName}
        renderSubContactName={renderSubContactName}
        renderExtraButton={renderExtraButton}
        contactDisplayStyle={activeContactDisplayStyle}
        externalViewEntity={externalViewEntity}
        externalHasEntity={externalHasEntity}
        readTextPermission={isShowMessageIcon}
      />
    );

    const historyCall = showSpinner ? (
      <SpinnerOverlay />
    ) : (
      <div className={classnames(styles.list, className)}>
        {!onlyHistory && (
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
      <div
        className={classnames(
          styles.container,
          onSearchInputChange ? styles.containerWithSearch : null,
        )}
        data-sign="callsListPanel"
        ref={this._listWrapper}
      >
        {children}
        {search}
        <div
          className={classnames(
            styles.root,
            currentLog && currentLog.showLog ? styles.hiddenScroll : '',
            className,
          )}
          ref={this._root}
        >
          {onlyHistory ||
            getCallList(
              activeRingCalls,
              i18n.getString('ringCall', currentLocale),
            )}
          {onlyHistory ||
            getCallList(
              activeCurrentCalls,
              i18n.getString('currentCall', currentLocale),
            )}
          {onlyHistory ||
            getCallList(
              activeOnHoldCalls,
              i18n.getString('onHoldCall', currentLocale),
            )}
          {onlyHistory ||
            getCallList(
              otherDeviceCalls,
              i18n.getString('otherDeviceCall', currentLocale),
            )}
          {calls.length > 0 ? historyCall : noCalls}
        </div>
        {this.renderLogSection()}
      </div>
    );
  }
}

// @ts-expect-error TS(2339): Property 'propTypes' does not exist on type 'typeo... Remove this comment to see the full error message
CallsListPanel.propTypes = {
  useNewList: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  currentLocale: PropTypes.string.isRequired,
  className: PropTypes.string,
  activeRingCalls: PropTypes.array.isRequired,
  activeOnHoldCalls: PropTypes.array.isRequired,
  activeCurrentCalls: PropTypes.array.isRequired,
  otherDeviceCalls: PropTypes.array.isRequired,
  onSearchInputChange: PropTypes.func,
  searchInput: PropTypes.string,
  showSpinner: PropTypes.bool.isRequired,
  areaCode: PropTypes.string.isRequired,
  countryCode: PropTypes.string.isRequired,
  brand: PropTypes.string,
  showContactDisplayPlaceholder: PropTypes.bool,
  formatPhone: PropTypes.func.isRequired,
  onClickToSms: PropTypes.func,
  onCreateContact: PropTypes.func,
  createEntityTypes: PropTypes.array,
  outboundSmsPermission: PropTypes.bool,
  internalSmsPermission: PropTypes.bool,
  isLoggedContact: PropTypes.func,
  onLogCall: PropTypes.func,
  webphoneAnswer: PropTypes.func,
  webphoneReject: PropTypes.func,
  webphoneHangup: PropTypes.func,
  webphoneResume: PropTypes.func,
  webphoneToVoicemail: PropTypes.func,
  autoLog: PropTypes.bool,
  onViewContact: PropTypes.func,
  enableContactFallback: PropTypes.bool,
  loggingMap: PropTypes.object,
  onCallsEmpty: PropTypes.func,
  sourceIcons: PropTypes.object,
  phoneTypeRenderer: PropTypes.func,
  phoneSourceNameRenderer: PropTypes.func,
  calls: PropTypes.arrayOf(PropTypes.any).isRequired,
  onClickToDial: PropTypes.func,
  disableLinks: PropTypes.bool.isRequired,
  disableClickToDial: PropTypes.bool,
  dateTimeFormatter: PropTypes.func.isRequired,
  active: PropTypes.bool,
  renderContactName: PropTypes.func,
  renderSubContactName: PropTypes.func,
  renderExtraButton: PropTypes.func,
  contactDisplayStyle: PropTypes.string,
  activeContactDisplayStyle: PropTypes.string,
  currentLog: PropTypes.object,
  additionalInfo: PropTypes.object,
  onCloseLogSection: PropTypes.func,
  onUpdateCallLog: PropTypes.func,
  onSaveCallLog: PropTypes.func,
  renderEditLogSection: PropTypes.func,
  renderSaveLogButton: PropTypes.func,
  logNotification: PropTypes.object,
  onCloseNotification: PropTypes.func,
  onDiscardNotification: PropTypes.func,
  onSaveNotification: PropTypes.func,
  onExpandNotification: PropTypes.func,
  showSaveLogBtn: PropTypes.bool,
  showNotiLogButton: PropTypes.bool,
  sectionContainerStyles: PropTypes.string,
  sectionModalStyles: PropTypes.string,
  notificationContainerStyles: PropTypes.string,
  externalViewEntity: PropTypes.func,
  externalHasEntity: PropTypes.func,
  readTextPermission: PropTypes.bool,
  children: PropTypes.node,
  onlyHistory: PropTypes.bool,
  adaptive: PropTypes.bool,
  showChooseEntityModal: PropTypes.bool,
  enableCDC: PropTypes.bool,
  showLogButton: PropTypes.bool,
  logButtonTitle: PropTypes.string,
};

// @ts-expect-error TS(2339): Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
CallsListPanel.defaultProps = {
  adaptive: false,
  useNewList: false,
  width: 300,
  height: 315,
  className: undefined,
  brand: 'RingCentral',
  showContactDisplayPlaceholder: true,
  onCreateContact: undefined,
  createEntityTypes: undefined,
  onClickToSms: undefined,
  outboundSmsPermission: true,
  internalSmsPermission: true,
  isLoggedContact: undefined,
  onSearchInputChange: undefined,
  searchInput: '',
  onLogCall: undefined,
  onViewContact: undefined,
  webphoneAnswer: undefined,
  webphoneReject: undefined,
  webphoneHangup: undefined,
  webphoneResume: undefined,
  webphoneToVoicemail: undefined,
  enableContactFallback: undefined,
  loggingMap: {},
  autoLog: false,
  onCallsEmpty: undefined,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  onClickToDial: undefined,
  disableClickToDial: false,
  active: false,
  renderContactName: undefined,
  renderSubContactName: undefined,
  renderExtraButton: undefined,
  contactDisplayStyle: styles.contactDisplay,
  activeContactDisplayStyle: styles.activeContactDisplay,
  currentLog: undefined,
  additionalInfo: undefined,
  onCloseLogSection: undefined,
  onUpdateCallLog: undefined,
  onSaveCallLog: undefined,
  renderEditLogSection: undefined,
  renderSaveLogButton: undefined,
  logNotification: undefined,
  onCloseNotification: undefined,
  onDiscardNotification: undefined,
  onSaveNotification: undefined,
  onExpandNotification: undefined,
  showSaveLogBtn: true,
  showNotiLogButton: true,
  sectionContainerStyles: undefined,
  sectionModalStyles: undefined,
  notificationContainerStyles: undefined,
  externalViewEntity: undefined,
  externalHasEntity: undefined,
  readTextPermission: true,
  children: null,
  onlyHistory: false,
  showChooseEntityModal: true,
  enableCDC: false,
};

export default CallsListPanel;
