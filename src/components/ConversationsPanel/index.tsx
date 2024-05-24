import type { FC } from 'react';
import React, { useEffect } from 'react';

import { styled, palette2 } from '@ringcentral/juno/foundation';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';

import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import i18n from '@ringcentral-integration/widgets/components/ConversationsPanel/i18n';
import NoMessage from '@ringcentral-integration/widgets/components/ConversationsPanel/widgets/NoMessage';

import type { ConversationListProps } from '../ConversationList';
import ConversationList from '../ConversationList';
import { SearchLine } from '../SearchLine';

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
  } = props;

  useEffect(() => {
    return onUnmount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateTypeFilter(typeFilter);
  }, [typeFilter]);

  const placeholder =
    onSearchInputChange && searchInput.length > 0
      ? i18n.getString('noSearchResults', currentLocale)
      : i18n.getString('noMessages', currentLocale);

  return (
    <StyledContainer data-sign="ConversationsPanel">
      {showSpinner ? (
        <SpinnerOverlay />
      ) : (
        <StyledContentArea
          data-sign="messageList"
        >
          <SearchLine
            onSearchInputChange={onSearchInputChange}
            searchInput={searchInput}
            disableLinks={disableLinks}
            placeholder={i18n.getString('search', currentLocale)}
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
                updateTypeFilter={updateTypeFilter}
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
              />
            ) : (
              !loadingNextPage &&
              (renderNoMessage?.() ?? <NoMessage placeholder={placeholder} />)
            )}
          </StyledConversationListArea>
        </StyledContentArea>
      )}
    </StyledContainer>
  );
};
