import React from 'react';
import classnames from 'classnames';

import { RcIconButton, RcButton } from '@ringcentral-integration/rcui';

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
  const {
    title,
    startTime,
    endTime,
    currentLocale,
    onJoin,
    editEventUrl,
    meetingIds
  } = props;
  const startDate = formatMeetingTime(startTime, currentLocale)
  const endDate = formatMeetingTime(endTime, currentLocale)
  const meetingId = meetingIds[0];
  const joinBtn = meetingId ? (
    <RcButton
      size="small"
      color="primary"
      className={styles.button}
      onClick={() => {
        onJoin(meetingId)
      }}
    >
      Join
    </RcButton>
  ) : null;
  return (
    <div className={styles.meetingItem}>
      <div className={styles.meetingName}>{title}</div>
      <div className={styles.meetingTime}>
        {startDate} - {endDate}
      </div>
      <div className={styles.buttons}>
        <span title="Details" className={styles.iconButton}>
          <RcIconButton
            size="small"
            icon="info"
            onClick={() => window.open(editEventUrl)}
          />
        </span>
        {joinBtn}
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
  const { meetings, currentLocale, className, onJoin } = props;
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
                        editEventUrl={meeting.editEventUrl}
                        onJoin={onJoin}
                        meetingIds={meeting.meetingIds}
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
