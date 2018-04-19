import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import messageTypes from 'ringcentral-integration/enums/messageTypes';
import formatNumber from 'ringcentral-integration/lib/formatNumber';

import ConversationPanel from 'ringcentral-widgets/components/ConversationPanel';
import withPhone from 'ringcentral-widgets/lib/withPhone';

class ConversationPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loaded: false,
    };
  }

  getChildContext() {
    return {
      formatPhone: this.props.formatNumber,
      changeDefaultRecipient: this.props.changeDefaultRecipient,
      changeMatchedNames: this.props.changeMatchedNames,
      getRecipientName: recipient => (this.getRecipientName(recipient)),
      getMatcherContactList: this.props.getMatcherContactList,
      getMatcherContactNameList: this.props.getMatcherContactNameList,
    };
  }

  componentDidMount() {
    this.loadConversation();
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
    this.props.unloadConversation();
  }

  getRecipientName(recipient) {
    const phoneNumber = recipient.phoneNumber || recipient.extensionNumber;
    if (phoneNumber && this.props.getMatcherContactName) {
      const matcherName = this.props.getMatcherContactName(phoneNumber);
      if (matcherName) {
        return matcherName;
      }
      return this.props.formatNumber(phoneNumber);
    }
    if (recipient.name) {
      return recipient.name;
    }
    return this.props.formatNumber(phoneNumber);
  }

  loadConversation() {
    const id = this.props.conversationId;
    this.props.loadConversation(id);
    this.setState({ loaded: true });
  }

  render() {
    if (!this.state.loaded) {
      return null;
    }
    return (
      <ConversationPanel
        brand={this.props.brand}
        countryCode={this.props.countryCode}
        areaCode={this.props.areaCode}
        disableLinks={this.props.disableLinks}
        conversationId={this.props.conversationId}
        currentLocale={this.props.currentLocale}
        messages={this.props.messages}
        messageText={this.props.messageText}
        updateMessageText={this.props.updateMessageText}
        conversation={this.props.conversation}
        onLogConversation={this.props.onLogConversation}
        isLoggedContact={this.props.isLoggedContact}
        recipients={this.props.recipients}
        showSpinner={this.props.showSpinner}
        replyToReceivers={this.props.replyToReceivers}
        sendButtonDisabled={this.props.sendButtonDisabled}
        autoLog={this.props.autoLog}
        dateTimeFormatter={this.props.dateTimeFormatter}
        showContactDisplayPlaceholder={this.props.showContactDisplayPlaceholder}
        goBack={this.props.goBack}
        sourceIcons={this.props.sourceIcons}
        showGroupNumberName={this.props.showGroupNumberName}
        messageSubjectRenderer={this.props.messageSubjectRenderer}
      />
    );
  }
}

ConversationPage.propTypes = {
  brand: PropTypes.string.isRequired,
  conversationId: PropTypes.string.isRequired,
  currentLocale: PropTypes.string.isRequired,
  sendButtonDisabled: PropTypes.bool.isRequired,
  showSpinner: PropTypes.bool.isRequired,
  messages: ConversationPanel.propTypes.messages,
  messageText: PropTypes.string,
  updateMessageText: PropTypes.func,
  recipients: ConversationPanel.propTypes.recipients,
  replyToReceivers: PropTypes.func.isRequired,
  unloadConversation: PropTypes.func.isRequired,
  loadConversation: PropTypes.func.isRequired,
  changeDefaultRecipient: PropTypes.func.isRequired,
  formatNumber: PropTypes.func.isRequired,
  getMatcherContactName: PropTypes.func,
  getMatcherContactList: PropTypes.func,
  getMatcherContactNameList: PropTypes.func,
  changeMatchedNames: PropTypes.func.isRequired,
  dateTimeFormatter: PropTypes.func.isRequired,
  sourceIcons: PropTypes.object,
  showGroupNumberName: PropTypes.bool.isRequired,
  messageSubjectRenderer: PropTypes.func,
  goBack: PropTypes.func,
  readMessages: PropTypes.func.isRequired,
  loadPreviousMessages: PropTypes.func.isRequired,
  perPage: PropTypes.number,
};

ConversationPage.defaultProps = {
  messageText: '',
  getMatcherContactName: null,
  getMatcherContactList: () => [],
  getMatcherContactNameList: () => [],
  updateMessageText: () => {},
  sourceIcons: undefined,
  messageSubjectRenderer: undefined,
  messages: [],
  recipients: [],
  goBack: undefined,
  perPage: 20,
};

