import formatMessage from 'format-message';
import moment from 'moment';

import i18n from './i18n';

function formatMeetingId(meetingId) {
  const slices = [];
  for (let i = 0; i < meetingId.length; i += 3) {
    const nextSlice = meetingId.substr(i, 3);
    if (nextSlice.length === 1) {
      slices.push(slices.pop() + nextSlice);
    } else if (nextSlice.length === 2) {
      const lastSlice = slices.pop();
      const lastLastSlice = slices.pop();
      slices.push(lastLastSlice + lastSlice.substr(0, 1));
      slices.push(lastSlice.substr(1, 2) + nextSlice);
    } else {
      slices.push(nextSlice);
    }
  }
  return slices.join(' ');
}

function getPasswordTpl(password, currentLocale) {
  const passwordLiteral = i18n.getString('password', currentLocale);
  return password ? `
    ${passwordLiteral}: ${password}`
    : '';
}

function getDetailTpl(
  {
    meeting,
    serviceInfo,
    extensionInfo,
  },
  brandConfig,
  currentLocale
) {
  const accountName = extensionInfo.name;
  const meetingId = meeting.id;
  const joinUri = meeting.links.joinUri;
  const password = meeting.password;

  const mobileDialingNumberTpl = serviceInfo.mobileDialingNumberTpl;
  const phoneDialingNumberTpl = serviceInfo.phoneDialingNumberTpl;
  const passwordTpl = getPasswordTpl(password, currentLocale);
  return formatMessage(i18n.getString('inviteMeetingContent', currentLocale), {
    accountName,
    brandName: brandConfig.name,
    joinUri,
    passwordTpl,
    mobileDialingNumberTpl,
    phoneDialingNumberTpl,
    meetingId: formatMeetingId(meetingId),
    teleconference: brandConfig.teleconference,
  });
}

export default function formatMeetingInfo(meetingInfo, brandConfig, currentLocale) {
  const { schedule, meetingType } = meetingInfo.meeting;
  let timeFrom = null;
  let timeTo = null;
  if (schedule) {
    const startTime = schedule.startTime;
    const duration = schedule.durationInMinutes;
    timeFrom = moment.utc(startTime)
      .format();
    timeTo = moment.utc(startTime)
      .add(duration, 'm')
      .format();
  }
  if (meetingType === 'Recurring') {
    timeFrom = moment.utc().format();
    timeTo = moment.utc().add(1, 'h').format();
  }
  return {
    topic: meetingInfo.meeting.topic,
    location: meetingInfo.meeting.links.joinUri,
    timeFrom,
    timeTo,
    details: getDetailTpl(meetingInfo, brandConfig, currentLocale)
  };
}

export function getConferenceLocationField({
  dialInNumber,
  participantCode
}) {
  return formatMessage(i18n.getString('conferenceLocationField'), {
    participantCode,
    dialInNumber,
  });
}
