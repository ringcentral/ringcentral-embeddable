import { combineReducers } from 'redux';

import { MeetingHistoryUIActionTypes } from './actionTypes';

export function getPageTokenReducer(types: MeetingHistoryUIActionTypes) {
  return (state = null, { type, nextPageToken, pageToken = null }) => {
    switch (type) {
      case types.fetchMeetings:
        return pageToken;
      case types.fetchMeetingsSuccess:
        return nextPageToken;
      case types.updateType:
      case types.updateSearchText:
      case types.cleanMeetingPageToken:
        return null;
      default:
        return state;
    }
  };
}

export function getFetchingReducer(types: MeetingHistoryUIActionTypes) {
  return (state = false, { type }) => {
    switch (type) {
      case types.fetchMeetings: {
        return true;
      }
      case types.fetchMeetingsSuccess:
      case types.fetchMeetingsError:
        return false;
      default:
        return state;
    }
  };
}

export function getTypeReducer(types: MeetingHistoryUIActionTypes) {
  return (state = 'all', { type, meetingType }) => {
    switch (type) {
      case types.updateType: {
        return meetingType;
      }
      case types.cleanType: {
        return 'all';
      }
      default:
        return state;
    }
  };
}

export function getSearchTextReducer(types: MeetingHistoryUIActionTypes) {
  return (state = '', { type, searchText }) => {
    switch (type) {
      case types.updateSearchText: {
        return searchText;
      }
      case types.cleanSearchText: {
        return '';
      }
      default:
        return state;
    }
  };
}

export default (types) =>
  combineReducers({
    fetching: getFetchingReducer(types),
    pageToken: getPageTokenReducer(types),
    type: getTypeReducer(types),
    searchText: getSearchTextReducer(types),
  });
