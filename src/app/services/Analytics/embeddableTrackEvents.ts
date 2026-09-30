/**
 * Embeddable-only analytics event names, kept identical to the legacy app so
 * Mixpanel reports continue across the migration.
 */
export const embeddableTrackEvents = {
  webRTCCallEnded: "WebRTC Call Ended",
  meetingScheduled: "Meeting Scheduled",
  joinMeeting: "Join Meeting",
  createInstantMeeting: "Create instant meeting",
  saveRingTone: "Save Ringtone",
  openSideDrawer: "Open side drawer",
  closeSideDrawer: "Close side drawer",
  viewMessageDetails: "View message details",
  viewRecording: "View recording",
  updateCallQueuePresence: "Update call queue presence",
  openVoicemailDrop: "Open voicemail drop",
  dropVoicemailMessage: "Drop voicemail message",
  voicemailDropCompleted: "Voicemail drop completed",
  voicemailDropFailed: "Voicemail drop failed",
  saveVoicemailDropMessage: "Save voicemail drop message",
  deleteVoicemailDropMessage: "Delete voicemail drop message",
  updateVoicemailDropSilenceDuration: "Update voicemail drop silence duration",
} as const;
