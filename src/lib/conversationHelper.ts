import {
  messageIsTextMessage,
} from '@ringcentral-integration/commons/lib/messageHelper';

export function findExistedConversation(conversations, phoneNumber) {
  return conversations.find((conversation) => {
    if (!conversation.to || conversation.to.length > 1) {
      return false;
    }
    if (!messageIsTextMessage(conversation)) {
      return false;
    }
    if (conversation.direction === 'Inbound') {
      return conversation.from && (
        conversation.from.phoneNumber === phoneNumber ||
        conversation.from.extensionNumber === phoneNumber
      );
    }
    return conversation.to.find(
      number => (
        number.phoneNumber === phoneNumber ||
        number.extensionNumber === phoneNumber
      )
    );
  });
}

export function getConversationPhoneNumber(conversation) {
  if (conversation.direction === 'Inbound') {
    return conversation.from.phoneNumber || conversation.from.extensionNumber;
  }
  if (conversation.to.length === 0) {
    return null;
  }
  return conversation.to[0].phoneNumber || conversation.to[0].extensionNumber;
}
