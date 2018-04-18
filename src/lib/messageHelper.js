import removeUri from 'ringcentral-integration/lib/removeUri';

export function getConversationId(record) {
  const conversationId = (record.conversation && record.conversation.id) || record.id;
  return conversationId.toString();
}

export function sortByCreationTime(a, b) {
  if (a.creationTime === b.creationTime) return 0;
  return (a.creationTime > b.creationTime ? -1 : 1);
}

export function normalizeRecord(record) {
  const newRecord = removeUri(record);
  const conversationId = getConversationId(record);
  delete newRecord.conversation;
  return {
    ...newRecord,
    creationTime: (new Date(record.creationTime)).getTime(),
    lastModifiedTime: (new Date(record.lastModifiedTime)).getTime(),
    conversationId,
  };
}

export function messageIsDeleted(message) {
  return message.availability === 'Deleted' || message.availability === 'Purged';
}
