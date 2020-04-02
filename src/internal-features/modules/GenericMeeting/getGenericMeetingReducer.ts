import { combineReducers } from 'redux';
import getModuleStatusReducer from 'ringcentral-integration/lib/getModuleStatusReducer';

const getGenericMeetingReducer = (types, reducers) =>
  combineReducers({
    ...reducers,
    status: getModuleStatusReducer(types),
  });
export default getGenericMeetingReducer;
