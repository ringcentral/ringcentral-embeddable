import { connect } from 'react-redux';
import withPhone from 'ringcentral-widgets/lib/withPhone';
import MessagesPanel from '../../components/ConversationsPanel';

function mapToProps(_, {
  phone: {
    brand,
    locale,
    conversations,
    contactMatcher,
    dateTimeFormat,
    regionSettings,
    rolesAndPermissions,
    call,
    conversationLogger,
    connectivityMonitor,
    rateLimiter,
    messageStore,
  },
  showTitle = false,
  enableContactFallback = false,
  showGroupNumberName = false,
}) {
  const {
    serviceFeatures,
    permissions,
    readTextPermissions,
    voicemailPermissions,
    readFaxPermissions,
  } = rolesAndPermissions;
  return ({
    showTitle,
    enableContactFallback,
    showGroupNumberName,
    brand: brand.fullName,
    currentLocale: locale.currentLocale,
    conversations: conversations.pagingConversations,
    areaCode: regionSettings.areaCode,
    countryCode: regionSettings.countryCode,
    disableLinks: (
      !connectivityMonitor.connectivity ||
      rateLimiter.throttling
    ),
    disableClickToDial: !(call && call.isIdle),
    outboundSmsPermission: !!(
      permissions &&
      permissions.OutboundSMS
    ),
    internalSmsPermission: !!(
      permissions &&
      permissions.InternalSMS
    ),
    composeTextPermission: !!(
      serviceFeatures &&
      (
        (serviceFeatures.Pager && serviceFeatures.Pager.enabled) ||
        (serviceFeatures.SMS && serviceFeatures.SMS.enabled)
      )
    ),
    loggingMap: (conversationLogger && conversationLogger.loggingMap),
    showSpinner: !(
      locale.ready &&
      conversations.ready &&
      (!contactMatcher || contactMatcher.ready) &&
      dateTimeFormat.ready &&
      regionSettings.ready &&
      rolesAndPermissions.ready &&
      connectivityMonitor.ready &&
      rateLimiter.ready &&
      (!rolesAndPermissions || rolesAndPermissions.ready) &&
      (!call || call.ready) &&
      (!conversationLogger || conversationLogger.ready)
    ),
    searchInput: conversations.searchInput,
    autoLog: !!(conversationLogger && conversationLogger.autoLog),
    typeFilter: conversations.typeFilter,
    textUnreadCounts: messageStore.textUnreadCounts,
    voiceUnreadCounts: messageStore.voiceUnreadCounts,
    faxUnreadCounts: messageStore.faxUnreadCounts,
    readTextPermission: readTextPermissions,
    readVoicemailPermission: voicemailPermissions,
    readFaxPermission: readFaxPermissions,
    loadingNextPage: conversations.loadingOldConversations,
  });
}

function mapToFunctions(_, {
  phone: {
    dateTimeFormat,
    conversations,
    messageStore,
    conversationLogger,
    contactMatcher,
    call,
    dialerUI,
    routerInteraction,
    composeText,
    contactSearch,
    rolesAndPermissions,
  },
  showViewContact = true,
  dateTimeFormatter = (...args) => dateTimeFormat.formatDateTime(...args),
  dialerRoute = '/dialer',
  onCreateContact,
  onLogConversation,
  isLoggedContact,
  onViewContact,
  conversationDetailRoute = '/conversations/{conversationId}',
  composeTextRoute = '/composeText',
  previewFaxMessages,
}) {
  return {
    dateTimeFormatter,
    onViewContact: showViewContact ? (onViewContact || (({ contact: { id, type } }) => {
      routerInteraction.push(`/contacts/${type}/${id}?direct=true`);
    })) : null,
    onCreateContact: onCreateContact ?
      async ({ phoneNumber, name, entityType }) => {
        const hasMatchNumber = await contactMatcher.hasMatchNumber({
          phoneNumber,
          ignoreCache: true
        });
        // console.debug('confirm hasMatchNumber:', hasMatchNumber);
        if (!hasMatchNumber) {
          await onCreateContact({ phoneNumber, name, entityType });
          await contactMatcher.forceMatchNumber({ phoneNumber });
        }
      } :
      undefined,
    onClickToDial: dialerUI && rolesAndPermissions.callingEnabled ?
      (recipient) => {
        if (call.isIdle) {
          routerInteraction.push(dialerRoute);
          // for track router
          messageStore.onClickToCall({ fromType: recipient.fromType });
          dialerUI.call({ recipient });
        }
      } :
      undefined,
    onClickToSms: (contact, isDummyContact = false) => {
      if (routerInteraction) {
        routerInteraction.push(composeTextRoute);
      }
      // if contact autocomplete, if no match fill the number only
      if (contact.name && contact.phoneNumber && isDummyContact) {
        composeText.updateTypingToNumber(contact.name);
        contactSearch.search({ searchString: contact.name });
      } else {
        composeText.addToNumber(contact);
        if (composeText.typingToNumber === contact.phoneNumber) {
          composeText.cleanTypingToNumber();
        }
      }
      // for track
      messageStore.onClickToSMS();
    },
    isLoggedContact,
    onLogConversation: onLogConversation ||
    (conversationLogger && (async ({ redirect = true, ...options }) => {
      await conversationLogger.logConversation({
        ...options,
        redirect,
      });
    })),
    onSearchInputChange: (e) => {
      conversations.updateSearchInput(e.currentTarget.value);
    },
    showConversationDetail: (conversationId) => {
      routerInteraction.push(
        conversationDetailRoute.replace('{conversationId}', conversationId)
      );
    },
    readMessage: conversationId =>
      messageStore.readMessages(conversationId),
    markMessage: conversationId =>
      messageStore.unreadMessage(conversationId),
    unmarkMessage: (conversationId) => {
      messageStore.readMessages(conversationId);
      messageStore.onUnmarkMessages();
    },
    goToComposeText: () => routerInteraction.push(composeTextRoute),
    updateTypeFilter: type => conversations.updateTypeFilter(type),
    deleteMessage: (conversationId) => {
      conversations.deleteCoversation(conversationId);
    },
    previewFaxMessages: (uri, conversationId) => {
      if (!previewFaxMessages) {
        window.open(uri);
      } else {
        previewFaxMessages(uri);
      }
      messageStore.readMessages(conversationId);
    },
    loadNextPage: async () => {
      await conversations.loadNextPage();
    },
    onUnmount: () => {
      if (conversations.currentPage > 2) {
        conversations.resetCurrentPage();
      }
    }
  };
}
export default withPhone(connect(
  mapToProps,
  mapToFunctions,
)(MessagesPanel));
