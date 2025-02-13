import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const trackEvents = ObjectMap.fromObject({
  webRTCCallEnded: 'WebRTC Call Ended',
  meetingScheduled: 'Meeting Scheduled',
  joinMeeting: 'Join Meeting',
  createInstantMeeting: 'Create instant meeting',
  saveRingTone: 'Save Ringtone',
  viewSmartNotes: 'View smart notes',
  startSmartNotes: 'Start smart notes',
  saveThirdPartySettingSection: 'Save Third Party Setting Section',
  openSideDrawer: 'Open side drawer',
  closeSideDrawer: 'Close side drawer',
  viewMessageDetails: 'View message details',
  viewRecording: 'View recording',
} as const);
