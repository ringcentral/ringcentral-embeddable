export interface RcVMeetingAPI {
  name: string;
  type: 0 | 1;
  allowJoinBeforeHost: boolean;
  muteAudio: boolean;
  muteVideo: boolean;
  isMeetingSecret: boolean;
  meetingPassword: string;
  expiresIn: number;
}

export interface RcVMeetingModel extends RcVMeetingAPI {
  startTime: Date;
  duration: number;
  saveAsDefault: boolean;
  isMeetingPasswordValid: boolean;
  usePersonalMeetingId: boolean;
}
