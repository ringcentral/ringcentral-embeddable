import { combineReducers } from 'redux';
import getModuleStatusReducer from 'ringcentral-integration/lib/getModuleStatusReducer';

import messageTypes from 'ringcentral-integration/enums/messageTypes';

export function getSearchInputReducer(types) {
  return (state = '', { type, input = '' }) => {
    switch (type) {
      case types.updateSearchInput:
        return input;
      case types.resetSuccess:
        return '';
      default:
        return state;
    }
  };
}

export function getTypeFilterReducer(types) {
  return (state = messageTypes.all, { type, typeFilter }) => {
    switch (type) {
      case types.updateTypeFilter:
        return typeFilter;
      case types.resetSuccess:
        return messageTypes.all;
      default:
        return state;
    }
  };
}

export default function getReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    searchInput: getSearchInputReducer(types),
    typeFilter: getTypeFilterReducer(types),
  });
}
