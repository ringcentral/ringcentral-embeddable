import React, { useState, useRef, useEffect } from 'react';

import classnames from 'classnames';
import { styled, ellipsis, palette2 } from '@ringcentral/juno/foundation';
import {
  RcListItem,
  RcListItemText,
  RcListItemIcon,
  RcIcon,
} from '@ringcentral/juno';
import {
  ViewBorder,
  Download,
  Read,
  Unread,
  PhoneBorder,
  SmsBorder,
  People,
  AddMemberBorder,
  Delete,
  AddTextLog,
  Refresh,
  Disposition,
} from '@ringcentral/juno-icon';
import { extensionTypes } from '@ringcentral-integration/commons/enums/extensionTypes';
import messageDirection from '@ringcentral-integration/commons/enums/messageDirection';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import type { Message } from '@ringcentral-integration/commons/interfaces/MessageStore.model';
import {
  messageIsFax,
  messageIsTextMessage,
} from '@ringcentral-integration/commons/lib/messageHelper';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import parseNumber from '@ringcentral-integration/commons/lib/parseNumber';
import { format } from '@ringcentral-integration/utils';

import { checkShouldHideContactUser } from '@ringcentral-integration/widgets/lib/checkShouldHideContactUser';
import { checkShouldHidePhoneNumber } from '@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import type { ContactDisplayItemProps } from '@ringcentral-integration/widgets/components/ContactDisplay/ContactDisplayItem';

import i18n from '@ringcentral-integration/widgets/components/MessageItem/i18n';
import actionI18n from '@ringcentral-integration/widgets/components/ActionMenuList/i18n';
import styles from '@ringcentral-integration/widgets/components/MessageItem/styles.scss';

import { ConversationIcon } from './ConversationIcon';
import { DetailDialog } from './DetailDialog';
import { ConfirmDialog } from '../ConfirmDialog';
import { ActionMenu } from '../ActionMenu';
import { StatusMessage } from '../CallItem/StatusMessage';

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
};

