import React, { Component } from 'react';
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
import { AddTextLog } from '@ringcentral/juno-icon';
import MessageInput from '../MessageInput';
import type { Attachment } from '../MessageInput';
import { BackHeader } from '../BackHeader';
import { ConversationMessageList } from '../ConversationMessageList';

const LogButton = styled(RcIconButton)`
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
  conversation: {
    conversationMatches: any[];
    correspondentMatches: any[];
    lastMatchedCorrespondentEntity: {
      id: string;
    };
    correspondents: any[];
    isLogging: boolean;
    conversationId: string;
  };
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
}

type ConversationPanelState = {
  selected: number;
  isLogging: boolean;
  inputHeight: number;
  loaded: boolean;
  alertHeight: number;
}

class ConversationPanel extends Component<ConversationProps, ConversationPanelState> {
  _mounted: any;
  _userSelection: any;
  dncAlert: any;
  constructor(props: any) {
    super(props);
    this.state = {
      selected: this.getInitialContactIndex(),
      isLogging: false,
      inputHeight: 101, // Updated with new input
      loaded: false,
      alertHeight: 46,
    };
    this._userSelection = false;
  }

  static defaultProps: Partial<ConversationProps> = {
    isWide: true,
    disableLinks: false,
    onLogConversation: undefined,
    autoLog: false,
    enableContactFallback: undefined,
    showContactDisplayPlaceholder: true,
    contactPlaceholder: '',
    sourceIcons: undefined,
    phoneTypeRenderer: undefined,
    phoneSourceNameRenderer: undefined,
    showGroupNumberName: false,
    messageText: '',
    updateMessageText: () => null,
    messageSubjectRenderer: undefined,
    perPage: undefined,
    loadConversation: () => null,
    renderExtraButton: undefined,
    showLogButton: false,
    logButtonTitle: '',
    loadingNextPage: false,
    inputExpandable: undefined,
    attachments: [],
    supportAttachment: false,
    addAttachment: () => null,
    removeAttachment: () => null,
    onAttachmentDownload: undefined,
    restrictSendMessage: undefined,
    shouldLogSelectRecord: false,
    onSelectContact: undefined,
    renderContactList: undefined,
    renderLogInfoSection: undefined,
    dropdownClassName: null,
    enableCDC: false,
    renderConversationTitle: undefined,
    isMultipleSiteEnabled: false,
    currentSiteCode: '',
    maxExtensionNumberLength: 6,
  }

  override componentDidMount() {
    if (!this.props.showSpinner) {
      this.loadConversation();
    }
    this._mounted = true;
  }

  override UNSAFE_componentWillReceiveProps(nextProps: any) {
    if (
      !this._userSelection &&
      this.props.conversation &&
      nextProps.conversation &&
      (nextProps.conversation.conversationMatches !==
        this.props.conversation.conversationMatches ||
        nextProps.conversation.correspondentMatches !==
          this.props.conversation.correspondentMatches)
    ) {
      this.setState({
        selected: this.getInitialContactIndex(nextProps),
      });
    }
    if (!nextProps.showSpinner && this.props.showSpinner) {
      this.loadConversation();
    }
  }

  componentDidUpdate(prevProps: any, prevState: any) {
    if (prevProps.messages !== this.props.messages) {
      this.props.readMessages(this.props.conversationId);
    }
    if (prevState.loaded === false && this.state.loaded === true) {
      if (this.props.messages.length < this.props.perPage) {
        this.props.loadPreviousMessages();
      }
      this.getDncAlertHeight();
    }
  }

  componentWillUnmount() {
    this._mounted = false;
    this.props.unloadConversation();
  }

  onSend = (text: any, attachments: any) => {
    const selectedContact = this.getSelectedContact();
    this.props.replyToReceivers(text, attachments, selectedContact);
  };

  onInputHeightChange = (value: any) => {
    this.setState({
      inputHeight: value,
    });
  };

  onSelectContact = (value: any, idx: any) => {
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

  getMessageListHeight() {
    const { restrictSendMessage, renderLogInfoSection, isWide } = this.props;

    const { alertHeight, inputHeight } = this.state;
    const headerHeight = 41;
    const alertMargin = 12;
    const logInfoHeight = isWide ? 60 : 100;
    let extraHeight = 0;
    if (restrictSendMessage?.(this.getSelectedContact())) {
      extraHeight = alertHeight + alertMargin + headerHeight;
    } else {
      extraHeight = inputHeight + headerHeight;
    }
    if (typeof renderLogInfoSection === 'function') {
      extraHeight += logInfoHeight;
    }
    return `calc(100% - ${extraHeight}px)`;
  }

  getDncAlertHeight() {
    if (this.dncAlert) {
      this.setState({
        alertHeight: this.dncAlert.clientHeight,
      });
    }
  }

  getSelectedContact = (selected = this.state.selected) => {
    if (!this.props.conversation) {
      return null;
    }
    const contactMatches = this.props.conversation.correspondentMatches;
    return (
      (selected > -1 && contactMatches[selected]) ||
      (contactMatches.length === 1 && contactMatches[0]) ||
      null
    );
  };

  getInitialContactIndex(nextProps = this.props) {
    const {
      correspondentMatches,
      lastMatchedCorrespondentEntity,
      conversationMatches,
    } = nextProps.conversation;
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

  getPhoneNumber() {
    const { conversation: { correspondents = [] } = {} } = this.props;
    return (
      (correspondents.length === 1 &&
        (correspondents[0].phoneNumber || correspondents[0].extensionNumber)) ||
      undefined
    );
  }

  getGroupPhoneNumbers() {
    const { conversation: { correspondents = [] } = {} } = this.props;
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

  getFallbackContactName() {
    const { conversation: { correspondents = [] } = {} } = this.props;
    return (correspondents.length === 1 && correspondents[0].name) || undefined;
  }

  loadConversation() {
    this.props.loadConversation(this.props.conversationId);
    this.setState({ loaded: true });
  }

  async logConversation({
    redirect = true,
    selected,
    prefill = true,
  }: any = {}) {
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
  }

  // @ts-expect-error TS(2300): Duplicate identifier 'logConversation'.
  logConversation = this.logConversation.bind(this);

  render() {
    if (!this.state.loaded) {
      return (
        <div className={styles.root}>
          <SpinnerOverlay />
        </div>
      );
    }
    let conversationBody = null;
    const loading = this.props.showSpinner;
    const { recipients, messageSubjectRenderer } = this.props;
    if (!loading) {
      conversationBody = (
        <ConversationMessageList
          currentLocale={this.props.currentLocale}
          height={this.getMessageListHeight()}
          messages={this.props.messages}
          dateTimeFormatter={this.props.dateTimeFormatter}
          showSender={recipients && recipients.length > 1}
          messageSubjectRenderer={messageSubjectRenderer}
          formatPhone={this.props.formatPhone}
          loadingNextPage={this.props.loadingNextPage}
          loadPreviousMessages={this.props.loadPreviousMessages}
          onAttachmentDownload={this.props.onAttachmentDownload}
          onLinkClick={this.props.onLinkClick}
        />
      );
    }
    const { isLogging, conversationMatches, correspondentMatches } =
      this.props.conversation;
    const groupNumbers = this.getGroupPhoneNumbers();
    const phoneNumber = this.getPhoneNumber();
    // TODO: Confirm on group messages similar to MessageItem
    const shouldHideNumber =
      this.props.enableCDC &&
      checkShouldHidePhoneNumber(phoneNumber, correspondentMatches);
    const fallbackName = this.getFallbackContactName();
    const logButton =
      this.props.onLogConversation &&
      this.props.showLogButton  ? (
        <LogButton
          onClick={this.logConversation}
          disabled={this.props.disableLinks || isLogging || this.state.isLogging}
          title={
            this.props.logButtonTitle ||
            messageItemI18n.getString(
              conversationMatches.length > 0 ? 'editLog' : 'addLog',
              this.props.currentLocale
            )
          }
          data-sign="logButton"
          symbol={AddTextLog}
        />
      ) : null;

    const defaultContactDisplay = (
      <ContactDisplay
        currentSiteCode={this.props.currentSiteCode}
        maxExtensionNumberLength={this.props.maxExtensionNumberLength}
        isMultipleSiteEnabled={this.props.isMultipleSiteEnabled}
        brand={this.props.brand}
        className={styles.contactDisplay}
        selectClassName={styles.contactDisplaySelect}
        contactMatches={correspondentMatches || []}
        selected={this.state.selected}
        onSelectContact={this.onSelectContact}
        disabled={this.props.disableLinks}
        isLogging={isLogging || this.state.isLogging}
        fallBackName={fallbackName}
        areaCode={this.props.areaCode}
        countryCode={this.props.countryCode}
        phoneNumber={shouldHideNumber ? null : phoneNumber}
        groupNumbers={groupNumbers}
        showType={false}
        currentLocale={this.props.currentLocale}
        enableContactFallback={this.props.enableContactFallback}
        placeholder={this.props.contactPlaceholder}
        showPlaceholder={this.props.showContactDisplayPlaceholder}
        sourceIcons={this.props.sourceIcons}
        phoneTypeRenderer={this.props.phoneTypeRenderer}
        phoneSourceNameRenderer={this.props.phoneSourceNameRenderer}
        showGroupNumberName={this.props.showGroupNumberName}
        dropdownRenderFunction={this.props.renderContactList}
        dropdownClassName={this.props.dropdownClassName}
      />
    );
    return (
      <Root data-sign="conversationPanel">
        <BackHeader
          onBack={this.props.goBack}
        >
          {this.props.renderConversationTitle?.({
            conversation: this.props.conversation,
            phoneNumber,
            defaultContactDisplay,
          }) || defaultContactDisplay}
          {logButton}
        </BackHeader>
        {this.props.renderLogInfoSection?.(this.props.conversation) || null}
        {conversationBody}
        {this.props.restrictSendMessage?.(this.getSelectedContact()) ? (
          <RcAlert
            ref={(target: any) => {
              this.dncAlert = target;
            }}
            severity="error"
            size="small"
            className={styles.alert}
            data-sign="dncAlert"
          >
            {i18n.getString('dncAlert', this.props.currentLocale)}
          </RcAlert>
        ) : (
          <MessageInput
            value={this.props.messageText}
            onChange={this.props.updateMessageText}
            sendButtonDisabled={this.props.sendButtonDisabled}
            currentLocale={this.props.currentLocale}
            onSend={this.onSend}
            onHeightChange={this.onInputHeightChange}
            inputExpandable={this.props.inputExpandable}
            attachments={this.props.attachments}
            addAttachment={this.props.addAttachment}
            removeAttachment={this.props.removeAttachment}
            additionalToolbarButtons={this.props.additionalToolbarButtons}
            onClickAdditionalToolbarButton={this.props.onClickAdditionalToolbarButton}
            showTemplate={this.props.showTemplate}
            templates={this.props.templates}
            showTemplateManagement={this.props.showTemplateManagement}
            loadTemplates={this.props.loadTemplates}
            deleteTemplate={this.props.deleteTemplate}
            createOrUpdateTemplate={this.props.createOrUpdateTemplate}
            sortTemplates={this.props.sortTemplates}
          />
        )}
      </Root>
    );
  }
}

export default ConversationPanel;
