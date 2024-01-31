import type { ReactNode } from 'react';
import React, { Component, createRef } from 'react';

import classnames from 'classnames';
import { styled, ellipsis } from '@ringcentral/juno/foundation';
import {
  RcListItem,
  RcListItemText,
  RcListItemIcon,
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

const StyledListItem = styled(RcListItem)`
  padding: 6px 16px;

  .conversation-item-action-menu {
    display: none;
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

const StyledItemIcon = styled(RcListItemIcon)`
  .icon {
    font-size: 28px;
  }
`;

const StyledSecondary = styled.span`
  display: flex;
  align-items: center;
  flex-direction: row;
`;

const DetailArea = styled.span`
  flex: 1;
  overflow: hidden;
  ${ellipsis()}
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

class MessageItem extends Component<MessageItemProps, MessageItemState> {
  _userSelection = false;
  contactDisplay: any;
  downloadRef: any;
  private _mounted = false;

  static defaultProps: Partial<MessageItemProps> = {
    currentSiteCode: '',
    isMultipleSiteEnabled: false,
    disableClickToDial: false,
    disableLinks: false,
    disableCallButton: false,
    autoLog: false,
    showContactDisplayPlaceholder: true,
    contactPlaceholder: '',
    showGroupNumberName: false,
    deleteMessage() {},
    internalSmsPermission: true,
    outboundSmsPermission: true,
    showChooseEntityModal: true,
    shouldLogSelectRecord: false,
    dropdownClassName: null,
    enableCDC: false,
    maxExtensionNumberLength: 6,
    showLogButton: false,
    logButtonTitle: '',
  };

  constructor(props: MessageItemProps) {
    super(props);
    this.state = {
      selected: this.getInitialContactIndex(),
      isLogging: false,
      isCreating: false,
      detailOpen: false,
      deleteConfirmOpen: false,
      hoverOnMoreMenu: false,
    };
    this.downloadRef = createRef();

    /* [RCINT-4301] onSelection would trigger some state changes that would push new
     * properties before the state has been changed. Which would reset the selected value.
     */
  }

  closeDetailDialog = (e) => {
    e.stopPropagation();
    this.setState({
      detailOpen: false,
    });
  }

  componentDidMount() {
    this._mounted = true;
  }

  UNSAFE_componentWillReceiveProps(nextProps: MessageItemProps) {
    if (
      !this._userSelection &&
      (nextProps.conversation.conversationMatches !==
        this.props.conversation.conversationMatches ||
        nextProps.conversation.correspondentMatches !==
          this.props.conversation.correspondentMatches)
    ) {
      this.setState({
        selected: this.getInitialContactIndex(nextProps),
      });
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  stopPropagation = (e) => {
    e.stopPropagation();
  }

  onSelectContact = (value: any, idx: string) => {
    const {
      showContactDisplayPlaceholder,
      autoLog,
      conversation,
      shouldLogSelectRecord,
      onSelectContact,
    } = this.props;
    const selected = showContactDisplayPlaceholder
      ? parseInt(idx, 10) - 1
      : parseInt(idx, 10);
    this._userSelection = true;
    this.setState({
      selected,
    });
    if (autoLog) {
      this.logConversation({ redirect: false, selected, prefill: false });
    }
    if (shouldLogSelectRecord && typeof onSelectContact === 'function') {
      onSelectContact({
        correspondentEntity: this.getSelectedContact(selected),
        conversation,
      });
    }
  };

  getInitialContactIndex(nextProps = this.props) {
    const { correspondentMatches, lastMatchedCorrespondentEntity } =
      nextProps.conversation;
    if (lastMatchedCorrespondentEntity) {
      const index = correspondentMatches.findIndex(
        (contact) => contact.id === lastMatchedCorrespondentEntity.id,
      );
      if (index > -1) return index;
    }
    return this.props.showContactDisplayPlaceholder ? -1 : 0;
  }

  getSelectedContact = (selected = this.state.selected) => {
    const contactMatches = this.props.conversation.correspondentMatches;
    return (
      (selected > -1 && contactMatches[selected]) ||
      (contactMatches.length === 1 && contactMatches[0]) ||
      null
    );
  };

  getMatchEntities() {
    return this.props.conversation.correspondentMatches || [];
  }

  getMatchEntitiesIds() {
    const contactMatches = this.props.conversation.correspondentMatches || [];
    return contactMatches.map((item) => item.id);
  }

  getPhoneNumber() {
    const { correspondents } = this.props.conversation;
    return (
      (correspondents.length === 1 &&
        correspondents[0] &&
        (correspondents[0].phoneNumber || correspondents[0].extensionNumber)) ||
      undefined
    );
  }

  getGroupPhoneNumbers() {
    const { correspondents } = this.props.conversation;
    const groupNumbers =
      correspondents.length > 1
        ? correspondents.map(
            (correspondent) =>
              correspondent.extensionNumber ||
              correspondent.phoneNumber ||
              undefined,
          )
        : null;
    return groupNumbers;
  }

  getFallbackContactName() {
    const { correspondents } = this.props.conversation;
    return (correspondents.length === 1 && correspondents[0].name) || undefined;
  }

  viewSelectedContact = (e) => {
    e.stopPropagation();
    if (typeof this.props.onViewContact === 'function') {
      this.props.onViewContact({
        contact: this.getSelectedContact(),
        contactMatches: this.getMatchEntities(),
        phoneNumber: this.getPhoneNumber(),
        matchEntitiesIds: this.getMatchEntitiesIds(),
      });
    }
  };

  createSelectedContact = async (entityType: unknown) => {
    // console.log('click createSelectedContact!!', entityType);
    if (
      typeof this.props.onCreateContact === 'function' &&
      this._mounted &&
      !this.state.isCreating
    ) {
      this.setState({
        isCreating: true,
      });
      // console.log('start to create: isCreating...', this.state.isCreating);
      const phoneNumber = this.getPhoneNumber();
      await this.props.onCreateContact({
        phoneNumber,
        name: this.props.enableContactFallback
          ? this.getFallbackContactName()
          : '',
        entityType,
      });

      if (this._mounted) {
        this.setState({
          isCreating: false,
        });
        // console.log('created: isCreating...', this.state.isCreating);
      }
    }
  };

  logConversation = async ({
    redirect = true,
    selected,
    prefill = true,
  }: {
    redirect?: boolean;
    selected?: number;
    prefill?: boolean;
  } = {}) => {
    if (
      typeof this.props.onLogConversation === 'function' &&
      this._mounted &&
      !this.state.isLogging
    ) {
      this.setState({
        isLogging: true,
      });
      await this.props.onLogConversation({
        correspondentEntity: this.getSelectedContact(selected),
        conversationId: this.props.conversation.conversationId,
        redirect,
        prefill,
      });
      if (this._mounted) {
        this.setState({
          isLogging: false,
        });
      }
    }
  };

  clickToDial = () => {
    if (this.props.onClickToDial) {
      const contact = this.getSelectedContact() || {};
      const phoneNumber = this.getPhoneNumber();

      if (phoneNumber) {
        this.props.onClickToDial({
          ...contact,
          phoneNumber,
          fromType: this.props.conversation.type,
        });
      }
    }
  };

  onClickToSms = () => {
    if (this.props.onClickToSms) {
      const contact = this.getSelectedContact() || {};
      const phoneNumber = this.getPhoneNumber();

      if (phoneNumber) {
        this.props.updateTypeFilter(messageTypes.text);
        this.props.onClickToSms({
          ...contact,
          phoneNumber,
        });
      }
    }
  };

  onClickWrapper: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (this.contactDisplay && this.contactDisplay.contains(e.target)) {
      return;
    }
    if (messageIsTextMessage(this.props.conversation)) {
      this.props.showConversationDetail(this.props.conversation.conversationId);
    } else {
      this.setState({
        detailOpen: true,
      });
    }
  };

  onPlayVoicemail = () => {
    if (this.props.conversation.unreadCounts > 0) {
      this.props.readMessage(this.props.conversation.conversationId);
    }
  };

  onMarkMessage = () => {
    if (this.props.conversation.unreadCounts === 0) {
      this.props.markMessage(this.props.conversation.conversationId);
    }
  };

  onUnmarkMessage = () => {
    if (this.props.conversation.unreadCounts > 0) {
      this.props.unmarkMessage(this.props.conversation.conversationId);
    }
  };

  onPreviewFax = (uri: string) => {
    this.props.previewFaxMessages(uri, this.props.conversation.conversationId);
  };

  getDetail() {
    const { conversation, currentLocale } = this.props;
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
      return conversation.subject;
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

  onDeleteMessage = () => {
    this.props.deleteMessage(this.props.conversation.conversationId);
  };

  externalViewEntity = () => {
    const { externalViewEntity, conversation } = this.props;
    return externalViewEntity?.(conversation);
  };

  dateTimeFormatter(creationTime?: number, type?: string) {
    try {
      return this.props.dateTimeFormatter({ utcTimestamp: creationTime, type });
    } catch (e) {
      console.error('Format date time error', creationTime);
      return creationTime;
    }
  }

  getDisableClickToSms = () => {
    const {
      areaCode,
      countryCode,
      onClickToSms,
      internalSmsPermission,
      outboundSmsPermission,
      maxExtensionNumberLength,
    } = this.props;
    const phoneNumber = this.getPhoneNumber();
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
    return disableClickToSms;
  };

  getDefaultContactDisplay({
    showUnreadStatus = true,
  } = {}) {
    const {
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
    } = this.props;
    let disableLinks = parentDisableLinks;
    const isVoicemail = type === messageTypes.voiceMail;
    const isFax = type === messageTypes.fax;
    if (isVoicemail && !voicemailAttachment) {
      disableLinks = true;
    }
    if (isFax && !faxAttachment) {
      disableLinks = true;
    }
    const groupNumbers = this.getGroupPhoneNumbers();
    const phoneNumber = this.getPhoneNumber();
    const fallbackName = this.getFallbackContactName();
    const shouldHideNumber =
      enableCDC &&
      checkShouldHidePhoneNumber(phoneNumber, correspondentMatches);
    return (
      <ContactDisplay
        formatPhone={formatPhone}
        reference={(ref) => {
          this.contactDisplay = ref;
        }}
        className={classnames(
          styles.contactDisplay,
          showUnreadStatus && unreadCounts && styles.unread,
        )}
        unread={showUnreadStatus ? !!unreadCounts : false}
        selectedClassName={styles.selectedValue}
        selectClassName={styles.dropdownSelect}
        brand={brand}
        contactMatches={correspondentMatches}
        selected={this.state.selected}
        onSelectContact={this.onSelectContact}
        disabled={disableLinks}
        isLogging={isLogging || this.state.isLogging}
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

  onDownload = (e) => {
    this.downloadRef.current?.click();
  }

  openDeleteDialog = () => {
    this.setState({
      deleteConfirmOpen: true,
    });
  }

  getActions({
    disableLinks,
    phoneNumber,
    disableClickToSms,
    isContactMatchesHidden,
    hasEntity,
    downloadUri,
  }) {
    const {
      conversation: {
        type,
        faxAttachment,
        direction,
        unreadCounts,
        conversationMatches,
        isLogging,
      },
      onClickToDial,
      disableCallButton,
      disableClickToDial,
      onClickToSms,
      currentLocale,
      onCreateContact,
      showLogButton,
      logButtonTitle,
    } = this.props;
    const actions = [];
    if (showLogButton) {
      const isLogged = conversationMatches.length > 0;
      actions.push({
        icon: AddTextLog,
        title: logButtonTitle || i18n.getString(isLogged ? 'editLog' : 'addLog', currentLocale),
        onClick: this.logConversation,
        disabled: disableLinks || isLogging || this.state.isLogging,
      });
    }
    if (type !== messageTypes.fax && onClickToDial) {
      actions.push({
        icon: PhoneBorder,
        title: i18n.getString('call', currentLocale),
        onClick: this.clickToDial,
        disabled: disableLinks || disableCallButton || disableClickToDial || !phoneNumber,
      });
    }
    if (type === messageTypes.voiceMail && onClickToSms) {
      actions.push({
        icon: SmsBorder,
        title: i18n.getString('text', currentLocale),
        onClick: this.onClickToSms,
        disabled: disableLinks || disableClickToSms || !phoneNumber,
      });
    }
    if (
      type === messageTypes.voiceMail ||
      (type === messageTypes.fax && direction === messageDirection.inbound)
    ) {
      // mark/unmark
      actions.push({
        icon: unreadCounts > 0 ? Unread : Read,
        title: i18n.getString(
          unreadCounts > 0 ? 'unmark' : 'mark',
          currentLocale,
        ),
        onClick: unreadCounts > 0 ? this.onUnmarkMessage : this.onMarkMessage,
        disabled: disableLinks,
      });
    }
    if (type === messageTypes.fax) {
      actions.push({
        icon: ViewBorder,
        title: i18n.getString('preview', currentLocale),
        onClick: (e) => {
          this.onPreviewFax(faxAttachment.uri)
        },
        disabled: disableLinks || !faxAttachment,
      });
    }
    if (downloadUri) {
      actions.push({
        icon: Download,
        title: i18n.getString('download', currentLocale),
        onClick: this.onDownload,
        disabled: disableLinks,
      });
    }
    if (!isContactMatchesHidden || hasEntity) {
      actions.push({
        icon: People,
        title: i18n.getString('viewDetails', currentLocale),
        onClick: this.viewSelectedContact,
        disabled: disableLinks,
      });
    }
    if (!hasEntity && phoneNumber && onCreateContact) {
      actions.push({
        icon: AddMemberBorder,
        title: i18n.getString('addEntity', currentLocale),
        onClick: () => {
          this.createSelectedContact(undefined);
        },
        disabled: disableLinks,
      });
    }
    if (type === messageTypes.fax || type === messageTypes.voiceMail) {
      actions.push({
        icon: Delete,
        title: i18n.getString('delete', currentLocale),
        onClick: this.openDeleteDialog,
        disabled: disableLinks,
      });
    }
    return actions;
  }

  override render() {
    const {
      currentLocale,
      conversation: {
        conversationId,
        unreadCounts,
        correspondents,
        correspondentMatches,
        conversationMatches,
        creationTime,
        isLogging,
        type,
        direction,
        voicemailAttachment,
        faxAttachment,
        self,
      },
      disableLinks: parentDisableLinks,
      disableCallButton,
      disableClickToDial,
      onClickToDial,
      onClickToSms,
      onViewContact,
      onCreateContact,
      enableCDC,
      renderContactName,
      conversation,
      showLogButton,
      logButtonTitle,
    } = this.props;
    let disableLinks = parentDisableLinks;
    const isVoicemail = type === messageTypes.voiceMail;
    const isFax = type === messageTypes.fax;
    if (isVoicemail && !voicemailAttachment) {
      disableLinks = true;
    }
    if (isFax && !faxAttachment) {
      disableLinks = true;
    }
    const phoneNumber = this.getPhoneNumber();
    const isContactMatchesHidden =
      enableCDC && checkShouldHideContactUser(correspondentMatches);
    const detail = this.getDetail();
    const disableClickToSms = this.getDisableClickToSms();
    const msgItem = `${type}MessageItem`;
    const defaultContactDisplayWithUnread = this.getDefaultContactDisplay();
    const defaultContactDisplayWithoutUnread = this.getDefaultContactDisplay({
      showUnreadStatus: false,
    });
    const hasEntity = (
      correspondents.length === 1 &&
      !!correspondentMatches.length &&
      (this.getSelectedContact()?.type ?? '') !== extensionTypes.ivrMenu
    );
    let downloadUri = null;
    if (faxAttachment) {
      downloadUri = faxAttachment.uri;
    } else if (voicemailAttachment) {
      downloadUri = voicemailAttachment.uri;
    }
    const actions = this.getActions({
      disableLinks,
      phoneNumber,
      disableClickToSms,
      isContactMatchesHidden,
      hasEntity,
      downloadUri
    });
    return (
      <StyledListItem
        data-sign={msgItem}
        data-id={conversationId}
        className={styles.root}
        onClick={this.onClickWrapper}
        $hoverOnMoreMenu={this.state.hoverOnMoreMenu}
      >
        <StyledItemIcon>
          <ConversationIcon
            group={correspondents && correspondents.length > 1}
            type={type}
            currentLocale={currentLocale}
            direction={direction}
            color={unreadCounts ? 'action.primary' : 'neutral.f06'}
          />
        </StyledItemIcon>
        <RcListItemText
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
            <StyledSecondary>
              <DetailArea>
                {detail}
              </DetailArea>
              <span className="conversation-item-time">
                {this.dateTimeFormatter(creationTime)}
              </span>
            </StyledSecondary>
          }
        />
        <StyledActionMenu
          actions={actions}
          size="small"
          maxActions={3}
          className="conversation-item-action-menu"
          iconVariant="contained"
          color="neutral.b01"
          onClick={this.stopPropagation}
          onMoreMenuOpen={(open) => {
            this.setState({
              hoverOnMoreMenu: open,
            });
          }}
        />
        {
          type !== messageTypes.text ? (
            <DetailDialog
              open={this.state.detailOpen}
              onClose={this.closeDetailDialog}
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
              correspondents={correspondents}
              self={self}
              type={type}
              currentLocale={currentLocale}
              direction={direction}
              voicemailAttachment={voicemailAttachment}
              faxAttachment={faxAttachment}
              onDelete={this.openDeleteDialog}
              time={this.dateTimeFormatter(creationTime, 'datetime')}
              detail={detail}
              onPreviewFax={this.onPreviewFax}
              disableLinks={disableLinks}
              unread={unreadCounts > 0}
              onMarkMessage={this.onMarkMessage}
              onUnmarkMessage={this.onUnmarkMessage}
              onPlayVoicemail={this.onPlayVoicemail}
              shouldHideEntityButton={isContactMatchesHidden}
              onLog={this.logConversation}
              onViewEntity={onViewContact && this.viewSelectedContact}
              onCreateEntity={onCreateContact && this.createSelectedContact}
              hasEntity={hasEntity}
              onClickToDial={
                !isFax ? onClickToDial && this.clickToDial : undefined
              }
              onClickToSms={
                isVoicemail ? onClickToSms && this.onClickToSms : undefined
              }
              disableClickToSms={disableClickToSms}
              phoneNumber={phoneNumber}
              disableCallButton={disableCallButton}
              disableClickToDial={disableClickToDial}
              showLogButton={showLogButton}
              logButtonTitle={logButtonTitle}
              isLogging={isLogging || this.state.isLogging}
              isLogged={conversationMatches.length > 0}
              isCreating={this.state.isCreating}
              onDownload={this.onDownload}
            />
          ) : null
        }
        {
          (type == messageTypes.fax || type == messageTypes.voiceMail) ?
            (
              <ConfirmDialog
                open={this.state.deleteConfirmOpen}
                onClose={() => {
                  this.setState({
                    deleteConfirmOpen: false,
                  })
                }}
                onClick={this.stopPropagation}
                onConfirm={this.onDeleteMessage}
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
              ref={this.downloadRef}
              href={`${downloadUri}&contentDisposition=Attachment`}
            ></DownloadLink>
          ) : null
        }
      </StyledListItem>
    );
  }
}

export default MessageItem;
