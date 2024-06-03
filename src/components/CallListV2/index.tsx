import React, { useRef } from 'react';

import { Virtuoso } from '@ringcentral/juno';

import { CallItem } from '../CallItem';

type CallListV2Props = {
  currentSiteCode?: string;
  isMultipleSiteEnabled?: boolean;
  className?: string;
  width: number;
  height: number;
  brand: string;
  currentLocale: string;
  calls: any[];
  active?: boolean;
  areaCode: string;
  countryCode: string;
  onViewContact?: (...args: any[]) => any;
  onCreateContact?: (...args: any[]) => any;
  onRefreshContact?: (...args: any[]) => any;
  createEntityTypes?: any[];
  onLogCall?: (...args: any[]) => any;
  onClickToDial?: (...args: any[]) => any;
  onClickToSms?: (...args: any[]) => any;
  isLoggedContact?: (...args: any[]) => any;
  loggingMap?: any;
  disableLinks?: boolean;
  disableCallButton?: boolean;
  disableClickToDial?: boolean;
  outboundSmsPermission?: boolean;
  internalSmsPermission?: boolean;
  dateTimeFormatter: (...args: any[]) => any;
  webphoneAnswer?: (...args: any[]) => any;
  webphoneReject?: (...args: any[]) => any;
  webphoneHangup?: (...args: any[]) => any;
  webphoneResume?: (...args: any[]) => any;
  enableContactFallback?: boolean;
  autoLog?: boolean;
  showContactDisplayPlaceholder?: boolean;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  renderContactName?: (...args: any[]) => any;
  renderSubContactName?: (...args: any[]) => any;
  renderExtraButton?: (...args: any[]) => any;
  contactDisplayStyle?: string;
  externalViewEntity?: (...args: any[]) => any;
  externalHasEntity?: (...args: any[]) => any;
  readTextPermission?: boolean;
  rowHeight?: number;
  extendedRowHeight?: number;
  showChooseEntityModal?: boolean;
  enableCDC?: boolean;
  maxExtensionNumberLength: number;
  formatPhone: (phoneNumber: string) => string | undefined;
  showLogButton: boolean;
  logButtonTitle: string;
  isRecording?: boolean;
  onViewSmartNote?: (...args: any[]) => any;
  onViewCalls?: (...args: any[]) => any;
};

export function CallListV2({
  className,
  width,
  height,
  brand,
  currentLocale,
  calls,
  areaCode,
  countryCode,
  onViewContact,
  onCreateContact,
  onRefreshContact,
  createEntityTypes,
  onLogCall,
  onClickToDial,
  onClickToSms,
  isLoggedContact,
  disableLinks,
  disableCallButton,
  disableClickToDial,
  outboundSmsPermission,
  internalSmsPermission,
  active,
  dateTimeFormatter,
  loggingMap,
  webphoneAnswer,
  webphoneReject,
  webphoneHangup,
  webphoneResume,
  enableContactFallback,
  autoLog,
  showContactDisplayPlaceholder,
  sourceIcons,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  renderContactName,
  renderSubContactName,
  renderExtraButton,
  contactDisplayStyle,
  externalViewEntity,
  externalHasEntity,
  readTextPermission,
  currentSiteCode,
  isMultipleSiteEnabled,
  showChooseEntityModal,
  enableCDC,
  maxExtensionNumberLength,
  formatPhone,
  showLogButton,
  logButtonTitle,
  isRecording,
  onViewSmartNote,
  onViewCalls,
}: CallListV2Props) {
  const listRef = useRef(null);

  return (
    <Virtuoso
      className={className}
      style={{
        height: height,
        width: width,
      }}
      rangeChanged={(data) => {
        if (typeof onViewCalls !== 'function') {
          return;
        }
        onViewCalls(calls.slice(data.startIndex, data.endIndex));
      }}
      ref={listRef}
      totalCount={calls.length}
      data={calls}
      itemContent={(index, call) => {
        return (
          <CallItem
            formatPhone={formatPhone}
            key={call.id}
            renderIndex={index}
            call={call}
            currentLocale={currentLocale}
            currentSiteCode={currentSiteCode}
            isMultipleSiteEnabled={isMultipleSiteEnabled}
            brand={brand}
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
            disableCallButton={disableCallButton}
            disableClickToDial={disableClickToDial}
            outboundSmsPermission={outboundSmsPermission}
            internalSmsPermission={internalSmsPermission}
            active={!!active}
            dateTimeFormatter={dateTimeFormatter}
            isLogging={!!loggingMap[call.sessionId]}
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
            readTextPermission={readTextPermission}
            // disable animation when rendered with react-virtualized
            withAnimation={false}
            showChooseEntityModal={showChooseEntityModal}
            enableCDC={enableCDC}
            maxExtensionNumberLength={maxExtensionNumberLength}
            showLogButton={showLogButton}
            logButtonTitle={logButtonTitle}
            isRecording={isRecording}
            onViewSmartNote={onViewSmartNote}
          />
        );
      }}
    />
  );
}

export default CallListV2;
