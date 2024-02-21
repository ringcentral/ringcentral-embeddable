import React, { useState } from 'react';
import {
  RcButton,
  RcTypography,
  RcList,
  RcListItem,
  RcListItemText,
  styled,
  ellipsis,
  palette2,
  setOpacity,
} from '@ringcentral/juno';
import { InfoBorder, Copy } from '@ringcentral/juno-icon';
import { handleCopy } from '@ringcentral-integration/widgets/lib/handleCopy';
import { ActionMenu } from '../ActionMenu';
import i18n from './i18n';

const Container = styled.div`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
`;

const StyledMeetingGroup = styled.div`
  &:last-child {
    margin-bottom: 20px;
  }
`;

const StyledDateName = styled(RcTypography)`
  line-height: 30px;
  padding: 10px 20px;
  text-align: center;
`;

const StyledMeetingItem = styled(RcListItem)`
  border-bottom: 1px solid ${setOpacity(palette2('neutral', 'l02'), '48')};

  &:first-child {
    border-top: 1px solid ${setOpacity(palette2('neutral', 'l02'), '48')};
  }

  .RcListItemText-primary {
    font-size: 0.875rem;
    line-height: 22px;
    ${ellipsis()}
  }

  .meeting-btn-group {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    display: none;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }

  &:hover {
    .meeting-btn-group {
      display: flex;
    }
  }

  ${({ $hoverOnMoreMenu }) =>
    $hoverOnMoreMenu &&
    `
    .meeting-btn-group {
      display: flex;
    }
  `}
`;

const StyledJoinButton = styled(RcButton)`
  margin-right: 8px;
`;

function DateName(props) {
  const { date } = props;
  return (
    <StyledDateName variant="caption1" color="neutral.f06">
      {date}
    </StyledDateName>
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
    meetingIds,
    isAllDay,
    location,
  } = props;
  const [hoverOnMoreMenu, setHoverOnMoreMenu] = useState(false);
  const startDate = formatMeetingTime(startTime, currentLocale)
  const endDate = formatMeetingTime(endTime, currentLocale)
  const meetingId = meetingIds[0];
  const joinBtn = meetingId ? (
    <StyledJoinButton
      size="small"
      color="primary"
      onClick={() => {
        onJoin(location || meetingId)
      }}
      radius="round"
    >
      {i18n.getString('join', currentLocale)}
    </StyledJoinButton>
  ) : null;
  const actions = [{
    icon: InfoBorder,
    title: i18n.getString('details', currentLocale),
    onClick: () => {
      window.open(editEventUrl)
    },
    disabled: false,
  }];
  if (meetingId && location) {
    actions.push({
      icon: Copy,
      title: i18n.getString('copy', currentLocale),
      onClick: () => {
        handleCopy(location);
      },
      disabled: false,
    });
  }
  return (
    <StyledMeetingItem $hoverOnMoreMenu={hoverOnMoreMenu}>
      <RcListItemText
        primary={title}
        secondary={isAllDay ? i18n.getString('allDay', currentLocale) : `${startDate} - ${endDate}`}
      />
      <div className="meeting-btn-group">
        {joinBtn}
        <ActionMenu
          actions={actions}
          iconVariant="contained"
          color="neutral.b01"
          size="small"
          maxActions={1}
          onMoreMenuOpen={(open) => {
            setHoverOnMoreMenu(open);
          }}
        />
      </div>
    </StyledMeetingItem>
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
    <Container className={className}>
      {
        groupedMeetings.map((groupedMeeting) => {
          return (
            <StyledMeetingGroup key={groupedMeeting.name}>
              <DateName date={groupedMeeting.name} />
              <RcList>
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
                        isAllDay={meeting.isAllDay}
                        location={meeting.location}
                      />
                    );
                  })
                }
              </RcList>
            </StyledMeetingGroup>
          );
        })
      }
    </Container>
  );
}

export default UpcomingMeetingList;
