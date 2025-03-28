import React, { useState, useEffect, useRef } from 'react';
import {
  RcTypography,
  RcButton,
  styled,
  palette2,
  ellipsis,
} from '@ringcentral/juno';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';
import i18n from '@ringcentral-integration/widgets/components/MessageItem/i18n';
import actionI18n from '@ringcentral-integration/widgets/components/ActionMenuList/i18n';
import { checkShouldHidePhoneNumber } from '@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import styles from '@ringcentral-integration/widgets/components/MessageItem/styles.scss';

import { ActionMenu } from '../ActionMenu';
import { ConversationIcon } from '../ConversationItem/ConversationIcon';
import { Detail } from '../ConversationItem/Detail';
import { AudioPlayer } from '../AudioPlayer';
import { ConfirmDialog } from '../ConfirmDialog';
import {
  getActions,
  getInitialContactIndex,
  getPhoneNumber,
  getSelectedContact,
} from '../ConversationItem/helper';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 16px;
  padding-right: 16px;
`;

const StyleSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${palette2('neutral', 'l03')};
  width: 100%;
  margin-bottom: 8px;
`;

const DownloadLink = styled.a`
  display: none;
`;

const DetailSection = styled(StyleSection)`
  flex-direction: row;
`;

const SectionLeftArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  ${ellipsis()}
`;

const SectionRightArea = styled.div`
  display: flex;
  flex-direction: row;
`;

const SectionTitle = styled(RcTypography)`
  margin-bottom: 5px;
`;

const StyledAudioPlayer = styled(AudioPlayer)`
  flex: 1;
`;

const TranscriptionTitle = styled(RcTypography)`
  width: 100%;
  text-align: left;
  margin-bottom: 4px;
`;

const TranscriptionText = styled(RcTypography)`
  font-size: 0.8125rem;
  line-height: 1.0625rem;
`;

const StyledActionButtons = styled(ActionMenu)`
  justify-content: center;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
