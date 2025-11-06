import React, { useState, useEffect, useRef } from 'react';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import i18n from '@ringcentral-integration/widgets/components/ConversationPanel/i18n';
import messageItemI18n from '@ringcentral-integration/widgets/components/MessageItem/i18n';
import styles from '@ringcentral-integration/widgets/components/ConversationPanel/styles.scss';
import {
  SpinnerOverlay,
} from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import {
  checkShouldHidePhoneNumber,
} from '@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber';
import { RcAlert, RcIconButton, styled } from '@ringcentral/juno';
import { AddTextLog, Close } from '@ringcentral/juno-icon';
import MessageInput from '../MessageInput';
import type { Attachment } from '../MessageInput';
import { BackHeader } from '../BackHeader';
import { ConversationMessageList } from '../ConversationMessageList';
import { GroupNumbersDisplay } from './GroupNumbersDisplay';

const HeaderButtons = styled.div`
  position: absolute;
  top: 0;
  right: 6px;
`;

const Root = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

export type Recipient = {
  phoneNumber: string;
  extensionNumber?: string;
  name?: string;
};

type Conversation = {
  conversationMatches?: any[];
  correspondentMatches?: any[];
  lastMatchedCorrespondentEntity?: {
    id: string;
  };
  correspondents?: any[];
  isLogging?: boolean;
  conversationId?: string;
}

const StyledGroupNumbersDisplay = styled(GroupNumbersDisplay)`
  height: 40px;
  line-height: 40px;
  width: 100%;
  padding-left: 10px;
`;

export type ConversationProps = {
  isWide: boolean;
  brand: string;
  replyToReceivers: (...args: any[]) => any;
  messages: any[];
  updateMessageText: (...args: any[]) => any;
  messageText: string;
  recipients: Recipient[];
  sendButtonDisabled: boolean;
  currentLocale: string;
  showSpinner: boolean;
  disableLinks: boolean;
  conversation: Conversation;
  onLogConversation: (...args: any[]) => any;
  areaCode: string;
  countryCode: string;
  autoLog: boolean;
  enableContactFallback: boolean;
  dateTimeFormatter: (...args: any[]) => any;
  goBack: (...args: any[]) => any;
  showContactDisplayPlaceholder: boolean;
  contactPlaceholder: string;
  sourceIcons: any;
  phoneTypeRenderer: (...args: any[]) => any;
  phoneSourceNameRenderer: (...args: any[]) => any;
  showGroupNumberName: boolean;
  messageSubjectRenderer: (...args: any[]) => any;
  formatPhone: (...args: any[]) => any;
  readMessages: (...args: any[]) => any;
  loadPreviousMessages: (...args: any[]) => any;
  unloadConversation: (...args: any[]) => any;
  perPage: number;
  conversationId: string;
  loadConversation: (...args: any[]) => any;
  renderExtraButton: (...args: any[]) => any;
  showLogButton: boolean;
  logButtonTitle: string;
  loadingNextPage: boolean;
  inputExpandable: boolean;
  attachments: Attachment[];
  supportAttachment: boolean;
  addAttachment: (...args: any[]) => any;
  removeAttachment: (...args: any[]) => any;
  onAttachmentDownload: (...args: any[]) => any;
  restrictSendMessage: (...args: any[]) => any;
  shouldLogSelectRecord: boolean;
  onSelectContact: (...args: any[]) => any;
  renderContactList: (...args: any[]) => any;
  renderLogInfoSection: (...args: any[]) => any;
  dropdownClassName: string;
  enableCDC: boolean;
  renderConversationTitle: (...args: any[]) => any;
  isMultipleSiteEnabled: boolean;
  currentSiteCode: string;
  maxExtensionNumberLength: number;
  additionalToolbarButtons: any[];
  onClickAdditionalToolbarButton: (...args: any[]) => any;
  onLinkClick: (...args: any[]) => any;
  showTemplate?: boolean;
  templates?: any[];
  showTemplateManagement?: boolean;
  loadTemplates?: () => Promise<any>;
  deleteTemplate?: (templateId: string) => Promise<any>;
  createOrUpdateTemplate?: (template: any) => Promise<any>;
  sortTemplates?: (templates: any[]) => any;
  hideBackButton?: boolean;
  showCloseButton?: boolean;
  onClose?: (...args: any[]) => any;
}

