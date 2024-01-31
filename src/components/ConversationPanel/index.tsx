import React, { Component } from 'react';

import PropTypes from 'prop-types';

import ContactDisplay
  from '@ringcentral-integration/widgets/components/ContactDisplay';
import ConversationMessageList
  from '@ringcentral-integration/widgets/components/ConversationMessageList';
import i18n
  from '@ringcentral-integration/widgets/components/ConversationPanel/i18n';
import styles
  from '@ringcentral-integration/widgets/components/ConversationPanel/styles.scss';
import LogButton from '@ringcentral-integration/widgets/components/LogButton';
import {
  SpinnerOverlay,
} from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import {
  checkShouldHidePhoneNumber,
} from '@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber';
import { RcAlert } from '@ringcentral/juno';
import MessageInput from '../MessageInput';
import { BackHeader } from '../BackHeader';

class ConversationPanel extends Component {
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

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  componentDidMount() {
    // @ts-expect-error TS(2339): Property 'showSpinner' does not exist on type 'Rea... Remove this comment to see the full error message
    if (!this.props.showSpinner) {
      this.loadConversation();
    }
    this._mounted = true;
  }

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  UNSAFE_componentWillReceiveProps(nextProps: any) {
    if (
      !this._userSelection &&
      // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
      this.props.conversation &&
      nextProps.conversation &&
      (nextProps.conversation.conversationMatches !==
        // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
        this.props.conversation.conversationMatches ||
        nextProps.conversation.correspondentMatches !==
          // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
          this.props.conversation.correspondentMatches)
    ) {
      this.setState({
        selected: this.getInitialContactIndex(nextProps),
      });
    }
    // @ts-expect-error TS(2339): Property 'showSpinner' does not exist on type 'Rea... Remove this comment to see the full error message
    if (!nextProps.showSpinner && this.props.showSpinner) {
      this.loadConversation();
    }
  }

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  componentDidUpdate(prevProps: any, prevState: any) {
    // @ts-expect-error TS(2339): Property 'messages' does not exist on type 'Readon... Remove this comment to see the full error message
    if (prevProps.messages !== this.props.messages) {
      // @ts-expect-error TS(2339): Property 'readMessages' does not exist on type 'Re... Remove this comment to see the full error message
      this.props.readMessages(this.props.conversationId);
    }
    // @ts-expect-error TS(2339): Property 'loaded' does not exist on type 'Readonly... Remove this comment to see the full error message
    if (prevState.loaded === false && this.state.loaded === true) {
      // @ts-expect-error TS(2339): Property 'messages' does not exist on type 'Readon... Remove this comment to see the full error message
      if (this.props.messages.length < this.props.perPage) {
        // @ts-expect-error TS(2339): Property 'loadPreviousMessages' does not exist on ... Remove this comment to see the full error message
        this.props.loadPreviousMessages();
      }
      this.getDncAlertHeight();
    }
  }

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  componentWillUnmount() {
    this._mounted = false;
    // @ts-expect-error TS(2339): Property 'unloadConversation' does not exist on ty... Remove this comment to see the full error message
    this.props.unloadConversation();
  }

  onSend = (text: any, attachments: any) => {
    const selectedContact = this.getSelectedContact();
    // @ts-expect-error TS(2339): Property 'replyToReceivers' does not exist on type... Remove this comment to see the full error message
    this.props.replyToReceivers(text, attachments, selectedContact);
  };

  onInputHeightChange = (value: any) => {
    this.setState({
      inputHeight: value,
    });
  };

