import { combineReducers } from 'redux';
import getModuleStatusReducer from 'ringcentral-integration/lib/getModuleStatusReducer';

import { RcVideoActionTypes } from './actionTypes';
import createStatus from './createStatus';

export function getRcVideoInfoReducer(types: RcVideoActionTypes) {
  return (state = {}, { type, meeting = null, patch = true }) => {
    switch (type) {
      case types.updateMeetingSettings: {
        return patch
          ? {
              ...state,
              ...meeting,
            }
          : meeting;
      }
      default:
        return state;
    }
  };
}

export function getRcVideoCreatingStatusReducer(types: RcVideoActionTypes) {
  return (state = createStatus.idle, { type }) => {
    switch (type) {
      case types.initCreating:
        return createStatus.creating;
      case types.created:
        return createStatus.created;
      case types.resetCreating:
        return createStatus.idle;
      default:
        return state;
    }
  };
}

export function getDefaultVideoSettingReducer(types: RcVideoActionTypes) {
  return (state = {}, { type, meeting = null }) => {
    switch (type) {
      case types.saveAsDefaultSetting:
        return { ...state, ...meeting };
      default:
        return state;
    }
  };
}

export function getPersonalMeetingReducer(types: RcVideoActionTypes) {
  return (state = null, { type, meeting = null }) => {
    switch (type) {
      case types.savePersonalMeeting:
        return { ...state, ...meeting };
      default:
        return state;
    }
  };
}

export function getRcVideoPreferencesReducer(types: RcVideoActionTypes) {
  return (state = {}, { type, preferences }) => {
    switch (type) {
      case types.updateMeetingPreferences:
        return preferences;
      default:
        return state;
    }
  };
}

export function getRcVideoPreferencesStateReducer(types: RcVideoActionTypes) {
  return (state = false, { type, isPreferencesChanged }): boolean => {
    switch (type) {
      case types.saveMeetingPreferencesState:
        return isPreferencesChanged;
      default:
        return state;
    }
  };
}

export default (types: RcVideoActionTypes, reducers) =>
  combineReducers({
    ...reducers,
    meeting: getRcVideoInfoReducer(types),
    status: getModuleStatusReducer(types),
    creatingStatus: getRcVideoCreatingStatusReducer(types),
    preferences: getRcVideoPreferencesReducer(types),
    isPreferencesChanged: getRcVideoPreferencesStateReducer(types),
  });