function getInitialContactIndex(conversation: Conversation) {
  const {
    correspondentMatches,
    lastMatchedCorrespondentEntity,
    conversationMatches,
  } = conversation;
  let index = null;
  const correspondentMatchId =
    (lastMatchedCorrespondentEntity && lastMatchedCorrespondentEntity.id) ||
    (conversationMatches[0] && conversationMatches[0].id);
  if (correspondentMatchId) {
    index = correspondentMatches.findIndex(
      (contact: any) => contact.id === correspondentMatchId,
    );
    if (index > -1) return index;
  } else if (correspondentMatches.length) {
    return 0;
  }
  return -1;
}

function getSelectedContact(selected: number, conversation: Conversation) {
  if (!conversation) {
    return null;
  }
  const contactMatches = conversation.correspondentMatches;
  return (
    (selected > -1 && contactMatches[selected]) ||
    (contactMatches.length === 1 && contactMatches[0]) ||
    null
  );
};

function getPhoneNumber(conversation: Conversation = {}) {
  const { correspondents = [] } = conversation;
  return (
    (correspondents.length === 1 &&
      (correspondents[0].phoneNumber || correspondents[0].extensionNumber)) ||
    undefined
  );
}

function getGroupPhoneNumbers(conversation: Conversation = {}) {
  const { correspondents = [] } = conversation;
  const groupNumbers =
    correspondents.length > 1
      ? correspondents.map(
          (correspondent: any) =>
            correspondent.extensionNumber ||
            correspondent.phoneNumber ||
            undefined,
        )
      : null;
  return groupNumbers;
}

function getFallbackContactName(conversation: Conversation = {}) {
  const { correspondents = [] } = conversation;
  return (correspondents.length === 1 && correspondents[0].name) || undefined;
}

