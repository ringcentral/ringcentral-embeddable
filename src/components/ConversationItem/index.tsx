import React, { useState, useRef, useEffect } from 'react';

import classnames from 'classnames';
import { styled, ellipsis, palette2 } from '@ringcentral/juno/foundation';
import {
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcIcon,
} from '@ringcentral/juno';
import { Disposition } from '@ringcentral/juno-icon';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import type { Message } from '@ringcentral-integration/commons/interfaces/MessageStore.model';
import { messageIsTextMessage } from '@ringcentral-integration/commons/lib/messageHelper';
import { checkShouldHidePhoneNumber } from '@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import type { ContactDisplayItemProps } from '@ringcentral-integration/widgets/components/ContactDisplay/ContactDisplayItem';

import i18n from '@ringcentral-integration/widgets/components/MessageItem/i18n';
import actionI18n from '@ringcentral-integration/widgets/components/ActionMenuList/i18n';
import styles from '@ringcentral-integration/widgets/components/MessageItem/styles.scss';

import { ContactAvatar } from '../ContactAvatar';
import { ConfirmDialog } from '../ConfirmDialog';
import { ActionMenu } from '../ActionMenu';
import { StatusMessage } from '../CallItem/StatusMessage';
import { Detail } from './Detail';
import { GroupNumbersDisplay } from '../ConversationPanel/GroupNumbersDisplay';
import {
  getSelectedContact,
  getInitialContactIndex,
  getPhoneNumber,
  getActions,
} from './helper';

export type MessageItemProps = {
  conversation: Message;
  areaCode: string;
  brand: string;
  countryCode: string;
  currentLocale: string;
  currentSiteCode?: string;
  isMultipleSiteEnabled?: boolean;
  onLogConversation?: (...args: any[]) => any;
  onViewContact?: (...args: any[]) => any;
  onCreateContact?: (...args: any[]) => any;
  onRefreshContact?: (...args: any[]) => any;
  createEntityTypes?: any[];
  onClickToDial?: (...args: any[]) => any;
  onClickToSms?: (...args: any[]) => any;
  disableLinks?: boolean;
  disableCallButton?: boolean;
  disableClickToDial?: boolean;
  dateTimeFormatter: (...args: any[]) => any;
  showConversationDetail: (...args: any[]) => any;
  readMessage: (...args: any[]) => any;
  markMessage: (...args: any[]) => any;
  unmarkMessage: (...args: any[]) => any;
  autoLog?: boolean;
  enableContactFallback?: boolean;
  showContactDisplayPlaceholder?: boolean;
  contactPlaceholder?: string;
  sourceIcons?: ContactDisplayItemProps['sourceIcons'];
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  showGroupNumberName?: boolean;
  deleteMessage?: (...args: any[]) => any;
  previewFaxMessages?: (...args: any[]) => any;
  internalSmsPermission?: boolean;
  outboundSmsPermission?: boolean;
  updateTypeFilter?: (...args: any[]) => any;
  onFaxDownload?: (...args: any[]) => any;
  showChooseEntityModal?: boolean;
  shouldLogSelectRecord?: boolean;
  onSelectContact?: (...args: any[]) => any;
  renderContactList?: (...args: any[]) => any;
  dropdownClassName?: string;
  enableCDC?: boolean;
  maxExtensionNumberLength?: number;
  renderContactName?: (...args: any[]) => JSX.Element;
  externalViewEntity?: (conversation: Message) => any;
  externalHasEntity?: (conversation: Message) => boolean;
  formatPhone: (phoneNumber: string) => string | undefined;
  showLogButton?: boolean;
  logButtonTitle?: string;
  rcAccessToken?: string;
};

const StyledListItem = styled(RcListItem)<{ $hoverOnMoreMenu: boolean }>`
  padding: 0;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  background-color: ${palette2('neutral', 'b01')};
  cursor: pointer;

  &.RcListItem-gutters {
    padding: 0;
  }

  .conversation-item-action-menu {
    display: none;
  }

  .conversation-item-time {
    text-align: right;
    margin-left: 8px;
  }

  &:hover {
    .conversation-item-time {
      display: none;
    }
    .conversation-item-action-menu {
      display: flex;
    }
  }

  ${({ $hoverOnMoreMenu }) =>
    $hoverOnMoreMenu &&
    `
    .conversation-item-time {
      display: none;
    }
    .conversation-item-action-menu {
      display: flex;
    }
  `}
`;

const StyledListItemText = styled(RcListItemText)`
  margin: 0;
  padding: 10px 16px 10px 0;

  &.RcListItemText-multiline {
    margin: 0;
  }
`;

const StyledItemAvatar= styled(RcListItemAvatar)`
  padding-left: 16px;
`;

const IconBadge = styled(RcIcon)`
  margin-right: 4px;
`;

const StyledSecondary = styled.span`
  display: flex;
  align-items: center;
  flex-direction: row;
`;

const DetailArea = styled.span`
  ${ellipsis()}
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: row;
`;

