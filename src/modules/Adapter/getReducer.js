import { combineReducers } from 'redux';
import getModuleStatusReducer from 'ringcentral-integration/lib/getModuleStatusReducer';

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

export default function getReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    focus: getFocusReducer(types),
  });
}
