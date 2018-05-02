import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dynamicsFont from 'ringcentral-widgets/assets/DynamicsFont/DynamicsFont.scss';

import Spinner from 'ringcentral-widgets/components/Spinner';
import LogButton from 'ringcentral-widgets/components/LogButton';
import ContactDisplay from 'ringcentral-widgets/components/ContactDisplay';
import styles from 'ringcentral-widgets/components/ConversationPanel/styles.scss';
import i18n from 'ringcentral-widgets/components/ConversationPanel/i18n';

import ConversationMessageList from '../ConversationMessageList';
import newStyles from './styles.scss';

class ConversationPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: this.getInitialContactIndex(),
      isLogging: false,
      loaded: false,
    };
    this._userSelection = false;
    this.onTextChange = (e) => {
      this.props.updateMessageText(e.currentTarget.value);
    };
    this.handleSubmit = (e) => {
      this.props.replyToReceivers(this.props.messageText);
      e.preventDefault();
    };
    this.onTextAreaKeyDown = (e) => {
      if (e.key === 'Enter') {
        this.props.replyToReceivers(this.props.messageText);
        e.preventDefault();
      }
    };
  }

  componentDidMount() {
    this.loadConversation();
    this._mounted = true;
  }

  componentWillReceiveProps(nextProps) {
    if (
      !this._userSelection &&
      (
        nextProps.conversation.conversationMatches !==
        this.props.conversation.conversationMatches ||
        nextProps.conversation.correspondentMatches !==
        this.props.conversation.correspondentMatches
      )
    ) {
      this.setState({
        selected: this.getInitialContactIndex(nextProps),
      });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.messages !== this.props.messages) {
      this.props.readMessages(this.props.conversationId);
    }
    if (prevState.loaded === false && this.state.loaded === true) {
      if (this.props.messages.length < this.props.perPage) {
        this.props.loadPreviousMessages();
      }
    }
  }

  componentWillUnmount() {
    this._mounted = false;
    this.props.unloadConversation();
  }

  onSelectContact = (value, idx) => {
    const selected = this.showContactDisplayPlaceholder
      ? parseInt(idx, 10) - 1 : parseInt(idx, 10);
    this._userSelection = true;
    this.setState({
      selected,
    });
    if (
      this.props.conversation.conversationMatches.length > 0 &&
      this.props.autoLog
    ) {
      this.logConversation({ redirect: false, selected, prefill: false });
    }
  }

  getSelectedContact = (selected = this.state.selected) => {
    const contactMatches = this.props.conversation.correspondentMatches;
    return (selected > -1 && contactMatches[selected]) ||
      (contactMatches.length === 1 && contactMatches[0]) ||
      null;
  }

  getInitialContactIndex(nextProps = this.props) {
    const {
      correspondentMatches,
      lastMatchedCorrespondentEntity,
    } = nextProps.conversation;
    if (lastMatchedCorrespondentEntity) {
      const index = correspondentMatches.findIndex(contact => (
        contact.id === lastMatchedCorrespondentEntity.id
      ));
      if (index > -1) return index;
    }
    return -1;
  }

  getPhoneNumber() {
    const correspondents = this.props.conversation.correspondents;
    return (correspondents.length === 1 &&
      (correspondents[0].phoneNumber || correspondents[0].extensionNumber)) || undefined;
  }

  getGroupPhoneNumbers() {
    const correspondents = this.props.conversation.correspondents;
    const groupNumbers = correspondents.length > 1 ?
      correspondents.map(correspondent =>
        correspondent.extensionNumber || correspondent.phoneNumber || undefined
      )
      : null;
    return groupNumbers;
  }

  getFallbackContactName() {
    const correspondents = this.props.conversation.correspondents;
    return (correspondents.length === 1 &&
      (correspondents[0].name)) || undefined;
  }

  loadConversation() {
    this.props.loadConversation(this.props.conversationId);
    this.setState({ loaded: true });
  }

  async logConversation({ redirect = true, selected, prefill = true }) {
    if (typeof this.props.onLogConversation === 'function' &&
      this._mounted && !this.state.isLogging
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

  logConversation = this.logConversation.bind(this)

  render() {
    if (!this.state.loaded) {
      return null;
    }
    let conversationBody = null;
    const loading = this.props.showSpinner;
    const { recipients, messageSubjectRenderer } = this.props;
    if (loading) {
      conversationBody = (
        <div className={styles.spinerContainer}>
          <Spinner />
        </div>
      );
    } else {
      conversationBody = (
        <ConversationMessageList
          messages={this.props.messages}
          className={newStyles.conversationBody}
          dateTimeFormatter={this.props.dateTimeFormatter}
          showSender={recipients && recipients.length > 1}
          messageSubjectRenderer={messageSubjectRenderer}
          formatPhone={this.props.formatPhone}
          loadingNextPage={this.props.loadingNextPage}
          loadPreviousMessages={this.props.loadPreviousMessages}
        />
      );
    }
    const {
      isLogging,
      conversationMatches,
      correspondentMatches,
    } = this.props.conversation;
    const groupNumbers = this.getGroupPhoneNumbers();
    const phoneNumber = this.getPhoneNumber();
    const fallbackName = this.getFallbackContactName();

    const logButton = this.props.onLogConversation ?
      (
        <LogButton
          className={styles.logButton}
          onLog={this.logConversation}
          disableLinks={this.props.disableLinks}
          isLogged={conversationMatches.length > 0}
          isLogging={isLogging || this.state.isLogging}
          currentLocale={this.props.currentLocale}
        />
      ) :
      null;
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <ContactDisplay
            brand={this.props.brand}
            className={styles.contactDisplay}
            selectClassName={styles.contactDisplaySelect}
            contactMatches={correspondentMatches}
            selected={this.state.selected}
            onSelectContact={this.onSelectContact}
            disabled={this.props.disableLinks}
            isLogging={isLogging || this.state.isLogging}
            fallBackName={fallbackName}
            areaCode={this.props.areaCode}
            countryCode={this.props.countryCode}
            phoneNumber={phoneNumber}
            groupNumbers={groupNumbers}
            showType={false}
            currentLocale={this.props.currentLocale}
            enableContactFallback={this.props.enableContactFallback}
            showPlaceholder={this.props.showContactDisplayPlaceholder}
            sourceIcons={this.props.sourceIcons}
            showGroupNumberName={this.props.showGroupNumberName}
          />
          <a
            onClick={() => this.props.goBack()}
            className={styles.backButton}
          >
            <span className={dynamicsFont.arrow} />
          </a>
          {logButton}
        </div>
        {conversationBody}
        <div className={styles.messageForm}>
          <form onSubmit={this.handleSubmit}>
            <div className={styles.textField}>
              <textarea
                placeholder={i18n.getString('typeMessage', this.props.currentLocale)}
                value={this.props.messageText}
                maxLength="1000"
                onChange={this.onTextChange}
                onKeyPressCapture={this.onTextAreaKeyDown}
              />
            </div>
            <div className={styles.submitField}>
              <input
                type="submit"
                value={i18n.getString('send', this.props.currentLocale)}
                className={styles.submitButton}
                disabled={
                  this.props.disableLinks ||
                  this.props.sendButtonDisabled ||
                  loading ||
                  this.props.messageText.length === 0
                }
              />
            </div>
          </form>
        </div>
      </div>
    );
  }
}