const StyledActionMenu = styled(ActionMenu)`
  position: absolute;
  right: 16px;
  top: 50%;
  margin-top: -16px;

  .RcIconButton-root {
    margin-left: 6px;
  }
`;

const DownloadLink = styled.a`
  display: none;
`;

function DefaultContactDisplay({
  showUnreadStatus = true,
  areaCode,
  brand,
  countryCode,
  currentLocale,
  currentSiteCode,
  isMultipleSiteEnabled,
  conversation: {
    unreadCounts,
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
  dropdownClassName,
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

  if (groupNumbers) {
    return (
      <GroupNumbersDisplay
        correspondents={correspondents}
        contactMatches={correspondentMatches}
        formatPhone={formatPhone}
        className={styles.contactDisplay}
        phoneSourceNameRenderer={phoneSourceNameRenderer}
        brand={brand}
        currentLocale={currentLocale}
        unread={showUnreadStatus ? !!unreadCounts : false}
      />
    );
  }
  return (
    <ContactDisplay
      formatPhone={formatPhone}
      className={classnames(
        styles.contactDisplay,
        showUnreadStatus && unreadCounts && styles.unread,
      )}
      unread={showUnreadStatus ? !!unreadCounts : false}
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
      dropdownClassName={dropdownClassName}
    />
  );
}

export function ConversationItem({
  autoLog = false,
  areaCode,
  brand,
  countryCode,
  currentLocale,
  currentSiteCode = '',
  conversation,
  contactPlaceholder = '',
  disableLinks: parentDisableLinks = false,
  disableCallButton = false,
  disableClickToDial = false,
  dropdownClassName = null,
  deleteMessage = () => {},
  dateTimeFormatter,
  enableContactFallback,
  enableCDC = false,
  formatPhone,
  internalSmsPermission = true,
  isMultipleSiteEnabled = false,
  maxExtensionNumberLength = 6,
  markMessage,
  logButtonTitle = '',
  outboundSmsPermission = true,
  onClickToDial,
  onClickToSms,
  onViewContact,
  onCreateContact,
  onLogConversation,
  onSelectContact: onSelectContactProp,
  onRefreshContact,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  previewFaxMessages,
  renderContactName,
  renderContactList,
  readMessage,
  showLogButton = false,
  shouldLogSelectRecord = false,
  showGroupNumberName = false,
  showContactDisplayPlaceholder = true,
  showConversationDetail,
  sourceIcons,
  updateTypeFilter,
  unmarkMessage,
  openMessageDetails,
  rcAccessToken,
  additionalActions,
  onClickAdditionalAction,
}) {
  const {
    conversationId,
    unreadCounts,
    correspondents,
    correspondentMatches,
    conversationMatches = [],
    lastMatchedCorrespondentEntity,
    creationTime,
    isLogging,
    type,
    direction,
    voicemailAttachment,
    faxAttachment,
    self,
    owner,
  } = conversation;
  const [selected, setSelected] = useState(getInitialContactIndex({
    correspondentMatches,
    lastMatchedCorrespondentEntity,
    showContactDisplayPlaceholder,
  }));
  const [isLoggingState, setIsLoggingState] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [hoverOnMoreMenu, setHoverOnMoreMenu] = useState(false);
  const userSelectionRef = useRef(false);
  const mountedRef = useRef(false);
  const downloadRef = useRef(null);
  const conversationRef = useRef(conversation);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (userSelectionRef.current) {
      return;
    }
    const previousConversation = conversationRef.current;
    if (
      previousConversation.conversationMatches !== conversation.conversationMatches ||
      previousConversation.correspondentMatches !== conversation.correspondentMatches
    ) {
      setSelected(getInitialContactIndex({
        correspondentMatches: conversation.correspondentMatches,
        lastMatchedCorrespondentEntity: conversation.lastMatchedCorrespondentEntity,
        showContactDisplayPlaceholder,
      }));
    }
    conversationRef.current = conversation;
  }, [conversation]);

  let disableLinks = parentDisableLinks;
  const isVoicemail = type === messageTypes.voiceMail;
  const isFax = type === messageTypes.fax;
  if (isVoicemail && !voicemailAttachment) {
    disableLinks = true;
  }
  if (isFax && !faxAttachment) {
    disableLinks = true;
  }
  const phoneNumber = getPhoneNumber(conversation);
  const detail = (
    <Detail conversation={conversation} currentLocale={currentLocale} />
  );
  const msgItem = `${type}MessageItem`;
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
        conversation,
      });
    }
  };
  const defaultContactDisplayWithUnread = (
    <DefaultContactDisplay
      showUnreadStatus
      areaCode={areaCode}
      brand={brand}
      countryCode={countryCode}
      currentLocale={currentLocale}
      currentSiteCode={currentSiteCode}
      isMultipleSiteEnabled={isMultipleSiteEnabled}
      conversation={conversation}
      disableLinks={disableLinks}
      enableContactFallback={enableContactFallback}
      contactPlaceholder={contactPlaceholder}
      showContactDisplayPlaceholder={showContactDisplayPlaceholder}
      sourceIcons={sourceIcons}
      phoneTypeRenderer={phoneTypeRenderer}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      showGroupNumberName={showGroupNumberName}
      renderContactList={renderContactList}
      dropdownClassName={dropdownClassName}
      enableCDC={enableCDC}
      formatPhone={formatPhone}
      phoneNumber={phoneNumber}
      fallbackName={fallbackName}
      selected={selected}
      onSelectContact={onSelectContact}
      isLoggingState={isLogging}
    />
  );
  const defaultContactDisplayWithoutUnread = (
    <DefaultContactDisplay
      showUnreadStatus={false}
      areaCode={areaCode}
      brand={brand}
      countryCode={countryCode}
      currentLocale={currentLocale}
      currentSiteCode={currentSiteCode}
      isMultipleSiteEnabled={isMultipleSiteEnabled}
      conversation={conversation}
      disableLinks={disableLinks}
      enableContactFallback={enableContactFallback}
      contactPlaceholder={contactPlaceholder}
      showContactDisplayPlaceholder={showContactDisplayPlaceholder}
      sourceIcons={sourceIcons}
      phoneTypeRenderer={phoneTypeRenderer}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      showGroupNumberName={showGroupNumberName}
      renderContactList={renderContactList}
      dropdownClassName={dropdownClassName}
      enableCDC={enableCDC}
      formatPhone={formatPhone}
      phoneNumber={phoneNumber}
      fallbackName={fallbackName}
      selected={selected}
      onSelectContact={onSelectContact}
      isLoggingState={isLogging}
    />
  );
  let downloadUri = null;
  if (faxAttachment) {
    downloadUri = faxAttachment.uri;
  } else if (voicemailAttachment) {
    downloadUri = voicemailAttachment.uri;
  }
  const isLogged = conversationMatches.filter((match) =>
    match.type !== 'status'
  ).length > 0;
  const statusMatch = conversationMatches.find((match) =>
    match.type === 'status'
  );
  const actions = getActions({
    areaCode,
    countryCode,
    currentLocale,
    conversation,
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
          // console.log('created: isCreating...', this.state.isCreating);
        }
      }
    },
    onRefreshContact,
    previewFaxMessages,
    showLogButton,
    updateTypeFilter,
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
    additionalActions,
    onClickAdditionalAction,
  });

  const onClickWrapper = (e) => {
    if (messageIsTextMessage(conversation)) {
      showConversationDetail(conversationId);
    } else {
      openMessageDetails(conversation.id);
    }
  };

  const dateTimeFormatterCatchError = (creationTime?: number, type?: string) => {
    try {
      return dateTimeFormatter({ utcTimestamp: creationTime, type });
    } catch (e) {
      console.error('Format date time error', creationTime);
      return creationTime;
    }
  };
  const isGroup = correspondents && correspondents.length > 1;
  return (
    <StyledListItem
      data-sign={msgItem}
      data-id={conversationId}
      $hoverOnMoreMenu={hoverOnMoreMenu}
    >
      <StyledItemAvatar onClick={onClickWrapper}>
        <ContactAvatar
          contact={
            isGroup ?
            null:
            (correspondentMatches && (correspondentMatches[selected] || correspondentMatches[0]))
          }
          size="xsmall"
          isGroup={isGroup}
          rcAccessToken={rcAccessToken}
        />
      </StyledItemAvatar>
      <StyledListItemText
        onClick={onClickWrapper}
        primary={
          renderContactName
            ? renderContactName({
                conversation,
                phoneNumber,
                unread: !!unreadCounts,
                defaultContactDisplay: defaultContactDisplayWithUnread,
              })
            : defaultContactDisplayWithUnread
        }
        primaryTypographyProps={{
          component: 'div',
        }}
        secondaryTypographyProps={{
          component: 'div',
        }}
        secondary={
          <>
            <StyledSecondary>
              <DetailArea>
              {
                  isLogged && (
                    <IconBadge
                      symbol={Disposition}
                      size="small"
                      title="Logged"
                    />
                  )
                }
                {detail}
              </DetailArea>
              <span className="conversation-item-time">
                {dateTimeFormatterCatchError(creationTime)}
              </span>
            </StyledSecondary>
            {
              statusMatch && (
                <StatusMessage statusMatch={statusMatch} />
              )
            }
            {
              owner && (
                <span className="conversation-item-owner">
                  {owner.name}
                </span>
              )
            }
          </>
        }
      />
      <StyledActionMenu
        actions={actions}
        size="small"
        maxActions={3}
        className="conversation-item-action-menu"
        iconVariant="contained"
        color="neutral.b01"
        onMoreMenuOpen={(open) => {
          setHoverOnMoreMenu(open)
        }}
      />
      {
        (type == messageTypes.fax || type == messageTypes.voiceMail) ?
          (
            <ConfirmDialog
              open={deleteConfirmOpen}
              onClose={() => {
                setDeleteConfirmOpen(false);
              }}
              onConfirm={() => {
                deleteMessage(conversationId)
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
    </StyledListItem>
  );
}
