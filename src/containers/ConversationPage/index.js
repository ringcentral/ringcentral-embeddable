import { connect } from 'react-redux';

import formatNumber from 'ringcentral-integration/lib/formatNumber';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import ConversationPanel from '../../components/ConversationPanel';

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
    loadingNextPage: conversations.loadingOldMessages,
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
    messageStore,
  },
  dateTimeFormatter = (...args) => dateTimeFormat.formatDateTime(...args),
  isLoggedContact,
  onLogConversation,
  conversationsPath = '/messages',
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
    formatPhone: phoneNumber => formatNumber({
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
      routerInteraction.push(conversationsPath);
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
)(ConversationPanel));