export function ConversationPanel({
  isWide = true,
  disableLinks = false,
  onLogConversation = undefined,
  autoLog = false,
  enableContactFallback = undefined,
  showContactDisplayPlaceholder = true,
  contactPlaceholder =  '',
  sourceIcons = undefined,
  phoneTypeRenderer = undefined,
  phoneSourceNameRenderer = undefined,
  showGroupNumberName = false,
  messageText = '',
  updateMessageText = () => null,
  messageSubjectRenderer = undefined,
  perPage = undefined,
  loadConversation = () => null,
  renderExtraButton = undefined,
  showLogButton = false,
  logButtonTitle = '',
  loadingNextPage = false,
  inputExpandable = undefined,
  attachments = [],
  supportAttachment = false,
  addAttachment = () => null,
  removeAttachment = () => null,
  onAttachmentDownload = undefined,
  restrictSendMessage = undefined,
  shouldLogSelectRecord = false,
  onSelectContact: onSelectContactProp = undefined,
  renderContactList = undefined,
  renderLogInfoSection = undefined,
  dropdownClassName = null,
  enableCDC = false,
  renderConversationTitle = undefined,
  isMultipleSiteEnabled = false,
  currentSiteCode = '',
  maxExtensionNumberLength = 6,
  conversation,
  conversationId,
  showSpinner,
  unloadConversation,
  readMessages,
  messages,
  loadPreviousMessages,
  replyToReceivers,
  currentLocale,
  recipients,
  dateTimeFormatter,
  formatPhone,
  onLinkClick,
  brand,
  areaCode,
  countryCode,
  goBack,
  sendButtonDisabled,
  additionalToolbarButtons,
  onClickAdditionalToolbarButton,
  showTemplate,
  templates,
  showTemplateManagement,
  loadTemplates,
  deleteTemplate,
  createOrUpdateTemplate,
  sortTemplates,
  hideBackButton = false,
  showCloseButton = false,
  onClose = () => null,
}: ConversationProps) {
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState(getInitialContactIndex(conversation));
  const [isLoggingState, setIsLoggingState] = useState(false);
  const [inputHeight, setInputHeight] = useState(101);
  const [alertHeight, setAlertHeight] = useState(46);
  const mountedRef = useRef(true);
  const userSelectionRef = useRef(false);
  const conversationRef = useRef(conversation);
  const messagesRef = useRef(messages);
  const dncAlertRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (showSpinner) {
      return;
    }
    if (!conversationId) {
      return;
    }
    loadConversation(conversationId);
    setLoaded(true);
    readMessages(conversationId);
    userSelectionRef.current = false;
    const timer = setTimeout(() => {
      if (!messagesRef.current || messagesRef.current.length < perPage) {
        loadPreviousMessages();
      }
      if (dncAlertRef.current) {
        setAlertHeight(dncAlertRef.current.clientHeight);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      unloadConversation();
      setLoaded(false);
    };
  }, [conversationId, showSpinner]);

  useEffect(() => {
    const oldConversation = conversationRef.current;
    conversationRef.current = conversation;
    if (userSelectionRef.current) {
      return;
    }
    const newConversation = conversation;
    if (
      oldConversation &&
      newConversation &&
      (newConversation.conversationMatches !== oldConversation.conversationMatches ||
        newConversation.correspondentMatches !== oldConversation.correspondentMatches)
    ) {
      setSelected(getInitialContactIndex(newConversation));
    }
  }, [conversation]);

  const onSend = (text, attachments) => {
    const selectContact = getSelectedContact(selected, conversation);
    replyToReceivers(text, attachments, selectContact);
  };

  const onInputHeightChange = (value) => {
    setInputHeight(value);
  };

  const logConversation = async ({ redirect = true, selectedIndex = selected, prefill = true } = {}) => {
    if (typeof onLogConversation === 'function' && mountedRef.current && !isLoggingState) {
      setIsLoggingState(true);
      await onLogConversation({
        correspondentEntity: getSelectedContact(selectedIndex, conversation),
        conversationId,
        redirect,
        prefill,
      });
      if (mountedRef.current) {
        setIsLoggingState(false);
      }
    }
  }

  const onSelectContact = (value, idx) => {
    const newSelected = showContactDisplayPlaceholder
      ? parseInt(idx, 10) - 1
      : parseInt(idx, 10);
    userSelectionRef.current = true;
    setSelected(newSelected);
    if (autoLog) {
      logConversation({ redirect: false, selectedIndex: newSelected, prefill: false });
    }
    if (shouldLogSelectRecord && typeof onSelectContactProp === 'function') {
      onSelectContactProp({
        correspondentEntity: getSelectedContact(newSelected, conversation),
        conversation,
      });
    }
  };

  const getMessageListHeight = () => {
    const headerHeight = 41;
    const alertMargin = 12;
    const logInfoHeight = isWide ? 60 : 100;
    let extraHeight = 0;
    if (restrictSendMessage?.(getSelectedContact(selected, conversation))) {
      extraHeight = alertHeight + alertMargin + headerHeight;
    } else {
      extraHeight = inputHeight + headerHeight;
    }
    if (typeof renderLogInfoSection === 'function') {
      extraHeight += logInfoHeight;
    }
    return `calc(100% - ${extraHeight}px)`;
  }

  if (!loaded || !conversation) {
    return (
      <div className={styles.root}>
        <SpinnerOverlay />
      </div>
    );
  }

  let conversationBody = null;
  const loading = showSpinner;
  if (!loading) {
    conversationBody = (
      <ConversationMessageList
        currentLocale={currentLocale}
        height={getMessageListHeight()}
        messages={messages}
        dateTimeFormatter={dateTimeFormatter}
        showSender={recipients && recipients.length > 1}
        messageSubjectRenderer={messageSubjectRenderer}
        formatPhone={formatPhone}
        loadingNextPage={loadingNextPage}
        loadPreviousMessages={loadPreviousMessages}
        onAttachmentDownload={onAttachmentDownload}
        onLinkClick={onLinkClick}
        className="ConversationMessageList"
      />
    );
  }
  const { isLogging, conversationMatches, correspondentMatches } = conversation;
  const phoneNumber = getPhoneNumber(conversation);
  const groupNumbers = getGroupPhoneNumbers(conversation);
  const shouldHideNumber = enableCDC && checkShouldHidePhoneNumber(phoneNumber, correspondentMatches);
  const fallbackName = getFallbackContactName(conversation);
  const logButton =
    onLogConversation &&
    showLogButton  ? (
      <RcIconButton
        onClick={() => {
          logConversation();
        }}
        disabled={disableLinks || isLogging || isLoggingState}
        title={
          logButtonTitle ||
          messageItemI18n.getString(
            conversationMatches.length > 0 ? 'editLog' : 'addLog',
            currentLocale
          )
        }
        data-sign="logButton"
        symbol={AddTextLog}
      />
    ) : null;
  const defaultContactDisplay = (
    <ContactDisplay
      currentSiteCode={currentSiteCode}
      maxExtensionNumberLength={maxExtensionNumberLength}
      isMultipleSiteEnabled={isMultipleSiteEnabled}
      brand={brand}
      className={styles.contactDisplay}
      selectClassName={styles.contactDisplaySelect}
      contactMatches={correspondentMatches || []}
      selected={selected}
      onSelectContact={onSelectContact}
      disabled={disableLinks}
      isLogging={isLogging || isLoggingState}
      fallBackName={fallbackName}
      areaCode={areaCode}
      countryCode={countryCode}
      phoneNumber={shouldHideNumber ? null : phoneNumber}
      groupNumbers={groupNumbers}
      showType={false}
      currentLocale={currentLocale}
      enableContactFallback={enableContactFallback}
      placeholder={contactPlaceholder}
      showPlaceholder={showContactDisplayPlaceholder}
      sourceIcons={sourceIcons}
      formatPhone={formatPhone}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      showGroupNumberName={showGroupNumberName}
      dropdownRenderFunction={renderContactList}
      dropdownClassName={dropdownClassName}
    />
  );

  const groupNumbersDisplay = groupNumbers && groupNumbers.length > 1 ? (
    <StyledGroupNumbersDisplay
      correspondents={conversation.correspondents}
      contactMatches={correspondentMatches}
      formatPhone={formatPhone}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      brand={brand}
      currentLocale={currentLocale}
      unread={false}
    />
  ) : null;
  return (
    <Root data-sign="conversationPanel">
      <BackHeader
        onBack={goBack}
        hideBackButton={hideBackButton}
      >
        {renderConversationTitle?.({
          conversation: conversation,
          phoneNumber,
          defaultContactDisplay,
        }) || groupNumbersDisplay || defaultContactDisplay}
        <HeaderButtons>
          {logButton}
          {
            showCloseButton && (
              <RcIconButton
                onClick={onClose}
                symbol={Close}
                title="Close"
                data-sign="closeButton"
              />
            )
          }
        </HeaderButtons>
        
      </BackHeader>
      {renderLogInfoSection?.(conversation) || null}
      {conversationBody}
      {restrictSendMessage?.(getSelectedContact(selected, conversation)) ? (
        <RcAlert
          ref={dncAlertRef}
          severity="error"
          size="small"
          className={styles.alert}
          data-sign="dncAlert"
        >
          {i18n.getString('dncAlert', currentLocale)}
        </RcAlert>
      ) : (
        <MessageInput
          value={messageText}
          onChange={updateMessageText}
          sendButtonDisabled={sendButtonDisabled}
          currentLocale={currentLocale}
          onSend={onSend}
          onHeightChange={onInputHeightChange}
          inputExpandable={inputExpandable}
          attachments={attachments}
          addAttachment={addAttachment}
          removeAttachment={removeAttachment}
          additionalToolbarButtons={additionalToolbarButtons}
          onClickAdditionalToolbarButton={onClickAdditionalToolbarButton}
          showTemplate={showTemplate}
          templates={templates}
          showTemplateManagement={showTemplateManagement}
          loadTemplates={loadTemplates}
          deleteTemplate={deleteTemplate}
          createOrUpdateTemplate={createOrUpdateTemplate}
          sortTemplates={sortTemplates}
          disabled={disableLinks}
        />
      )}
    </Root>
  );
}

export default ConversationPanel;