ConversationPanel.propTypes = {
  brand: PropTypes.string.isRequired,
  replyToReceivers: PropTypes.func.isRequired,
  messages: ConversationMessageList.propTypes.messages,
  updateMessageText: PropTypes.func,
  messageText: PropTypes.string,
  recipients: PropTypes.arrayOf(PropTypes.shape({
    phoneNumber: PropTypes.string,
    extensionNumber: PropTypes.string,
    name: PropTypes.string,
  })).isRequired,
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
  sourceIcons: PropTypes.object,
  showGroupNumberName: PropTypes.bool,
  messageSubjectRenderer: PropTypes.func,
  formatPhone: PropTypes.func.isRequired,
  readMessages: PropTypes.func.isRequired,
  loadPreviousMessages: PropTypes.func.isRequired,
  unloadConversation: PropTypes.func.isRequired,
  perPage: PropTypes.number,
  conversationId: PropTypes.string.isRequired,
  loadConversation: PropTypes.func,
  loadingNextPage: PropTypes.bool,
};
ConversationPanel.defaultProps = {
  disableLinks: false,
  onLogConversation: undefined,
  autoLog: false,
  enableContactFallback: undefined,
  showContactDisplayPlaceholder: true,
  sourceIcons: undefined,
  showGroupNumberName: false,
  messageText: '',
  updateMessageText: () => null,
  messageSubjectRenderer: undefined,
  perPage: undefined,
  loadConversation: () => null,
  loadingNextPage: false
};

export default ConversationPanel;
