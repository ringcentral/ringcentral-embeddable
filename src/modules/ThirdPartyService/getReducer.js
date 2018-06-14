import { combineReducers } from 'redux';
import getModuleStatusReducer from 'ringcentral-integration/lib/getModuleStatusReducer';

export function getServiceNameReducer(types) {
  return (state = null, { type, serviceName }) => {
    switch (type) {
      case types.register:
        return serviceName;
      case types.resetSuccess:
        return null;
      default:
        return state;
    }
  };
}

export function getSourceReadyReducer(types) {
  return (state = false, { type }) => {
    switch (type) {
      case types.register:
        return true;
      case types.resetSuccess:
        return false;
      default:
        return state;
    }
  };
}

export function getActivitiesRegisteredReducer(types) {
  return (state = false, { type }) => {
    switch (type) {
      case types.registerActivities:
        return true;
      case types.resetSuccess:
        return false;
      default:
        return state;
    }
  };
}

export function getActivitiesLoadedReducer(types) {
  return (state = false, { type }) => {
    switch (type) {
      case types.loadActivities:
        return false;
      case types.loadActivitiesSuccess:
        return true;
      default:
        return state;
    }
  };
}

export function getActivitiesReducer(types) {
  return (state = [], { type, activities }) => {
    switch (type) {
      case types.loadActivities:
        return [];
      case types.loadActivitiesSuccess:
        return activities;
      default:
        return state;
    }
  };
}

export function getContactsReducer(types) {
  return (state = [], { type, contacts }) => {
    switch (type) {
      case types.fetchSuccess:
        return contacts;
      case types.resetSuccess:
        return [];
      default:
        return state;
    }
  };
}

export function getConferenceInviteTitleReducer(types) {
  return (state = null, { type, conferenceInviteTitle }) => {
    switch (type) {
      case types.registerConferenceInvite:
        return conferenceInviteTitle;
      case types.resetSuccess:
        return null;
      default:
        return state;
    }
  };
}

export default function getReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    serviceName: getServiceNameReducer(types),
    sourceReady: getSourceReadyReducer(types),
    contacts: getContactsReducer(types),
    activitiesRegistered: getActivitiesRegisteredReducer(types),
    activitiesLoaded: getActivitiesLoadedReducer(types),
    activities: getActivitiesReducer(types),
    conferenceInviteTitle: getConferenceInviteTitleReducer(types),
  });
}
