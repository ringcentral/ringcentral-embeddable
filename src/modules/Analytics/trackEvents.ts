import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const trackEvents = ObjectMap.fromObject({
  webRTCCallEnded: 'WebRTC Call Ended',
  meetingScheduled: 'Meeting Scheduled',
  joinMeeting: 'Join Meeting',
  createInstantMeeting: 'Create instant meeting',
  saveRingTone: 'Save Ringtone',
  viewSmartNotes: 'View smart notes',
  startSmartNotes: 'Start smart notes',
  enableSmartNotes: 'Enable smart note widget',
  disableSmartNotes: 'Disable smart note widget',
  enableSmartNotesAutoStart: 'Enable smart note auto start',
  disableSmartNotesAutoStart: 'Disable smart note auto start',
  saveThirdPartySettingSection: 'Save Third Party Setting Section',
  openSideDrawer: 'Open side drawer',
  closeSideDrawer: 'Close side drawer',
  viewMessageDetails: 'View message details',
  viewRecording: 'View recording',
  recordInCallControl: 'Call Control: Record/Call control page',
  stopRecordInCallControl: 'Call Control: Stop record/Call control page',
  muteInCallControl: 'Call Control: Mute/Call control page',
  unmuteInCallControl: 'Call Control: Unmute/Call control page',
  holdInCallControl: 'Call Control: Hold/Call control page',
  unholdInCallControl: 'Call Control: Unhold/Call control page',
  updateCallQueuePresence: 'Update call queue presence',
} as const);
