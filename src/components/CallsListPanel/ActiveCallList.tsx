import React from 'react';

import classnames from 'classnames';
import PropTypes from 'prop-types';

import ActiveCallItem from '@ringcentral-integration/widgets/components/ActiveCallItem';
import styles from '@ringcentral-integration/widgets/components/CallsListPanel/styles.scss';

export const ActiveCallList = ({
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
  createEntityTypes,
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
  enableContactFallback,
  title,
  sourceIcons,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  disableLinks,
  renderContactName,
  renderSubContactName,
  renderExtraButton,
  contactDisplayStyle,
  externalViewEntity,
  externalHasEntity,
  readTextPermission,
}: any) => {
  if (calls.length === 0) {
    return null;
  }
  return (
    <div className={classnames(styles.list, className)} data-sign="callList">
      <div className={styles.listTitle} data-sign="callListTitle">
        {title}
      </div>
      {calls.map((call: any) => (
        <ActiveCallItem
          // @ts-expect-error TS(2322): Type '{ call: any; key: any; currentLocale: any; a... Remove this comment to see the full error message
          call={call}
          key={call.id}
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
          createEntityTypes={createEntityTypes}
          onCreateContact={onCreateContact}
          loggingMap={loggingMap}
          webphoneAnswer={webphoneAnswer}
          webphoneReject={webphoneReject}
          webphoneHangup={webphoneHangup}
          webphoneResume={webphoneResume}
          webphoneToVoicemail={webphoneToVoicemail}
          enableContactFallback={enableContactFallback}
          autoLog={autoLog}
          sourceIcons={sourceIcons}
          phoneTypeRenderer={phoneTypeRenderer}
          phoneSourceNameRenderer={phoneSourceNameRenderer}
          disableLinks={disableLinks}
          renderContactName={renderContactName}
          renderSubContactName={renderSubContactName}
          renderExtraButton={renderExtraButton}
          contactDisplayStyle={contactDisplayStyle}
          externalViewEntity={externalViewEntity}
          externalHasEntity={externalHasEntity}
          readTextPermission={readTextPermission}
        />
      ))}
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
  createEntityTypes: PropTypes.array,
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
  enableContactFallback: PropTypes.bool,
  autoLog: PropTypes.bool,
  sourceIcons: PropTypes.object,
  phoneTypeRenderer: PropTypes.func,
  phoneSourceNameRenderer: PropTypes.func,
  disableLinks: PropTypes.bool,
  renderContactName: PropTypes.func,
  renderSubContactName: PropTypes.func,
  renderExtraButton: PropTypes.func,
  contactDisplayStyle: PropTypes.string,
  externalViewEntity: PropTypes.func,
  externalHasEntity: PropTypes.func,
  readTextPermission: PropTypes.bool,
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
  createEntityTypes: undefined,
  webphoneToVoicemail: undefined,
  sourceIcons: undefined,
  phoneTypeRenderer: undefined,
  phoneSourceNameRenderer: undefined,
  disableLinks: false,
  renderContactName: undefined,
  renderSubContactName: undefined,
  renderExtraButton: undefined,
  contactDisplayStyle: undefined,
  externalViewEntity: undefined,
  externalHasEntity: undefined,
  readTextPermission: true,
};