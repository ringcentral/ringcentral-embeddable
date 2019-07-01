import React from 'react';
import { connect } from 'react-redux';
import withPhone from 'ringcentral-widgets/lib/withPhone';
import { mapToProps, mapToFunctions } from 'ringcentral-widgets/containers/ConversationPage';
import ConversationPanel from 'ringcentral-widgets/components/ConversationPanel';
import MessagesLogIcon from '../../components/MessagesLogIcon';

function extendMapToFunctions(_, {
  phone: {
    locale,
    conversationLogger,
    connectivityMonitor,
  },
}) {
  return {
    renderExtraButton: (
      conversation = {},
      {
        logConversation,
        isLogging
      }
    ) => {
      if (!conversationLogger.loggerSourceReady) {
        return null;
      }
      return (
        <MessagesLogIcon
          title={conversationLogger.logButtonTitle}
          disabled={isLogging || !connectivityMonitor.connectivity}
          conversationId={conversation.id}
          currentLocale={locale.currentLocale}
          onClick={logConversation}
        />
      );
    }
  };
}

export default withPhone(connect(
  mapToProps,
  (...args) => ({
    ...mapToFunctions(...args),
    ...extendMapToFunctions(...args),
  }),
)(ConversationPanel));
