export default {
  noActiveCall: 'No active call',
  activeCall: 'Active call',
  unknown: 'Unknown',

  // Call Controls
  mute: 'Mute',
  unmute: 'Unmute',
  hold: 'Hold',
  unhold: 'Unhold',
  keypad: 'Keypad',
  hangUp: 'Hang Up',
  transfer: 'Transfer',
  disposition: 'Disposition',
  record: 'Record',
  stopRecord: 'Stop Rec',
  pauseRecord: 'Pause Rec',
  restartTimer: 'Restart',

  // Conference / end call options
  conferenceCall: 'Conference call',
  participants: '{count} participants',
  viewParticipants: 'View participants',
  everyone: 'Everyone',
  justMe: 'Just me',
  cancelTransfer: 'Cancel transfer',

  // Recording
  recordPaused: 'Call recording paused.',
  recordResume: 'Call recording resumed.',

  // Notes
  enterCallNotes: 'Enter call notes here',
  notes: 'Notes',

  // Side widget - `widgets` is the list of what is waiting behind the toggle,
  // so the agent knows there is a script or an assistant to open.
  showSideWidget: 'Show {widgets}',
  hideSideWidget: 'Hide {widgets}',
} as const;