type MessageItemState = {
  selected: number;
  isLogging: boolean;
  isCreating: boolean;
  detailOpen: boolean;
  deleteConfirmOpen: boolean;
  hoverOnMoreMenu: boolean;
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

const StyledItemIcon = styled(RcListItemIcon)`
  padding: 16px 0 16px 16px;

  .icon {
    font-size: 26px;
  }
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

const SubjectOverview = styled.span`
  ${ellipsis()}
  flex: 1;
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

function Detail({ conversation, currentLocale }) {
  if (messageIsTextMessage(conversation)) {
    if (
      conversation.mmsAttachments &&
      conversation.mmsAttachments.length > 0
    ) {
      const imageCount = conversation.mmsAttachments.filter(
        (m) => m.contentType.indexOf('image') > -1,
      ).length;
      if (imageCount > 0) {
        return format(i18n.getString('imageAttachment', currentLocale), {
          count: imageCount,
        });
      }
      return format(i18n.getString('fileAttachment', currentLocale), {
        count: conversation.mmsAttachments.length,
      });
    }
    return (
      <SubjectOverview>{conversation.subject}</SubjectOverview>
    );
  }
  if (conversation.voicemailAttachment) {
    const { duration } = conversation.voicemailAttachment;
    return `${i18n.getString(
      'voiceMessage',
      currentLocale,
    )} (${formatDuration(duration)})`;
  }
  if (messageIsFax(conversation)) {
    const pageCount = +conversation.faxPageCount;
    const nameKey = pageCount === 1 ? 'page' : 'pages';
    if (conversation.direction === messageDirection.inbound) {
      return `${i18n.getString(
        'faxReceived',
        currentLocale,
      )}(${pageCount} ${i18n.getString(nameKey, currentLocale)})`;
    }
    return `${i18n.getString(
      'faxSent',
      currentLocale,
    )}(${pageCount} ${i18n.getString(nameKey, currentLocale)})`;
  }
  return '';
}

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

function getInitialContactIndex({
  correspondentMatches,
  lastMatchedCorrespondentEntity,
  showContactDisplayPlaceholder,
}) {
  if (lastMatchedCorrespondentEntity) {
    const index = correspondentMatches.findIndex(
      (contact) => contact.id === lastMatchedCorrespondentEntity.id,
    );
    if (index > -1) return index;
  }
  return showContactDisplayPlaceholder ? -1 : 0;
}

function getSelectedContact(selected, correspondentMatches){
  const contactMatches = correspondentMatches;
  return (
    (selected > -1 && contactMatches[selected]) ||
    (contactMatches.length === 1 && contactMatches[0]) ||
    null
  );
};

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
  } = conversation;
  const [selected, setSelected] = useState(getInitialContactIndex({
    correspondentMatches,
    lastMatchedCorrespondentEntity,
    showContactDisplayPlaceholder,
  }));
  const [isLoggingState, setIsLoggingState] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
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
  const phoneNumber = (
    (correspondents.length === 1 &&
      correspondents[0] &&
      (correspondents[0].phoneNumber || correspondents[0].extensionNumber)) ||
    undefined
  );
  const isContactMatchesHidden =
    enableCDC && checkShouldHideContactUser(correspondentMatches);
  const detail = (
    <Detail conversation={conversation} currentLocale={currentLocale} />
  );
  let disableClickToSms = false;
  if (phoneNumber) {
    const parsedInfo = parseNumber({
      phoneNumber,
      countryCode,
      areaCode,
      maxExtensionLength: maxExtensionNumberLength,
    });
    const isExtension =
      !parsedInfo.hasPlus &&
      parsedInfo.number &&
      parsedInfo.number.length <= maxExtensionNumberLength;
    disableClickToSms = !(
      onClickToSms &&
      (isExtension ? internalSmsPermission : outboundSmsPermission)
    );
  }
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
  const selectedContact = getSelectedContact(selected, correspondentMatches);
  const hasEntity = (
    correspondents.length === 1 &&
    !!correspondentMatches.length &&
    (selectedContact?.type ?? '') !== extensionTypes.ivrMenu
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
  const matchEntities = correspondentMatches || [];
  const matchEntitiesIds = matchEntities.map((item) => item.id);
  const actions: {
    id: string;
    icon: any;
    title: string;
    onClick: (...args: any[]) => any;
    disabled: boolean;
    sub?: boolean;
  }[] = [];
  if (showLogButton) {
    const isLogged = conversationMatches.filter((match) =>
      match.type !== 'status'
    ).length > 0;
    actions.push({
      id: 'log',
      icon: AddTextLog,
      title: logButtonTitle || (isLogged ? 'Edit log' : i18n.getString('addLog', currentLocale)),
      onClick: logConversation,
      disabled: disableLinks || isLogging || isLoggingState,
    });
  }
  if (type !== messageTypes.fax && onClickToDial) {
    actions.push({
      id: 'c2d',
      icon: PhoneBorder,
      title: i18n.getString('call', currentLocale),
      onClick: () => {
        if (onClickToDial) {
          const contact = getSelectedContact(selected, correspondentMatches) || {};
          if (phoneNumber) {
            onClickToDial({
              ...contact,
              phoneNumber,
              fromType: type,
            });
          }
        }
      },
      disabled: disableLinks || disableCallButton || disableClickToDial || !phoneNumber,
    });
  }
  if (type === messageTypes.voiceMail && onClickToSms) {
    actions.push({
      id: 'c2sms',
      icon: SmsBorder,
      title: i18n.getString('text', currentLocale),
      onClick: () => {
        if (onClickToSms) {
          const contact = getSelectedContact(selected, correspondentMatches) || {};

          if (phoneNumber) {
            updateTypeFilter(messageTypes.text);
            onClickToSms({
              ...contact,
              phoneNumber,
            });
          }
        }
      },
      disabled: disableLinks || disableClickToSms || !phoneNumber,
    });
  }
  actions.push({
    id: 'mark',
    icon: unreadCounts > 0 ? Unread : Read,
    title: unreadCounts > 0 ? 'Mark as read' : 'Mark as unread',
    onClick: unreadCounts > 0 ? () => {
      if (unreadCounts > 0) {
        unmarkMessage(conversationId);
      }
    } : () => {
      if (unreadCounts === 0) {
        markMessage(conversationId);
      }
    },
    disabled: disableLinks,
    sub: true,
  });
  if (type === messageTypes.fax) {
    actions.push({
      id: 'preview',
      icon: ViewBorder,
      title: i18n.getString('preview', currentLocale),
      onClick: () => {
        previewFaxMessages(faxAttachment.uri, conversationId);
      },
      disabled: disableLinks || !faxAttachment,
      sub: true,
    });
  }
  if (downloadUri) {
    actions.push({
      id: 'download',
      icon: Download,
      title: i18n.getString('download', currentLocale),
      onClick: () => {
        downloadRef.current?.click();
      },
      disabled: disableLinks,
      sub: true,
    });
  }
  if (!isContactMatchesHidden || hasEntity) {
    actions.push({
      id: 'viewContact',
      icon: People,
      title: 'View contact details',
      onClick: (e) => {
        e && e.stopPropagation();
        if (typeof onViewContact === 'function') {
          onViewContact({
            contact: getSelectedContact(selected, correspondentMatches),
            contactMatches: matchEntities,
            phoneNumber,
            matchEntitiesIds,
          });
        }
      },
      disabled: disableLinks,
    });
  }
  if (!hasEntity && phoneNumber && onCreateContact) {
    actions.push({
      id: 'createContact',
      icon: AddMemberBorder,
      title: i18n.getString('addEntity', currentLocale),
      onClick: async () => {
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
      disabled: disableLinks,
    });
  }
  if (phoneNumber && onRefreshContact) {
    actions.push({
      id: 'refreshContact',
      icon: Refresh,
      title: 'Refresh contact',
      onClick: () => {
        onRefreshContact({
          phoneNumber,
        });
      },
      disabled: disableLinks,
    });
  }
  if (type === messageTypes.fax || type === messageTypes.voiceMail) {
    actions.push({
      id: 'delete',
      icon: Delete,
      title: i18n.getString('delete', currentLocale),
      onClick: () => {
        setDeleteConfirmOpen(true);
      },
      disabled: disableLinks,
    });
  }

  const onClickWrapper = (e) => {
    if (messageIsTextMessage(conversation)) {
      showConversationDetail(conversationId);
    } else {
      setDetailOpen(true);
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

  return (
    <StyledListItem
      data-sign={msgItem}
      data-id={conversationId}
      $hoverOnMoreMenu={hoverOnMoreMenu}
    >
      <StyledItemIcon onClick={onClickWrapper}>
        <ConversationIcon
          group={correspondents && correspondents.length > 1}
          type={type}
          currentLocale={currentLocale}
          direction={direction}
          color={unreadCounts ? 'action.primary' : 'neutral.f06'}
        />
      </StyledItemIcon>
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
        type !== messageTypes.text ? (
          <DetailDialog
            open={detailOpen}
            onClose={(e) => {
              e.stopPropagation();
              setDetailOpen(false);
            }}
            contactDisplay={
              renderContactName
                ? renderContactName({
                    conversation,
                    phoneNumber,
                    unread: 0,
                    defaultContactDisplay: defaultContactDisplayWithoutUnread,
                  })
                : defaultContactDisplayWithoutUnread
            }
            actions={actions}
            correspondents={correspondents}
            self={self}
            type={type}
            currentLocale={currentLocale}
            direction={direction}
            voicemailAttachment={voicemailAttachment}
            time={dateTimeFormatterCatchError(creationTime, 'datetime')}
            detail={detail}
            disableLinks={disableLinks}
            onPlayVoicemail={() => {
              if (unreadCounts > 0) {
                readMessage(conversationId);
              }
            }}
          />
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