  onSelectContact = (value: any, idx: any) => {
    const {
      // @ts-expect-error TS(2339): Property 'showContactDisplayPlaceholder' does not ... Remove this comment to see the full error message
      showContactDisplayPlaceholder,
      // @ts-expect-error TS(2339): Property 'autoLog' does not exist on type 'Readonl... Remove this comment to see the full error message
      autoLog,
      // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
      conversation,
      // @ts-expect-error TS(2339): Property 'shouldLogSelectRecord' does not exist on... Remove this comment to see the full error message
      shouldLogSelectRecord,
      // @ts-expect-error TS(2339): Property 'onSelectContact' does not exist on type ... Remove this comment to see the full error message
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
    // @ts-expect-error TS(2339): Property 'restrictSendMessage' does not exist on t... Remove this comment to see the full error message
    const { restrictSendMessage, renderLogInfoSection, isWide } = this.props;

    // @ts-expect-error TS(2339): Property 'alertHeight' does not exist on type 'Rea... Remove this comment to see the full error message
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

  // @ts-expect-error TS(2339): Property 'selected' does not exist on type 'Readon... Remove this comment to see the full error message
  getSelectedContact = (selected = this.state.selected) => {
    // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
    if (!this.props.conversation) {
      return null;
    }
    // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
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
      // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
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
    // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
    const { conversation: { correspondents = [] } = {} } = this.props;
    return (
      (correspondents.length === 1 &&
        (correspondents[0].phoneNumber || correspondents[0].extensionNumber)) ||
      undefined
    );
  }

  getGroupPhoneNumbers() {
    // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
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
    // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
    const { conversation: { correspondents = [] } = {} } = this.props;
    return (correspondents.length === 1 && correspondents[0].name) || undefined;
  }

  loadConversation() {
    // @ts-expect-error TS(2339): Property 'loadConversation' does not exist on type... Remove this comment to see the full error message
    this.props.loadConversation(this.props.conversationId);
    this.setState({ loaded: true });
  }

  async logConversation({
    redirect = true,
    selected,
    prefill = true,
  }: any = {}) {
    if (
      // @ts-expect-error TS(2339): Property 'onLogConversation' does not exist on typ... Remove this comment to see the full error message
      typeof this.props.onLogConversation === 'function' &&
      this._mounted &&
      // @ts-expect-error TS(2339): Property 'isLogging' does not exist on type 'Reado... Remove this comment to see the full error message
      !this.state.isLogging
    ) {
      this.setState({
        isLogging: true,
      });
      // @ts-expect-error TS(2339): Property 'onLogConversation' does not exist on typ... Remove this comment to see the full error message
      await this.props.onLogConversation({
        correspondentEntity: this.getSelectedContact(selected),
        // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
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

  // @ts-expect-error TS(4114): This member must have an 'override' modifier becau... Remove this comment to see the full error message
  render() {
    // @ts-expect-error TS(2339): Property 'loaded' does not exist on type 'Readonly... Remove this comment to see the full error message
    if (!this.state.loaded) {
      return (
        <div className={styles.root}>
          <SpinnerOverlay />
        </div>
      );
    }
    let conversationBody = null;
    // @ts-expect-error TS(2339): Property 'showSpinner' does not exist on type 'Rea... Remove this comment to see the full error message
    const loading = this.props.showSpinner;
    // @ts-expect-error TS(2339): Property 'recipients' does not exist on type 'Read... Remove this comment to see the full error message
    const { recipients, messageSubjectRenderer } = this.props;
    if (!loading) {
      conversationBody = (
        <ConversationMessageList
          // @ts-expect-error TS(2769): No overload matches this call.
          currentLocale={this.props.currentLocale}
          height={this.getMessageListHeight()}
          // @ts-expect-error TS(2339): Property 'messages' does not exist on type 'Readon... Remove this comment to see the full error message
          messages={this.props.messages}
          className={styles.conversationBody}
          // @ts-expect-error TS(2339): Property 'dateTimeFormatter' does not exist on typ... Remove this comment to see the full error message
          dateTimeFormatter={this.props.dateTimeFormatter}
          showSender={recipients && recipients.length > 1}
          messageSubjectRenderer={messageSubjectRenderer}
          // @ts-expect-error TS(2339): Property 'formatPhone' does not exist on type 'Rea... Remove this comment to see the full error message
          formatPhone={this.props.formatPhone}
          // @ts-expect-error TS(2339): Property 'loadingNextPage' does not exist on type ... Remove this comment to see the full error message
          loadingNextPage={this.props.loadingNextPage}
          // @ts-expect-error TS(2339): Property 'loadPreviousMessages' does not exist on ... Remove this comment to see the full error message
          loadPreviousMessages={this.props.loadPreviousMessages}
          // @ts-expect-error TS(2339): Property 'onAttachmentDownload' does not exist on ... Remove this comment to see the full error message
          onAttachmentDownload={this.props.onAttachmentDownload}
          // @ts-expect-error TS(2339): Property 'onLinkClick' does not exist on ... Remove this comment to see the full error message
          onLinkClick={this.props.onLinkClick}
        />
      );
    }
    const { isLogging, conversationMatches, correspondentMatches } =
      // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
      this.props.conversation;
    const groupNumbers = this.getGroupPhoneNumbers();
    const phoneNumber = this.getPhoneNumber();
    // TODO: Confirm on group messages similar to MessageItem
    const shouldHideNumber =
      // @ts-expect-error TS(2339): Property 'enableCDC' does not exist on type 'Reado... Remove this comment to see the full error message
      this.props.enableCDC &&
      checkShouldHidePhoneNumber(phoneNumber, correspondentMatches);
    const fallbackName = this.getFallbackContactName();
    // @ts-expect-error TS(2339): Property 'renderExtraButton' does not exist on typ... Remove this comment to see the full error message
    const extraButton = this.props.renderExtraButton
      ? // @ts-expect-error TS(2339): Property 'renderExtraButton' does not exist on typ... Remove this comment to see the full error message
        this.props.renderExtraButton(this.props.conversation, {
          logConversation: this.logConversation,
          // @ts-expect-error TS(2339): Property 'isLogging' does not exist on type 'Reado... Remove this comment to see the full error message
          isLogging: isLogging || this.state.isLogging,
        })
      : null;
    const logButton =
      // @ts-expect-error TS(2339): Property 'onLogConversation' does not exist on typ... Remove this comment to see the full error message
      this.props.onLogConversation &&
      // @ts-expect-error TS(2339): Property 'renderExtraButton' does not exist on typ... Remove this comment to see the full error message
      !this.props.renderExtraButton &&
      // @ts-expect-error TS(2339): Property 'renderLogInfoSection' does not exist on ... Remove this comment to see the full error message
      !this.props.renderLogInfoSection ? (
        <LogButton
          className={styles.logButton}
          onLog={this.logConversation}
          // @ts-expect-error TS(2339): Property 'disableLinks' does not exist on type 'Re... Remove this comment to see the full error message
          disableLinks={this.props.disableLinks}
          isLogged={conversationMatches.length > 0}
          // @ts-expect-error TS(2339): Property 'isLogging' does not exist on type 'Reado... Remove this comment to see the full error message
          isLogging={isLogging || this.state.isLogging}
          // @ts-expect-error TS(2322): Type '{ className: string; onLog: ({ redirect, sel... Remove this comment to see the full error message
          currentLocale={this.props.currentLocale}
        />
      ) : null;

    const defaultContactDisplay = (
      <ContactDisplay
        // @ts-expect-error TS(2339): Property 'currentSiteCode' does not exist on type ... Remove this comment to see the full error message
        currentSiteCode={this.props.currentSiteCode}
        // @ts-expect-error TS(2339): Property 'maxExtensionNumberLength' does not exist... Remove this comment to see the full error message
        maxExtensionNumberLength={this.props.maxExtensionNumberLength}
        // @ts-expect-error TS(2339): Property 'isMultipleSiteEnabled' does not exist on... Remove this comment to see the full error message
        isMultipleSiteEnabled={this.props.isMultipleSiteEnabled}
        // @ts-expect-error TS(2339): Property 'brand' does not exist on type 'Readonly<... Remove this comment to see the full error message
        brand={this.props.brand}
        className={styles.contactDisplay}
        selectClassName={styles.contactDisplaySelect}
        contactMatches={correspondentMatches || []}
        // @ts-expect-error TS(2339): Property 'selected' does not exist on type 'Readon... Remove this comment to see the full error message
        selected={this.state.selected}
        onSelectContact={this.onSelectContact}
        // @ts-expect-error TS(2339): Property 'disableLinks' does not exist on type 'Re... Remove this comment to see the full error message
        disabled={this.props.disableLinks}
        // @ts-expect-error TS(2339): Property 'isLogging' does not exist on type 'Reado... Remove this comment to see the full error message
        isLogging={isLogging || this.state.isLogging}
        fallBackName={fallbackName}
        // @ts-expect-error TS(2339): Property 'areaCode' does not exist on type 'Readon... Remove this comment to see the full error message
        areaCode={this.props.areaCode}
        // @ts-expect-error TS(2339): Property 'countryCode' does not exist on type 'Rea... Remove this comment to see the full error message
        countryCode={this.props.countryCode}
        phoneNumber={shouldHideNumber ? null : phoneNumber}
        groupNumbers={groupNumbers}
        showType={false}
        // @ts-expect-error TS(2339): Property 'currentLocale' does not exist on type 'R... Remove this comment to see the full error message
        currentLocale={this.props.currentLocale}
        // @ts-expect-error TS(2339): Property 'enableContactFallback' does not exist on... Remove this comment to see the full error message
        enableContactFallback={this.props.enableContactFallback}
        // @ts-expect-error TS(2339): Property 'contactPlaceholder' does not exist on ty... Remove this comment to see the full error message
        placeholder={this.props.contactPlaceholder}
        // @ts-expect-error TS(2339): Property 'showContactDisplayPlaceholder' does not ... Remove this comment to see the full error message
        showPlaceholder={this.props.showContactDisplayPlaceholder}
        // @ts-expect-error TS(2339): Property 'sourceIcons' does not exist on type 'Rea... Remove this comment to see the full error message
        sourceIcons={this.props.sourceIcons}
        // @ts-expect-error TS(2322): Type '{ currentSiteCode: any; maxExtensionNumberLe... Remove this comment to see the full error message
        phoneTypeRenderer={this.props.phoneTypeRenderer}
        // @ts-expect-error TS(2339): Property 'phoneSourceNameRenderer' does not exist ... Remove this comment to see the full error message
        phoneSourceNameRenderer={this.props.phoneSourceNameRenderer}
        // @ts-expect-error TS(2339): Property 'showGroupNumberName' does not exist on t... Remove this comment to see the full error message
        showGroupNumberName={this.props.showGroupNumberName}
        // @ts-expect-error TS(2339): Property 'renderContactList' does not exist on typ... Remove this comment to see the full error message
        dropdownRenderFunction={this.props.renderContactList}
        // @ts-expect-error TS(2339): Property 'dropdownClassName' does not exist on typ... Remove this comment to see the full error message
        dropdownClassName={this.props.dropdownClassName}
      />
    );
    return (
      <div className={styles.root}>
        <BackHeader
          data-sign="conversationPanel"
          onBack={this.props.goBack}
        >
          {/* @ts-expect-error TS(2339): Property 'renderConversationTitle' does */}
          {this.props.renderConversationTitle?.({
            // @ts-expect-error TS(2339): Property 'conversation' does not exist on type 'Re... Remove this comment to see the full error message
            conversation: this.props.conversation,
            phoneNumber,
            defaultContactDisplay,
          }) || defaultContactDisplay}
          {extraButton && <div className={styles.logButton}>{extraButton}</div>}
          {logButton}
        </BackHeader>
        {/* @ts-expect-error TS(2339): Property 'renderLogInfoSection' does not */}
        {this.props.renderLogInfoSection?.(this.props.conversation) || null}
        {conversationBody}
        {/* @ts-expect-error TS(2339): Property 'restrictSendMessage' does not */}
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
            {/* @ts-expect-error TS(2339): Property 'currentLocale' does not */}
            {i18n.getString('dncAlert', this.props.currentLocale)}
          </RcAlert>
        ) : (
          <MessageInput
            // @ts-expect-error TS(2339): Property 'messageText' does not exist on type 'Rea... Remove this comment to see the full error message
            value={this.props.messageText}
            // @ts-expect-error TS(2339): Property 'updateMessageText' does not exist on typ... Remove this comment to see the full error message
            onChange={this.props.updateMessageText}
            // @ts-expect-error TS(2339): Property 'sendButtonDisabled' does not exist on ty... Remove this comment to see the full error message
            sendButtonDisabled={this.props.sendButtonDisabled}
            // @ts-expect-error TS(2339): Property 'currentLocale' does not exist on type 'R... Remove this comment to see the full error message
            currentLocale={this.props.currentLocale}
            onSend={this.onSend}
            onHeightChange={this.onInputHeightChange}
            // @ts-expect-error TS(2339): Property 'inputExpandable' does not exist on type ... Remove this comment to see the full error message
            inputExpandable={this.props.inputExpandable}
            // @ts-expect-error TS(2339): Property 'attachments' does not exist on type 'Rea... Remove this comment to see the full error message
            attachments={this.props.attachments}
            // @ts-expect-error TS(2339): Property 'supportAttachment' does not exist on typ... Remove this comment to see the full error message
            supportAttachment={this.props.supportAttachment}
            // @ts-expect-error TS(2339): Property 'addAttachment' does not exist on type 'R... Remove this comment to see the full error message
            addAttachment={this.props.addAttachment}
            // @ts-expect-error TS(2339): Property 'removeAttachment' does not exist on type... Remove this comment to see the full error message
            removeAttachment={this.props.removeAttachment}
            additionalToolbarButtons={this.props.additionalToolbarButtons}
            onClickAdditionalToolbarButton={this.props.onClickAdditionalToolbarButton}
          />
        )}
      </div>
    );
  }
}

// @ts-expect-error TS(2339): Property 'propTypes' does not exist on type 'typeo... Remove this comment to see the full error message
ConversationPanel.propTypes = {
  isWide: PropTypes.bool,
  brand: PropTypes.string.isRequired,
  replyToReceivers: PropTypes.func.isRequired,
  // @ts-expect-error TS(2339): Property 'propTypes' does not exist on type 'typeo... Remove this comment to see the full error message
  messages: ConversationMessageList.propTypes.messages,
  updateMessageText: PropTypes.func,
  messageText: PropTypes.string,
  recipients: PropTypes.arrayOf(
    PropTypes.shape({
      phoneNumber: PropTypes.string,
      extensionNumber: PropTypes.string,
      name: PropTypes.string,
    }),
  ).isRequired,
  sendButtonDisabled: PropTypes.bool.isRequired,
  currentLocale: PropTypes.string.isRequired,
  showSpinner: PropTypes.bool.isRequired,
  disableLinks: PropTypes.bool,
  conversation: PropTypes.object.isRequired,
  onLogConversation: PropTypes.func,
  areaCode: PropTypes.string.isRequired,
  countryCode: PropTypes.string.isRequired,
  autoLog: PropTypes.bool,
  enableContactFallback: PropTypes.bool,
  dateTimeFormatter: PropTypes.func.isRequired,
  goBack: PropTypes.func.isRequired,
  showContactDisplayPlaceholder: PropTypes.bool,
  contactPlaceholder: PropTypes.string,
  sourceIcons: PropTypes.object,
  phoneTypeRenderer: PropTypes.func,
  phoneSourceNameRenderer: PropTypes.func,
  showGroupNumberName: PropTypes.bool,
  messageSubjectRenderer: PropTypes.func,
  formatPhone: PropTypes.func.isRequired,
  readMessages: PropTypes.func.isRequired,
  loadPreviousMessages: PropTypes.func.isRequired,
  unloadConversation: PropTypes.func.isRequired,
  perPage: PropTypes.number,
  conversationId: PropTypes.string.isRequired,
  loadConversation: PropTypes.func,
  renderExtraButton: PropTypes.func,
  loadingNextPage: PropTypes.bool,
  inputExpandable: PropTypes.bool,
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      size: PropTypes.number,
      name: PropTypes.string,
    }),
  ),
  supportAttachment: PropTypes.bool,
  addAttachment: PropTypes.func,
  removeAttachment: PropTypes.func,
  onAttachmentDownload: PropTypes.func,
  restrictSendMessage: PropTypes.func,
  shouldLogSelectRecord: PropTypes.bool,
  onSelectContact: PropTypes.func,
  renderContactList: PropTypes.func,
  renderLogInfoSection: PropTypes.func,
  dropdownClassName: PropTypes.string,
  enableCDC: PropTypes.bool,
  renderConversationTitle: PropTypes.func,
  isMultipleSiteEnabled: PropTypes.bool,
  currentSiteCode: PropTypes.string,
  maxExtensionNumberLength: PropTypes.number,
  additionalToolbarButtons: PropTypes.arrayOf(PropTypes.object),
  onClickAdditionalToolbarButton: PropTypes.func,
};
// @ts-expect-error TS(2339): Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
ConversationPanel.defaultProps = {
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
};

export default ConversationPanel;
