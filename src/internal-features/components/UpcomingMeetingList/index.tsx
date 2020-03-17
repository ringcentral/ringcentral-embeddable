import React from 'react';
import classnames from 'classnames';

import i18n from './i18n';
import styles from './styles.scss';

function DateName(props) {
  const { date } = props;
  return (
    <div className={styles.dateName}>{date}</div>
  );
}

function formatMeetingTime(time, currentLocale) {
  const date = new Date(time);
  return date.toLocaleTimeString(currentLocale, {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function MeetingItem(props) {
  const { title, startTime, endTime, currentLocale } = props;
  const startDate = formatMeetingTime(startTime, currentLocale)
  const endDate = formatMeetingTime(endTime, currentLocale)
  return (
    <div className={styles.meetingItem}>
      <div className={styles.meetingName}>{title}</div>
      <div className={styles.meetingTime}>
        {startDate} - {endDate}
      </div>
    </div>
  );
}

function groupMeetings(meetings, currentLocale) {
  const result = [];
  const currentDate = new Date();
  const todayDateKey = currentDate.toLocaleDateString(
    currentLocale,
    {weekday: 'long', month: 'numeric', day: 'numeric'}
  );
  meetings.forEach((meeting) => {
    const date = new Date(meeting.startTime);
    let dateKey = date.toLocaleDateString(
      currentLocale,
      {weekday: 'long', month: 'numeric', day: 'numeric'}
    );
    if (dateKey === todayDateKey) {
      dateKey = i18n.getString('today', currentLocale);
    }
    let isExistDayIndex = result.findIndex(r => r.name === dateKey);
    if (isExistDayIndex < 0) {
      isExistDayIndex = result.length;
      result.push({ name: dateKey, meetings: [] });
    }
    result[isExistDayIndex].meetings.push(meeting);
  });
  return result;
}

function UpcomingMeetingList(props) {
  const { meetings, currentLocale, className } = props;
  const groupedMeetings = groupMeetings(meetings, currentLocale);
  return (
    <div className={classnames(styles.meetingList, className)}>
      {
        groupedMeetings.map((groupedMeeting) => {
          return (
            <div key={groupedMeeting.name} className={styles.meetingGroup}>
              <DateName date={groupedMeeting.name} />
              <div>
                {
                  groupedMeeting.meetings.map((meeting) => {
                    return (
                      <MeetingItem
                        key={meeting.id}
                        title={meeting.title}
                        startTime={meeting.startTime}
                        endTime={meeting.endTime}
                        currentLocale={currentLocale}
                      />
                    );
                  })
                }
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

export default UpcomingMeetingList;
