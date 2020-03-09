import { meetingProviderTypesProps } from '../MeetingProvider/interface';

export type ExtensionInfo = {
  contact: object;
  departments: object[];
  extensionNumber: string;
  id: number;
  name: string;
  status: string;
  type: string;
  profileImage?: object;
  regionalSettings: object;
  permissions: object;
  serviceFeatures: object;
};

type ServiceInfo = {
  dialInNumbers: object[];
  domain: string;
  externalUserInfo: {
    accountId: string;
    hostKey: string;
    personalMeetingId: string;
    userId: string;
    userToken: string;
    userType: number;
  };
  intlDialInNumbersUri: string;
  supportUri: string;
  uri: string;
  mobileDialingNumberTpl: string;
  phoneDialingNumberTpl: string;
};

export type MeetingScheduleModel = {
  durationInMinutes: number;
  timeZone?: { id: string };
  startTime?: string;
};

export type RCVideoScheduleModel = {
  name: string;
  startTime: Date;
  duration: number;
  allowJoinBeforeHost: boolean;
  muteAudio: boolean;
  muteVideo: boolean;
  saveAsDefault: boolean;
};

export type ScheduleModel = Maybe<MeetingScheduleModel | RCVideoScheduleModel>;

export type Maybe<T> = T | undefined;
export type Either<T1, T2> = T1 | T2;

export type RCMeetingResponse = {
  topic: string;
  meetingType: any;
  allowJoinBeforeHost: any;
  startHostVideo: any;
  startParticipantsVideo: any;
  audioOptions: any;
  password: any;
  schedule?: MeetingScheduleModel;
  links: {
    joinUri: string;
  } & object;
};

export type RCVideoResponse = {
  uri: string;
  id: string;
  participantCode: string;
  hostCode: string;
  shortId: string;
  meetingUri: string;
  joinUri: string;
  notificationUrl: string;
  expiresIn: number;
  expiration: number;
  autoFinish: true;
  type: number;
  accountId: string;
  extensionId: string;
  name: string;
  allowJoinBeforeHost: boolean;
  muteAudio: boolean;
  muteVideo: boolean;
};

export type RCMeeting = {
  meeting: RCMeetingResponse;
  serviceInfo: ServiceInfo;
  extensionInfo: ExtensionInfo;
};

export type RCVideo = {
  extensionInfo: ExtensionInfo;
  dialInNumber: string;
  meeting: RCVideoResponse & RCVideoScheduleModel;
};

export type Meeting = Either<RCMeeting, RCVideo>;

export enum MeetingEvents {
  afterSchedule = 'afterSchedule',
}

export interface IGenericMeeting {
  meetingProviderType: Maybe<meetingProviderTypesProps>;
  isRCV: boolean;
  isRCM: boolean;
  extensionInfo: any;
  meeting: Maybe<Meeting>;
  defaultMeetingSetting: Maybe<Meeting>;
  isScheduling: boolean;
  showSaveAsDefault: boolean;
  brandName: string;
  status: object;

  initialize(): void;

  /**
   * Init basic meeting information
   * also load meeting settings from previous one.
   */
  init(): void;

  reload(): void;

  /**
   * Update Meeting Config
   */
  updateMeetingSettings(meeting: ScheduleModel): void;

  /**
   * requests
   */
  schedule: (
    meeting: ScheduleModel,
    config?: {
      isAlertSuccess: boolean;
    },
    opener?: Window,
  ) => Promise<Maybe<Meeting>>;

  getMeeting(meetingId: string): Promise<Maybe<Meeting>>;

  updateMeeting(
    meetingId: string,
    meeting: ScheduleModel,
    config?: {
      isAlertSuccess: boolean;
    },
    opener?: Window,
  ): Promise<Maybe<Meeting>>;

  /**
   * hook
   */
  // TODO: refactor all `scheduledHook`
  addScheduledCallBack(cb: ScheduledCallback): void;
  removeScheduledCallBack(cb: ScheduledCallback): void;
}

export type ScheduledCallback = (result: Meeting, opener: Window) => any;
