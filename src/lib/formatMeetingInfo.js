import moment from 'moment';
import { getRcmEventTpl, getRcvEventTpl } from 'ringcentral-widgets/lib/MeetingCalendarHelper';

export function formatRCMInfo(meetingInfo, brand, currentLocale) {
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
    details: getRcmEventTpl(meetingInfo, brand, currentLocale)
  };
}

export function formatRCVInfo(meetingInfo, brand, currentLocale) {
  const { startTime, duration } = meetingInfo.meeting;
  const timeFrom = moment.utc(startTime).format();
  const timeTo = moment
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
