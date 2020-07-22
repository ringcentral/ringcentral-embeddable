import { pick } from 'ramda';
import {
  MeetingProviderTypesProps,
  RcVideoTypesProps,
  RcVMeetingModel,
  RcvGSuiteMeetingModel,
  RcVideoAPI,
  RcVPreferencesGET,
  RcVPreferences,
  RcVPreferencesPATCH,
} from 'ringcentral-integration/models/rcv.model';

/* TODO: this meetingProviderTypes is only used for calender-addon
 * if you want to use meetingProviderTypes
 * please turn to use MeetingProvider/interface
 */
const meetingProviderTypes: MeetingProviderTypesProps = {
  meeting: 'RCMeetings',
  video: 'RCVideo',
};

const RcVideoTypes: RcVideoTypesProps = {
  meeting: 0, // schedule
  call: 1, // instant meeting
};

const RCV_PASSWORD_REGEX = /^[A-Za-z0-9]{1,10}$/;
const DEFAULT_JBH = false;
const RCV_CREATE_API_KEYS: Array<keyof RcVideoAPI> = [
  'name',
  'type',
  'allowJoinBeforeHost',
  'muteAudio',
  'muteVideo',
  'isMeetingSecret',
  'meetingPassword',
  'expiresIn',
];
const RCV_PREFERENCES_API_KEYS: Array<keyof RcVPreferencesGET> = [
  'join_before_host',
  // 'join_video_off',
  // 'join_audio_mute',
  'password_scheduled',
  'password_instant',
];
const RCV_PREFERENCES_KEYS: Array<keyof RcVPreferences> = [
  'isMeetingSecret',
  'allowJoinBeforeHost',
  // 'muteVideo',
  // 'muteAudio'
];

/* RCINT-14566
 * Exclude characters that are hard to visually differentiate ["0", "o", "O", "I", "l"]
 */
function getDefaultChars() {
  const DEFAULT_PASSWORD_CHARSET =
    'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  return DEFAULT_PASSWORD_CHARSET;
}

function validateRandomPassword(pwd) {
  return /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9]*$/.test(pwd);
}

function generateRandomPassword(length = 10) {
  const charset = getDefaultChars();
  const charLen = charset.length;
  let retVal = '';
  for (let i = 0; i < length; i++) {
    retVal += charset.charAt(Math.floor(Math.random() * charLen));
  }
  if (!validateRandomPassword(retVal)) {
    return generateRandomPassword(length);
  }
  return retVal;
}

function validatePasswordSettings(
  meetingPassword: string,
  isMeetingSecret: boolean,
): boolean {
  if (!isMeetingSecret) {
    return true;
  }
  if (meetingPassword && RCV_PASSWORD_REGEX.test(meetingPassword)) {
    return true;
  }
  return false;
}

// gsuite
function getVideoSettings(data) {
  const {
    name = 'Scheduled meeting',
    isMeetingSecret,
    meetingPassword,
    ...params
  } = data;
  const settings: RcvGSuiteMeetingModel = {
    ...params,
    name,
    type: RcVideoTypes.meeting,
    expiresIn: 31536000,
  };

  if (isMeetingSecret) {
    settings.isMeetingSecret = true;
    settings.meetingPassword = meetingPassword;
  } else {
    settings.isMeetingSecret = false;
    settings.meetingPassword = '';
  }

  return settings;
}

function getDefaultVideoSettings({
  topic,
  startTime,
}: {
  topic: string;
  startTime: Date;
}): RcVMeetingModel {
  return {
    name: topic,
    type: RcVideoTypes.meeting,
    startTime,
    duration: 60,
    allowJoinBeforeHost: DEFAULT_JBH,
    muteAudio: false,
    muteVideo: false,
    expiresIn: 31536000,
    saveAsDefault: false,
    isMeetingSecret: true,
    meetingPassword: '',
    isMeetingPasswordValid: false,
    usePersonalMeetingId: false,
    personalMeetingId: '',
  };
}

function getTopic(extensionName: string, brandName: string) {
  if (brandName === 'RingCentral') {
    return `${extensionName}'s ${brandName} Video Meeting`;
  }
  return `${extensionName}'s ${brandName} Meeting`;
}

/**
 * Remove client side properties before sending to RCV API
 */
function pruneMeetingObject(meeting: RcVMeetingModel): RcVideoAPI {
  return pick(RCV_CREATE_API_KEYS, meeting);
}

function transformPreferences(
  preferences: RcVPreferencesGET,
  isInstantMeeting = false,
): RcVPreferences {
  return {
    isMeetingSecret: isInstantMeeting
      ? preferences.password_instant
      : preferences.password_scheduled,
    allowJoinBeforeHost: preferences.join_before_host,
    // muteVideo: preferences.join_video_off,
    // muteAudio: preferences.join_audio_mute,
  };
}

function reversePreferences(
  preferences: RcVPreferences,
  isInstantMeeting = false,
): RcVPreferencesPATCH {
  const result = {
    join_before_host: preferences.allowJoinBeforeHost,
    // join_video_off: preferences.muteVideo,
    // join_audio_mute: preferences.muteAudio,
  } as RcVPreferencesPATCH;
  if (isInstantMeeting) {
    result.password_instant = preferences.isMeetingSecret;
  } else {
    result.password_scheduled = preferences.isMeetingSecret;
  }
  return result;
}

/**
 * Reserve only preferences fields
 */
function prunePreferencesObject(meeting: RcVMeetingModel): RcVPreferences {
  return pick(RCV_PREFERENCES_KEYS, meeting);
}

function comparePreferences(
  preferences: RcVPreferences,
  meeting: RcVMeetingModel,
): boolean {
  let preferencesChanged = false;
  if (preferences && meeting) {
    for (const key in preferences) {
      if (preferences[key] !== meeting[key]) {
        preferencesChanged = true;
        break;
      }
    }
  }
  return preferencesChanged;
}

// TODO: will remove this when google app script could support export seperately
// export together because google app script not fully support export
export {
  DEFAULT_JBH,
  RCV_PASSWORD_REGEX,
  RCV_PREFERENCES_API_KEYS,
  RcVideoTypes,
  meetingProviderTypes,
  getDefaultChars,
  validateRandomPassword,
  generateRandomPassword,
  validatePasswordSettings,
  getVideoSettings,
  getDefaultVideoSettings,
  getTopic,
  pruneMeetingObject,
  transformPreferences,
  reversePreferences,
  prunePreferencesObject,
  comparePreferences,
};
