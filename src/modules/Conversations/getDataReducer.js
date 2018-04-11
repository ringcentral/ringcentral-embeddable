import { combineReducers } from 'redux';
import removeUri from 'ringcentral-integration/lib/removeUri';

function getConversationId(record) {
  const conversationId = (record.conversation && record.conversation.id) || record.id;
  return conversationId.toString();
}

function sortByCreationTime(a, b) {
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

export function getConversationListReducer(types) {
  return (state = [], { type, data }) => {
    const newState = [];
    const stateMap = {};
    switch (type) {
      case types.conversationsISyncSuccess:
      case types.conversationsFSyncSuccess:
        if (type === types.conversationsISyncSuccess) {
          if (!data.records || data.records.length === 0) {
            return state;
          }
          state.forEach((oldConversation) => {
            newState.push(oldConversation);
            stateMap[oldConversation.id] = {
              index: newState.length - 1,
              creationTime: oldConversation.creationTime,
            };
          });
        }
        data.records.forEach((record) => {
          const message = normalizeRecord(record);
          const conversationId = message.conversationId;
          const newCreationTime = message.creationTime;
          if (stateMap[conversationId]) {
            const creationTime = stateMap[conversationId].creationTime;
            if (creationTime < newCreationTime) {
              newState[stateMap[conversationId].index] = {
                id: conversationId,
                creationTime: newCreationTime
              };
            }
            return;
          }
          newState.push({ id: conversationId, creationTime: newCreationTime });
          stateMap[conversationId] = {
            index: newState.length - 1,
            creationTime: newCreationTime,
          };
        });
        return newState.sort(sortByCreationTime);
      case types.resetSuccess:
        return [];
      default:
        return state;
    }
  };
}

export function getConversationStoreReducer(types) {
  return (state = {}, { type, data }) => {
    let newState = {};
    switch (type) {
      case types.conversationsISyncSuccess:
      case types.conversationsFSyncSuccess:
        if (type === types.conversationsISyncSuccess) {
          if (!data.records || data.records.length === 0) {
            return state;
          }
          newState = {
            ...state,
          };
        }
        data.records.forEach((record) => {
          const message = normalizeRecord(record);
          const conversationId = message.conversationId;
          const newMessages = newState[conversationId] ? [].concat(newState[conversationId]) : [];
          const oldMessageIndex = newMessages.findIndex(r => r.id === record.id);
          if (oldMessageIndex > -1) {
            if (newMessages[oldMessageIndex].lastModifiedTime < message.lastModifiedTime) {
              newMessages[oldMessageIndex] = message;
            }
          } else {
            newMessages.push(message);
          }
          newState[conversationId] = newMessages.sort(sortByCreationTime);
        });
        return newState;
      case types.resetSuccess:
        return {};
      default:
        return state;
    }
  };
}

export function getTimestampReducer(types) {
  return (state = null, { type, timestamp }) => {
    switch (type) {
      case types.conversationsFSyncSuccess:
      case types.conversationsISyncSuccess:
        return timestamp;
      case types.resetSuccess:
        return null;
      default:
        return state;
    }
  };
}

export function getSyncInfoReducer(types) {
  return (state = null, { type, data }) => {
    switch (type) {
      case types.conversationsFSyncSuccess:
      case types.conversationsISyncSuccess:
        return data.syncInfo;
      case types.resetSuccess:
        return null;
      default:
        return state;
    }
  };
}

export function getHasOlderDataReducer(types) {
  return (state = true, { type, data, recordCount }) => {
    switch (type) {
      case types.conversationsFSyncSuccess:
      case types.conversationsFSyncPageSuccess:
        if (data.records && data.records.length >= recordCount) {
          return true;
        }
        return false;
      case types.resetSuccess:
        return true;
      default:
        return state;
    }
  };
}

export default function getDataReducer(types) {
  return combineReducers({
    conversationList: getConversationListReducer(types),
    conversationStore: getConversationStoreReducer(types),
    syncInfo: getSyncInfoReducer(types),
    hasOlderData: getHasOlderDataReducer(types),
  });
}