ConversationPage.childContextTypes = {
  formatPhone: PropTypes.func.isRequired,
  getRecipientName: PropTypes.func.isRequired,
  changeDefaultRecipient: PropTypes.func.isRequired,
  changeMatchedNames: PropTypes.func.isRequired,
  getMatcherContactList: PropTypes.func.isRequired,
  getMatcherContactNameList: PropTypes.func.isRequired,
};

function mapToProps(_, {
  phone: {
    brand,
    locale,
    conversationLogger,
    dateTimeFormat,
    contactMatcher,
    regionSettings,
    conversations,
    rateLimiter,
    connectivityMonitor,
  },
  params,
  enableContactFallback = false,
  showGroupNumberName = false,
  perPage = 20,
}) {
  const currentConversation = conversations.currentConversation;
  return ({
    brand: brand.fullName,
    enableContactFallback,
    showGroupNumberName,
    currentLocale: locale.currentLocale,
    conversationId: params.conversationId,
    sendButtonDisabled: conversations.pushing,
    areaCode: regionSettings.areaCode,
    countryCode: regionSettings.countryCode,
    showSpinner: !(
      dateTimeFormat.ready &&
      (!contactMatcher || contactMatcher.ready) &&
      regionSettings.ready &&
      conversations.ready &&
      rateLimiter.ready &&
      connectivityMonitor.ready &&
      (!conversationLogger || conversationLogger.ready)
    ),
    recipients: currentConversation.recipients,
    messages: currentConversation.messages,
    messageText: conversations.messageText,
    conversation: currentConversation,
    disableLinks: (
      rateLimiter.isThrottling || !connectivityMonitor.connectivity
    ),
    autoLog: !!(conversationLogger && conversationLogger.autoLog),
    perPage,
  });
}

function mapToFunctions(_, {
  phone: {
    contactMatcher,
    dateTimeFormat,
    routerInteraction,
    conversationLogger,
    regionSettings,
    conversations,
    newMessageStore: messageStore,
  },
  dateTimeFormatter = (...args) => dateTimeFormat.formatDateTime(...args),
  isLoggedContact,
  onLogConversation,
}) {
  let getMatcherContactName;
  let getMatcherContactList;
  let getMatcherContactNameList;
  if (contactMatcher && contactMatcher.ready) {
    getMatcherContactList = (phoneNumber) => {
      const matcherNames = contactMatcher.dataMapping[phoneNumber];
      if (matcherNames && matcherNames.length > 0) {
        return matcherNames.map(matcher =>
          `${matcher.name} | ${matcher.phoneNumbers[0].phoneType}`
        );
      }
      return [];
    };
    getMatcherContactNameList = (phoneNumber) => {
      const matcherNames = contactMatcher.dataMapping[phoneNumber];
      if (matcherNames && matcherNames.length > 0) {
        return matcherNames.map(matcher => matcher.name);
      }
      return [];
    };
    getMatcherContactName = (phoneNumber) => {
      const matcherNames = getMatcherContactNameList(phoneNumber);
      if (matcherNames && matcherNames.length > 0) {
        return matcherNames.join('&');
      }
      return null;
    };
  }

  return {
    replyToReceivers: (...args) => conversations.replyToReceivers(...args),
    changeDefaultRecipient: (...args) => null,
    changeMatchedNames: (...args) => null,
    unloadConversation: () => conversations.unloadConversation(),
    loadConversation: id => conversations.loadConversation(id),
    updateMessageText: text => conversations.updateMessageText(text),
    dateTimeFormatter,
    formatNumber: phoneNumber => formatNumber({
      phoneNumber,
      areaCode: regionSettings.areaCode,
      countryCode: regionSettings.countryCode,
    }),
    getMatcherContactName,
    getMatcherContactList,
    getMatcherContactNameList,
    isLoggedContact,
    onLogConversation: onLogConversation ||
    (conversationLogger && (async ({ redirect = true, ...options }) => {
      await conversationLogger.logConversation({
        ...options,
        redirect,
      });
    })),
    goBack: () => {
      routerInteraction.push('/messages');
      conversations.updateTypeFilter(messageTypes.text);
    },
    readMessages: (id) => {
      messageStore.readMessages(id);
    },
    loadPreviousMessages: () => {
      conversations.fetchOldMessages();
    },
  };
}

export default withPhone(connect(
  mapToProps,
  mapToFunctions,
)(ConversationPage));
