export interface RcVMeetingModel {
  // api
  name: string;
  type: 0 | 1;
  allowJoinBeforeHost: boolean;
  muteAudio: boolean;
  muteVideo: boolean;
  isMeetingSecret: boolean;
  meetingPassword: string;
  expiresIn: number;
  // custom
  startTime: Date;
  duration: number;
  saveAsDefault: boolean;
  usePersonalMeetingId: boolean;
  personalMeetingId: string;
}