`;

function DefaultContactDisplay({
  areaCode,
  brand,
  countryCode,
  currentLocale,
  currentSiteCode,
  isMultipleSiteEnabled,
  conversation: {
    correspondentMatches,
    isLogging,
    type,
    voicemailAttachment,
    faxAttachment,
    correspondents,
  },
  disableLinks: parentDisableLinks,
  enableContactFallback,
  contactPlaceholder,
  showContactDisplayPlaceholder,
  sourceIcons,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  showGroupNumberName,
  renderContactList,
  enableCDC,
  formatPhone,
  phoneNumber,
  fallbackName,
  selected,
  onSelectContact,
  isLoggingState,
}) {
  let disableLinks = parentDisableLinks;
  const isVoicemail = type === messageTypes.voiceMail;
  const isFax = type === messageTypes.fax;
  if (isVoicemail && !voicemailAttachment) {
    disableLinks = true;
  }
  if (isFax && !faxAttachment) {
    disableLinks = true;
  }
  const groupNumbers = correspondents.length > 1
    ? correspondents.map(
        (correspondent) =>
          correspondent.extensionNumber ||
          correspondent.phoneNumber ||
          undefined,
      )
    : null;
  const shouldHideNumber =
    enableCDC &&
    checkShouldHidePhoneNumber(phoneNumber, correspondentMatches);
  return (
    <ContactDisplay
      formatPhone={formatPhone}
      className={styles.contactDisplay}
      unread={false}
      selectedClassName={styles.selectedValue}
      selectClassName={styles.dropdownSelect}
      brand={brand}
      contactMatches={correspondentMatches}
      selected={selected}
      onSelectContact={onSelectContact}
      disabled={disableLinks}
      isLogging={isLogging || isLoggingState}
      fallBackName={fallbackName}
      areaCode={areaCode}
      countryCode={countryCode}
      phoneNumber={shouldHideNumber ? null : phoneNumber}
      groupNumbers={groupNumbers}
      showGroupNumberName={showGroupNumberName}
      currentLocale={currentLocale}
      currentSiteCode={currentSiteCode}
      isMultipleSiteEnabled={isMultipleSiteEnabled}
      enableContactFallback={enableContactFallback}
      stopPropagation={false}
      showType={false}
      showPlaceholder={showContactDisplayPlaceholder}
      placeholder={contactPlaceholder}
      sourceIcons={sourceIcons}
      phoneTypeRenderer={phoneTypeRenderer}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      dropdownRenderFunction={renderContactList}
    />
  );
}

export function MessageDetailsPanel({
  messageId,
  message,
  showLogButton = false,
  logButtonTitle = '',
  enableContactFallback,
  showContactDisplayPlaceholder = true,
  contactPlaceholder = '',
  brand,
  currentLocale,
  currentSiteCode = '',
  isMultipleSiteEnabled = false,
  areaCode,
  countryCode,
  disableLinks: parentDisableLinks = false,
  disableCallButton = false,
  disableClickToDial = false,
  outboundSmsPermission = true,
  internalSmsPermission = true,
  shouldLogSelectRecord,
  onSelectContact: onSelectContactProp,
  composeTextPermission,
  showSpinner,
  autoLog = false,
  enableCDC = false,
  maxExtensionNumberLength = 6,
  formatPhone,
  dateTimeFormatter,
  onViewContact,
  onCreateContact,
  onClickToDial,
  onClickToSms,
  onLogConversation,
  onRefreshContact,
  markMessage,
  unmarkMessage,
  readMessage,
  deleteMessage  = (id: string) => {},
  previewFaxMessages,
  onFaxDownload,
  onViewMessage,
  sourceIcons,
  renderContactName,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  renderContactList,
  transcription,
}) {
  const [selected, setSelected] = useState(0);
  const [isLoggingState, setIsLoggingState] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const userSelectionRef = useRef(false);
  const mountedRef = useRef(false);
  const downloadRef = useRef(null);
  const messageRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (messageId) {
      onViewMessage(messageId);
      setDeleteConfirmOpen(false);
    }
  }, [messageId]);

  useEffect(() => {
    if (!messageRef.current && message) {
      messageRef.current = message;
      setSelected(getInitialContactIndex({
        correspondentMatches: message.correspondentMatches,
        lastMatchedCorrespondentEntity: message.lastMatchedCorrespondentEntity,
        showContactDisplayPlaceholder
      }));
      return;
    }
    if (userSelectionRef.current) {
      return;
    }
    if (!message) {
      return;
    }
    const previousConversation = messageRef.current;
    if (
      previousConversation.conversationMatches !== message.conversationMatches ||
      previousConversation.correspondentMatches !== message.correspondentMatches
    ) {
      setSelected(getInitialContactIndex({
        correspondentMatches: message.correspondentMatches,
        lastMatchedCorrespondentEntity: message.lastMatchedCorrespondentEntity,
        showContactDisplayPlaceholder,
      }));
    }
    messageRef.current = message;
  }, [message]);

  if (!message) {
    return null;
  }

  const {
    conversationId,
    unreadCounts,
    correspondents,
    correspondentMatches,
    creationTime,
    isLogging,
    type,
    direction,
    voicemailAttachment,
    faxAttachment,
    self,
  } = message;

  let disableLinks = parentDisableLinks;
  const isVoicemail = type === messageTypes.voiceMail;
  const isFax = type === messageTypes.fax;
  if (isVoicemail && !voicemailAttachment) {
    disableLinks = true;
  }
  if (isFax && !faxAttachment) {
    disableLinks = true;
  }
  let downloadUri = null;
  if (faxAttachment) {
    downloadUri = faxAttachment.uri;
  } else if (voicemailAttachment) {
    downloadUri = voicemailAttachment.uri;
  }
  const phoneNumber = getPhoneNumber(message);
  const fallbackName = (correspondents.length === 1 && correspondents[0].name) || undefined;
  const logConversation = async ({
    redirect = true,
    selected,
    prefill = true,
  }: {
    redirect?: boolean;
    selected?: number;
    prefill?: boolean;
  } = {}) => {
    if (
      typeof onLogConversation === 'function' &&
      mountedRef.current &&
      !isLoggingState
    ) {
      setIsLoggingState(true);
      await onLogConversation({
        correspondentEntity: getSelectedContact(selected, correspondentMatches),
        conversationId: conversationId,
        redirect,
        prefill,
      });
      if (mountedRef.current) {
        setIsLoggingState(false);
      }
    }
  };
  const actions = getActions({
    areaCode,
    countryCode,
    currentLocale,
    conversation: message,
    disableCallButton,
    disableClickToDial,
    enableCDC,
    internalSmsPermission,
    maxExtensionNumberLength,
    markMessage,
    logButtonTitle,
    isLogging: isLoggingState || isLogging,
    outboundSmsPermission,
    onClickToDial,
    onClickToSms,
    onViewContact,
    onCreateContact,
    createSelectedContact: async () => {
      if (
        onCreateContact === 'function' &&
        mountedRef.current &&
        !isCreating
      ) {
        setIsCreating(true);
        await onCreateContact({
          phoneNumber,
          name: enableContactFallback
            ? fallbackName
            : '',
          entityType: undefined,
        });
  
        if (mountedRef.current) {
          setIsCreating(false);
        }
      }
    },
    onRefreshContact,
    previewFaxMessages,
    showLogButton,
    unmarkMessage,
    logConversation,
    disableLinks,
    selected,
    onDownload: () => {
      downloadRef.current?.click();
    },
    onDelete: () => {
      setDeleteConfirmOpen(true);
    },
  })
  const mainActions = actions.filter((action) => !action.sub);
  const subActions = actions.filter((action) => action.sub);
  const dateTimeFormatterCatchError = (creationTime?: number, type?: string) => {
    try {
      return dateTimeFormatter({ utcTimestamp: creationTime, type });
    } catch (e) {
      console.error('Format date time error', creationTime);
      return creationTime;
    }
  };
  const time = dateTimeFormatterCatchError(creationTime, 'datetime');
  const detail = (
    <Detail conversation={message} currentLocale={currentLocale} />
  );
  const onSelectContact = (value: any, idx: string) => {
    const selected = showContactDisplayPlaceholder
      ? parseInt(idx, 10) - 1
      : parseInt(idx, 10);
    userSelectionRef.current = true;
    setSelected(selected);
    if (autoLog) {
      logConversation({ redirect: false, selected, prefill: false });
    }
    if (shouldLogSelectRecord && typeof onSelectContactProp === 'function') {
      onSelectContactProp({
        correspondentEntity: getSelectedContact(selected, correspondentMatches),
        conversation: message,
      });
    }
  };
  const defaultContactDisplay = (
    <DefaultContactDisplay
      areaCode={areaCode}
      brand={brand}
      countryCode={countryCode}
      currentLocale={currentLocale}
      currentSiteCode={currentSiteCode}
      isMultipleSiteEnabled={isMultipleSiteEnabled}
      conversation={message}
      disableLinks={disableLinks}
      enableContactFallback={enableContactFallback}
      contactPlaceholder={contactPlaceholder}
      showContactDisplayPlaceholder={showContactDisplayPlaceholder}
      sourceIcons={sourceIcons}
      phoneTypeRenderer={phoneTypeRenderer}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      showGroupNumberName={false}
      renderContactList={renderContactList}
      enableCDC={enableCDC}
      formatPhone={formatPhone}
      phoneNumber={phoneNumber}
      fallbackName={fallbackName}
      selected={selected}
      onSelectContact={onSelectContact}
      isLoggingState={isLogging}
    />
  );
  return (
    <Container>
      <ConversationIcon
        group={correspondents && correspondents.length > 1}
        type={type}
        currentLocale={currentLocale}
        direction={direction}
        color="neutral.f06"
      />
      <br />
      {renderContactName
        ? renderContactName({
            conversation: message,
            phoneNumber,
            unread: 0,
            defaultContactDisplay: defaultContactDisplay,
          })
        : defaultContactDisplay}
      <StyledActionButtons
        actions={mainActions}
        maxActions={4}
      />
      {
        type === messageTypes.fax ? (
          <DetailSection>
            <SectionLeftArea>
              <SectionTitle
                variant="caption2"
                color="neutral.f06"
              >
                {time}
              </SectionTitle>
              <RcTypography variant="body1">
                {detail}
              </RcTypography>
            </SectionLeftArea>
            <SectionRightArea>
              <ActionMenu
                actions={subActions}
                maxActions={2}
                size={undefined}
              />
            </SectionRightArea>
          </DetailSection>
        ) : null
      }
      {
        type === messageTypes.voiceMail && voicemailAttachment ? (
          <StyleSection>
            <SectionTitle
              variant="caption2"
              color="neutral.f06"
            >
              {time}
            </SectionTitle>
            <SectionRightArea>
              <StyledAudioPlayer
                uri={voicemailAttachment.uri}
                duration={voicemailAttachment.duration}
                disabled={disableLinks}
                currentLocale={currentLocale}
                onPlay={() => {
                  if (unreadCounts > 0) {
                    readMessage(conversationId);
                  }
                }}
              />
              <ActionMenu
                actions={subActions}
                maxActions={1}
              />
            </SectionRightArea>
          </StyleSection>
        ) : null
      }
      {
        self ? (
          <StyleSection>
            <SectionTitle
              variant="caption2"
              color="neutral.f06"
            >
              {direction === messageDirection.inbound ? 'To' : 'From'}
            </SectionTitle>
            <RcTypography variant="body1">
              {self.phoneNumber || self.extension}
            </RcTypography>
          </StyleSection>
        ) : null
      }
      {
        transcription ? (
          <>
            <TranscriptionTitle variant="subheading1">Transcript</TranscriptionTitle>
            <StyleSection>
              <TranscriptionText variant="body1">
                {transcription.text}
              </TranscriptionText>
            </StyleSection>
          </>
        ) : null
      }
      {
        (type == messageTypes.fax || type == messageTypes.voiceMail) ?
          (
            <ConfirmDialog
              open={deleteConfirmOpen}
              onClose={() => {
                setDeleteConfirmOpen(false);
              }}
              onConfirm={() => {
                deleteMessage(conversationId);
              }}
              keepMounted={false}
              title={actionI18n.getString(
                type == messageTypes.fax ? 'sureToDeleteFax' : 'sureToDeleteVoiceMail',
                currentLocale
              )}
            />
          ) : null
      }
      {
        downloadUri ? (
          <DownloadLink
            target="_blank"
            download
            title={i18n.getString('download', currentLocale)}
            ref={downloadRef}
            href={`${downloadUri}&contentDisposition=Attachment`}
          ></DownloadLink>
        ) : null
      }
    </Container>
  );
}
