import React from 'react';
import {
  ListItem,
  ListItemText,
  Text,
} from '@ringcentral/spring-ui';

interface MeetingHistoryItem {
  id: string;
  topic?: string;
  name?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  hasRecording?: boolean;
}

interface MeetingItemProps {
  meeting: MeetingHistoryItem;
  divider?: boolean;
  onClick: (meetingId: string) => void;
  formatDateTime: (startTime: string) => string;
}

export function MeetingItem({
  meeting,
  divider = false,
  onClick,
  formatDateTime,
}: MeetingItemProps): React.ReactElement {
  const title = meeting.topic || meeting.name || 'Meeting';
  const timeLabel = meeting.startTime ? formatDateTime(meeting.startTime) : '';

  return (
    <ListItem
      clickable
      hoverable
      divider={divider}
      className="rounded-xl"
      onClick={() => onClick(meeting.id)}
      data-sign="meetingHistoryItem"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ListItemText
          className="min-w-0 flex-1"
          primary={(
            <Text noWrap titleWhenOverflow={500} className="text-neutral-f06">
              {title}
            </Text>
          )}
          secondary={timeLabel ? (
            <Text className="text-neutral-f04">{timeLabel}</Text>
          ) : undefined}
        />
        {meeting.hasRecording ? (
          <Text className="shrink-0 text-interactive-f01">Recording</Text>
        ) : null}
      </div>
    </ListItem>
  );
}
