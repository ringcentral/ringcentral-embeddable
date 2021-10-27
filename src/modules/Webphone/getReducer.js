import { combineReducers } from 'redux';

import getModuleStatusReducer from '@ringcentral-integration/commons/lib/getModuleStatusReducer';

import {
  getVideoElementPreparedReducer,
  getConnectionStatusReducer,
  getConnectRetryCountsReducer,
  getErrorCodeReducer,
  getStatusCodeReducer,
  getActiveSessionIdReducer,
  getRingSessionIdReducer,
  getSessionsReducer,
  getLastEndedSessionsReducer,
  getWebphoneDeviceReducer,
} from '@ringcentral-integration/commons/modules/Webphone/getWebphoneReducer';

export function getModuleStateReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    videoElementPrepared: getVideoElementPreparedReducer(types),
  });
}

export function getWebphoneStateReducer(types) {
  return combineReducers({
    connectionStatus: getConnectionStatusReducer(types),
    connectRetryCounts: getConnectRetryCountsReducer(types),
    errorCode: getErrorCodeReducer(types),
    statusCode: getStatusCodeReducer(types),
    activeSessionId: getActiveSessionIdReducer(types),
    ringSessionId: getRingSessionIdReducer(types),
    sessions: getSessionsReducer(types),
    lastEndedSessions: getLastEndedSessionsReducer(types),
    device: getWebphoneDeviceReducer(types),
  });
}
