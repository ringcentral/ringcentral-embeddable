export interface RcVMeetingModel {
  name: string;
  startTime: Date;
  duration: number;
  allowJoinBeforeHost: boolean;
  muteAudio: boolean;
  muteVideo: boolean;
  isMeetingSecret: boolean;
  meetingPassword: string;
  saveAsDefault: boolean;
  usePersonalMeetingId: boolean;
  personalMeetingId: string;
}
