import { RcVMeetingModel } from '../../models/rcv.model';
/* TODO: this meetingProviderTypes is only used for calender-addon
 * if you want to use meetingProviderTypes
 * please turn to use MeetingProvider/interface
 */
const meetingProviderTypes = {
  meeting: 'RCMeetings',
  video: 'RCVideo',
};

export function generateRandomPassword(length = 10) {
  const charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  const charLen = charset.length;
  let retVal = '';
  for (let i = 0; i < length; i++) {
    retVal += charset.charAt(Math.floor(Math.random() * charLen));
  }
  return retVal;
}

// gsuite
function getVideoSettings(topic = '', extensionName = '') {
  return {
    name: topic || `${extensionName}'s Meeting`,
    allowJoinBeforeHost: false,
    type: 0,
    expiresIn: 31536000,
  };
}

function getDefaultVideoSettings({ topic, startTime }) {
  return {
    name: topic,
    type: 0,
    startTime,
    duration: 60,
    allowJoinBeforeHost: false,
    muteAudio: false,
    muteVideo: false,
    saveAsDefault: false,
    expiresIn: 31536000,
    isMeetingSecret: true,
    meetingPassword: generateRandomPassword(8),
    usePersonalMeetingId: false,
    personalMeetingId: '',
  } as RcVMeetingModel;
}

function getTopic(extensionName: string, brandName: string) {
  if (brandName === 'RingCentral') {
    return `${extensionName}'s ${brandName} Video meeting`;
  }
  return `${extensionName}'s ${brandName} Meeting`;
}

// TODO: will remove this when google app script could support export seperately
// export together because google app script not fully support export
export {
  meetingProviderTypes,
  getVideoSettings,
  getDefaultVideoSettings,
  getTopic,
};
