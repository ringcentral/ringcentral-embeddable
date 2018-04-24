import { combineReducers } from 'redux';
import * as messageHelper from 'ringcentral-integration/lib/messageHelper';
import {
  sortByCreationTime,
  normalizeRecord,
  messageIsDeleted,
} from '../../lib/messageHelper';

export function getConversationListReducer(types) {
  return (state = [], { type, records, conversationId, conversationStore }) => {
    const newState = [];
    const stateMap = {};
    switch (type) {
      case types.conversationsISyncSuccess:
      case types.conversationsFSyncSuccess:
      case types.updateMessages:
        if (type !== types.conversationsFSyncSuccess) {
          if (!records || records.length === 0) {
            return state;
          }
          state.forEach((oldConversation) => {
            newState.push(oldConversation);
            stateMap[oldConversation.id] = {
              index: newState.length - 1
            };
          });
        }
        records.forEach((record) => {
          const message = normalizeRecord(record);
          const id = message.conversationId;
          const newCreationTime = message.creationTime;
          const isDeleted = messageIsDeleted(message);
          if (stateMap[id]) {
            const oldConversation = newState[stateMap[id].index];
            const creationTime = oldConversation.creationTime;
            if (creationTime < newCreationTime && !isDeleted) {
              newState[stateMap[id].index] = {
                id,
                creationTime: newCreationTime,
                type: message.type,
                messageId: message.id,
              };
            }
            // when user deleted a coversation message
            if (isDeleted && message.id === oldConversation.messageId) {
              const oldMessageList = conversationStore[id] || [];
              const exsitedMessageList = oldMessageList.filter(m => m.id !== message.id);
              if (exsitedMessageList.length > 0) {
                newState[stateMap[id].index] = {
                  id,
                  creationTime: exsitedMessageList[0].creationTime,
                  type: exsitedMessageList[0].type,
                  messageId: exsitedMessageList[0].id,
                };
                return;
              }
              // when user delete conversation
              newState[stateMap[id].index] = null;
              delete stateMap[id];
            }
            return;
          }
          if (isDeleted || !messageHelper.messageIsAcceptable(message)) {
            return;
          }
          newState.push({
            id,
            creationTime: newCreationTime,
            type: message.type,
            messageId: message.id,
          });
          stateMap[id] = {
            index: newState.length - 1
          };
        });
        return newState.filter(c => !!c).sort(sortByCreationTime);
      case types.deleteConversation:
        return state.filter(c => c.id !== conversationId);
      case types.resetSuccess:
        return [];
      default:
        return state;
    }
  };
}

export function getConversationStoreReducer(types) {
  return (state = {}, { type, records, conversationId }) => {
    let newState = {};
    const updatedConversations = {};
    switch (type) {
      case types.conversationsISyncSuccess:
      case types.conversationsFSyncSuccess:
      case types.updateMessages:
        if (type !== types.conversationsFSyncSuccess) {
          if (!records || records.length === 0) {
            return state;
          }
          newState = {
            ...state,
          };
        }
        records.forEach((record) => {
          const message = normalizeRecord(record);
          const id = message.conversationId;
          const newMessages = newState[id] ? [].concat(newState[id]) : [];
          const oldMessageIndex = newMessages.findIndex(r => r.id === record.id);
          if (messageIsDeleted(message)) {
            newState[id] = newMessages.filter(m => m.id !== message.id);
            if (newState[id].length === 0) {
              delete newState[id];
            }
            return;
          }
          if (oldMessageIndex > -1) {
            if (newMessages[oldMessageIndex].lastModifiedTime < message.lastModifiedTime) {
              newMessages[oldMessageIndex] = message;
            }
          } else if (messageHelper.messageIsAcceptable(message)) {
            newMessages.push(message);
          }
          updatedConversations[id] = 1;
          newState[id] = newMessages;
        });
        Object.keys(updatedConversations).forEach((id) => {
          const noSorted = newState[id];
          newState[id] = noSorted.sort(sortByCreationTime);
        });
        return newState;
      case types.deleteConversation:
        if (!state[conversationId]) {
          return state;
        }
        newState = { ...state };
        delete newState[conversationId];
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
  return (state = null, { type, syncInfo }) => {
    switch (type) {
      case types.conversationsFSyncSuccess:
      case types.conversationsISyncSuccess:
        return syncInfo;
      case types.resetSuccess:
        return null;
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
  });
}
