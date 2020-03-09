export interface RcVMeetingModel {
  name: string;
  startTime: Date;
  duration: number;
  allowJoinBeforeHost: boolean;
  muteAudio: boolean;
  muteVideo: boolean;
  saveAsDefault: boolean;
}
