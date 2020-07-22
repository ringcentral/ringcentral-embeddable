export function getHistoryMeetingsReducer(types) {
  return (state = [], { type, meetings = [], pageToken }) => {
    switch (type) {
      case types.saveMeetings: {
        if (!pageToken) {
          return meetings;
        }
        return [].concat(state).concat(meetings);
      }
      case types.cleanMeetings: {
        return [];
      }
      default:
        return state;
    }
  };
}

export function getUpcomingMeetingsReducer(types) {
  return (state = [], { type, meetings = [], pageToken }) => {
    switch (type) {
      case types.saveUpcomingMeetings: {
        return meetings;
      }
      case types.cleanUpcomingMeetings: {
        return [];
      }
      default:
        return state;
    }
  };
}

