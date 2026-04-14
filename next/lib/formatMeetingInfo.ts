import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { getRcmEventTpl, getRcvEventTpl } from '@ringcentral-integration/widgets/lib/MeetingCalendarHelper';

dayjs.extend(utc);
dayjs.extend(timezone);

export function formatRCMInfo(meetingInfo, brand, currentLocale) {
  const { schedule, meetingType } = meetingInfo.meeting;
  let timeFrom = null;
  let timeTo = null;
  if (schedule) {
    const startTime = schedule.startTime;
    const duration = schedule.durationInMinutes;
    timeFrom = dayjs.utc(startTime).format();
    timeTo = dayjs.utc(startTime).add(duration, 'm').format();
  }
  if (meetingType === 'Recurring') {
    timeFrom = dayjs.utc().format();
    timeTo = dayjs.utc().add(1, 'h').format();
  }
  return {
    topic: meetingInfo.meeting.topic,
    location: meetingInfo.meeting.links.joinUri,
    timeFrom,
    timeTo,
    details: getRcmEventTpl(meetingInfo, brand, currentLocale)
  };
}

export function formatRCVInfo(meetingInfo, brand, currentLocale) {
  const { startTime, duration } = meetingInfo.meeting;
  const timeFrom = dayjs.utc(startTime).format();
  const timeTo = dayjs
    .utc(startTime)
    .add(duration, 'm')
    .format();
  return {
    topic: meetingInfo.meeting.name,
    location: meetingInfo.meeting.joinUri,
    timeFrom,
    timeTo,
    details: getRcvEventTpl(meetingInfo, brand, currentLocale)
  };
}

export function formatMeetingInfo(meetingInfo, brand, currentLocale, isRCV = false) {
  if (isRCV) {
    return formatRCVInfo(meetingInfo, brand, currentLocale);
  }
  return formatRCMInfo(meetingInfo, brand, currentLocale)
}

export function formatMeetingForm(meetingInfo, isRCV) {
  if (!isRCV) {
    return meetingInfo;
  }
  return {
    name: meetingInfo.title,
    startTime: meetingInfo.schedule && meetingInfo.schedule.startTime,
    duration: meetingInfo.schedule && meetingInfo.schedule.durationInMinutes,
    allowJoinBeforeHost: meetingInfo.allowJoinBeforeHost,
    muteAudio: meetingInfo.muteAudio,
    muteVide: !meetingInfo.startParticipantsVideo,
    ...meetingInfo,
  };
}
