import { combineReducers } from 'redux';
import getModuleStatusReducer from 'ringcentral-integration/lib/getModuleStatusReducer';

export function getModalShowReducer(types) {
  return (state = false, { type }) => {
    switch (type) {
      case types.newMeeting:
        return true;
      case types.close:
      case types.resetSuccess:
        return false;
      default:
        return state;
    }
  };
}

export function getMeetingStringReducer(types) {
  return (state = '', { type, meetingString }) => {
    switch (type) {
      case types.newMeeting:
        return meetingString;
      case types.resetSuccess:
        return '';
      default:
        return state;
    }
  };
}

export default function getReducer(types) {
  return combineReducers({
    status: getModuleStatusReducer(types),
    modalShow: getModalShowReducer(types),
    meetingString: getMeetingStringReducer(types)
  });
}
