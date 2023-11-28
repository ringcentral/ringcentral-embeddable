import { combineReducers } from 'redux';

import getModuleStatusReducer
  from '@ringcentral-integration/commons/lib/getModuleStatusReducer';

function getFocusReducer(types) {
  return (state = false, { type, focus }) => {
    switch (type) {
      case types.setFocus:
        return !!focus;
      default:
        return state;
    }
  };
}

function getShowDemoWarningReducer(types) {
  return (state = false, { type, show }) => {
    switch (type) {
      case types.setShowDemoWarning:
        return !!show;
      default:
        return state;
    }
  };
}

export default function getReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    showDemoWarning: getShowDemoWarningReducer(types),
    focus: getFocusReducer(types),
  });
}
