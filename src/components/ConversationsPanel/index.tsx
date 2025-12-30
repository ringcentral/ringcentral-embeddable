import type { FC } from 'react';
import React, { useEffect, useState, useCallback } from 'react';

import { styled, palette2 } from '@ringcentral/juno/foundation';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';

import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import i18n from '@ringcentral-integration/widgets/components/ConversationsPanel/i18n';
import NoMessage from '@ringcentral-integration/widgets/components/ConversationsPanel/widgets/NoMessage';

import type { ConversationListProps } from '../ConversationList';
import ConversationList from '../ConversationList';
import { SubTabs } from '../SubTabs';
import { SearchAndFilter } from '../SearchAndFilter';
import { AssignDialog } from '../AssignDialog';
import type { SMSRecipient } from '../../modules/MessageThreads/MessageThreads.interface';

type ConversationsPanelProps = {
  currentSiteCode?: string;
  isMultipleSiteEnabled?: boolean;
  currentLocale: string;
  showSpinner?: boolean;
  showTitle?: boolean;
  contactPlaceholder?: string;
  showContactDisplayPlaceholder?: boolean;
  sourceIcons?: object;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  showComposeText?: boolean;
  goToComposeText: (...args: any[]) => any;
  typeFilter: string;
  updateTypeFilter: (...args: any[]) => any;
  showConversationDetail: (...args: any[]) => any;
  textUnreadCounts: number;
  voiceUnreadCounts: number;
  faxUnreadCounts: number;
  showGroupNumberName?: boolean;
  onClickToDial?: (...args: any[]) => any;
  onClickToSms?: (...args: any[]) => any;
  markMessage: (...args: any[]) => any;
  readMessage: (...args: any[]) => any;
  readTextPermission?: boolean;
  outboundSmsPermission?: boolean;
  internalSmsPermission?: boolean;
  readVoicemailPermission?: boolean;
  readFaxPermission?: boolean;
  onSearchInputChange?: (...args: any[]) => any;
  searchInput?: string;
  perPage?: number;
  disableLinks?: boolean;
  disableCallButton?: boolean;
  conversations: any[];
  brand: string;
  dateTimeFormatter?: (...args: any[]) => any;
  areaCode: string;
  countryCode: string;
  onLogConversation?: (...args: any[]) => any;
  onViewContact?: (...args: any[]) => any;
  onCreateContact?: (...args: any[]) => any;
  onRefreshContact?: (...args: any[]) => any;
  createEntityTypes?: any[];
  disableClickToDial?: boolean;
  unmarkMessage: (...args: any[]) => any;
  autoLog?: boolean;
  enableContactFallback?: boolean;
  deleteMessage?: (...args: any[]) => any;
  composeTextPermission?: boolean;
  previewFaxMessages?: (...args: any[]) => any;
  loadNextPage: (...args: any[]) => any;
  loadingNextPage?: boolean;
  onUnmount?: (...args: any[]) => any;
  renderSearchTip?: (...args: any[]) => any;
  renderNoMessage?: (...args: any[]) => any;
  onFaxDownload?: (...args: any[]) => any;
  showChooseEntityModal?: boolean;
  shouldLogSelectRecord?: boolean;
  onSelectContact?: (...args: any[]) => any;
  renderContactList?: (...args: any[]) => any;
  dropdownClassName?: string;
  enableCDC?: boolean;
  maxExtensionNumberLength: number;
  renderContactName?: (...args: any[]) => any;
  externalHasEntity: (...args: any[]) => boolean;
  externalViewEntity: (...args: any[]) => void;
  showLogButton?: boolean;
  logButtonTitle?: string;
  searchFilter: string;
  onSearchFilterChange: (type: string) => void;
  openMessageDetails: (id: number) => void;
  rcAccessToken?: string;
  ownerFilter?: string;
  onOwnerFilterChange?: (filter: string) => void;
  ownerTabs: {
    label: string;
    value: string;
    unreadCounts: number;
  }[];
  additionalActions?: any[];
  onClickAdditionalAction?: (buttonId: string) => void;
  onAssignThread?: (conversation: any, assignee: { extensionId: string } | null) => Promise<void>;
  onResolveThread?: (conversation: any) => void;
  getSMSRecipients?: (conversation: any) => Promise<SMSRecipient[]>;
  threadBusy?: boolean;
} & Omit<ConversationListProps, 'conversation'>;

const StyledContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: ${palette2('neutral', 'b01')};
`;

const StyledContentArea = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const StyledConversationListArea = styled.div`
  flex: 1;
  overflow: hidden;
`;

export const ConversationsPanel: FC<ConversationsPanelProps> = (props) => {
  const {
    currentSiteCode = '',
    isMultipleSiteEnabled = false,
    showSpinner = false,
    contactPlaceholder = '',
    showContactDisplayPlaceholder = true,
    typeFilter = messageTypes.all,
    showGroupNumberName = false,
    // readTextPermission = true,
    outboundSmsPermission = true,
    internalSmsPermission = true,
    // readVoicemailPermission = true,
    // readFaxPermission = true,
    searchInput = '',
    perPage = 20,
    disableLinks = false,
    disableCallButton = false,
    disableClickToDial = false,
    autoLog = false,
    loadingNextPage = false,
    showChooseEntityModal = true,
    shouldLogSelectRecord = false,
    dropdownClassName,
    enableCDC = false,
    onSearchInputChange,
    currentLocale,
    conversations,
    brand,
    showConversationDetail,
    readMessage,
    markMessage,
    dateTimeFormatter,
    sourceIcons,
    phoneTypeRenderer,
    phoneSourceNameRenderer,
    areaCode,
    countryCode,
    onLogConversation,
    onViewContact,
    onCreateContact,
    onRefreshContact,
    createEntityTypes,
    onClickToDial,
    onClickToSms,
    unmarkMessage,
    enableContactFallback,
    deleteMessage,
    previewFaxMessages,
    loadNextPage,
    updateTypeFilter,
    renderNoMessage,
    onFaxDownload,
    onSelectContact,
    renderContactList,
    maxExtensionNumberLength,
    renderContactName,
    externalHasEntity,
    externalViewEntity,
    formatPhone,
    onUnmount,
    // faxUnreadCounts,
    // textUnreadCounts,
    // voiceUnreadCounts,
    showLogButton = false,
    logButtonTitle = '',
    searchFilter,
    onSearchFilterChange,
    searchFilterList,
    openMessageDetails,
    rcAccessToken,
    ownerFilter,
    ownerTabs = [],
    onOwnerFilterChange,
    additionalActions,
    onClickAdditionalAction,
    onAssignThread,
    onResolveThread,
    getSMSRecipients,
    threadBusy = false,
  } = props;

  const [assigningConversation, setAssigningConversation] = useState<any>(null);

  useEffect(() => {
    return onUnmount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateTypeFilter(typeFilter);
  }, [typeFilter]);

  const handleOpenAssignDialog = useCallback((conversation: any) => {
    setAssigningConversation(conversation);
  }, []);

  const handleAssign = useCallback(async (assignee: { extensionId: string } | null) => {
    if (assigningConversation && onAssignThread) {
      await onAssignThread(assigningConversation, assignee);
    }
    setAssigningConversation(null);
  }, [assigningConversation, onAssignThread]);

  const handleCancelAssign = useCallback(() => {
    setAssigningConversation(null);
  }, []);

  const handleUnassign = useCallback(async (conversation: any) => {
    if (onAssignThread) {
      await onAssignThread(conversation, null);
    }
  }, [onAssignThread]);

  const handleGetSMSRecipients = useCallback(() => {
    if (assigningConversation && getSMSRecipients) {
      return getSMSRecipients(assigningConversation);
    }
    return Promise.resolve([]);
  }, [assigningConversation, getSMSRecipients]);

  const placeholder =
    onSearchInputChange && searchInput.length > 0
      ? i18n.getString('noSearchResults', currentLocale)
      : i18n.getString('noMessages', currentLocale);

  return (
    <StyledContainer data-sign="conversationsPanel">
      {showSpinner ? (
        <SpinnerOverlay />
      ) : (
        <StyledContentArea
          data-sign="messageList"
        >
          {ownerTabs && ownerTabs.length > 0 && (
            <SubTabs
              tabs={ownerTabs}
              value={ownerFilter}
              onChange={onOwnerFilterChange}
            />
          )}
          <SearchAndFilter
            searchInput={searchInput}
            onSearchInputChange={onSearchInputChange}
            placeholder={i18n.getString('search', currentLocale)}
            disableLinks={disableLinks}
            type={searchFilter}
            onTypeChange={onSearchFilterChange}
            typeList={searchFilterList}
            currentLocale={currentLocale}
            showTypeFilter
          />
          <StyledConversationListArea>
            {conversations.length ? (
              <ConversationList
                formatPhone={formatPhone}
                currentLocale={currentLocale}
                currentSiteCode={currentSiteCode}
                isMultipleSiteEnabled={isMultipleSiteEnabled}
                perPage={perPage}
                disableLinks={disableLinks}
                disableCallButton={disableCallButton}
                conversations={conversations}
                brand={brand}
                showConversationDetail={showConversationDetail}
                readMessage={readMessage}
                markMessage={markMessage}
                dateTimeFormatter={dateTimeFormatter}
                contactPlaceholder={contactPlaceholder}
                showContactDisplayPlaceholder={showContactDisplayPlaceholder}
                sourceIcons={sourceIcons}
                phoneTypeRenderer={phoneTypeRenderer}
                phoneSourceNameRenderer={phoneSourceNameRenderer}
                showGroupNumberName={showGroupNumberName}
                placeholder={placeholder}
                areaCode={areaCode}
                countryCode={countryCode}
                onLogConversation={onLogConversation}
                onViewContact={onViewContact}
                onCreateContact={onCreateContact}
                onRefreshContact={onRefreshContact}
                createEntityTypes={createEntityTypes}
                onClickToDial={onClickToDial}
                onClickToSms={onClickToSms}
                disableClickToDial={disableClickToDial}
                unmarkMessage={unmarkMessage}
                autoLog={autoLog}
                enableContactFallback={enableContactFallback}
                deleteMessage={deleteMessage}
                previewFaxMessages={previewFaxMessages}
                loadNextPage={loadNextPage}
                loadingNextPage={loadingNextPage}
                typeFilter={typeFilter}
                outboundSmsPermission={outboundSmsPermission}
                internalSmsPermission={internalSmsPermission}
                onFaxDownload={onFaxDownload}
                showChooseEntityModal={showChooseEntityModal}
                shouldLogSelectRecord={shouldLogSelectRecord}
                onSelectContact={onSelectContact}
                renderContactList={renderContactList}
                dropdownClassName={dropdownClassName}
                enableCDC={enableCDC}
                maxExtensionNumberLength={maxExtensionNumberLength}
                renderContactName={renderContactName}
                externalHasEntity={externalHasEntity}
                externalViewEntity={externalViewEntity}
                showLogButton={showLogButton}
                logButtonTitle={logButtonTitle}
                updateTypeFilter={updateTypeFilter}
                openMessageDetails={openMessageDetails}
                rcAccessToken={rcAccessToken}
                additionalActions={additionalActions}
                onClickAdditionalAction={onClickAdditionalAction}
                onAssignThread={handleOpenAssignDialog}
                onUnassignThread={handleUnassign}
                onResolveThread={onResolveThread}
                threadBusy={threadBusy}
              />
            ) : (
              !loadingNextPage &&
              (renderNoMessage?.() ?? <NoMessage placeholder={placeholder} />)
            )}
          </StyledConversationListArea>
        </StyledContentArea>
      )}
      <AssignDialog
        open={!!assigningConversation}
        getSMSRecipients={handleGetSMSRecipients}
        currentAssignee={assigningConversation?.assignee}
        onAssign={handleAssign}
        onCancel={handleCancelAssign}
      />
    </StyledContainer>
  );
};
