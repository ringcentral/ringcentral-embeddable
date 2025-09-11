import React, { useRef } from 'react';

import { Virtuoso, RcButton, styled, } from '@ringcentral/juno';

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
  hideEditLogButton: boolean;
  logButtonTitle: string;
  isRecording?: boolean;
  onViewSmartNote?: (...args: any[]) => any;
  onViewCalls?: (...args: any[]) => any;
  aiNotedCallMapping?: any;
  hasMoreCalls: boolean;
  loadMoreCalls: (...args: any[]) => any;
  loadingMoreCalls: boolean;
  onViewCallDetails: (...args: any[]) => any;
  updateSessionMatchedContact: (...args: any[]) => any;
  additionalActions: any[];
  onClickAdditionalAction: (...args: any[]) => any;
};

const LoadMoreButton = styled(RcButton)`
  &.RcButton-text {
    padding: 14px 16px;
    font-size: 0.875rem;
  }
`;

const ListFooter = ({
  context: { loadMore, loading, hasMore }
}) => {
  if (!hasMore) {
    return null;
  }
  return (
    <LoadMoreButton
      fullWidth
      variant='plain'
      disabled={loading}
      onClick={loadMore}
    >
      {
        loading ? 'Loading...' : 'Load more'
      }
    </LoadMoreButton>
  );
}

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
  hideEditLogButton,
  logButtonTitle,
  isRecording,
  onViewSmartNote,
  onViewCalls,
  aiNotedCallMapping,
  hasMoreCalls,
  loadMoreCalls,
  loadingMoreCalls,
  onViewCallDetails,
  updateSessionMatchedContact,
  additionalActions,
  onClickAdditionalAction,
}: CallListV2Props) {
  const listRef = useRef(null);

  return (
    <Virtuoso
      className={className}
      style={{
        height: height,
        width: '100%',
      }}
      components={{
        Footer: ListFooter,
      }}
      context={{
        loading: loadingMoreCalls,
        hasMore: hasMoreCalls,
        loadMore: loadMoreCalls,
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
            enableCDC={enableCDC}
            maxExtensionNumberLength={maxExtensionNumberLength}
            showLogButton={showLogButton}
            hideEditLogButton={hideEditLogButton}
            logButtonTitle={logButtonTitle}
            isRecording={isRecording}
            onViewSmartNote={onViewSmartNote}
            aiNoted={aiNotedCallMapping[call.telephonySessionId]}
            onViewCallDetails={onViewCallDetails}
            updateSessionMatchedContact={updateSessionMatchedContact}
            additionalActions={additionalActions}
            onClickAdditionalAction={onClickAdditionalAction}
          />
        );
      }}
    />
  );
}

export default CallListV2;
