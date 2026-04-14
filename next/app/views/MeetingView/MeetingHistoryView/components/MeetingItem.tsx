import React from 'react';

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
  onClick: (meetingId: string) => void;
  formatDateTime: (startTime: string) => string;
}

export function MeetingItem({ meeting, onClick, formatDateTime }: MeetingItemProps): React.ReactElement {
  const title = meeting.topic || meeting.name || 'Meeting';
  const timeLabel = meeting.startTime ? formatDateTime(meeting.startTime) : '';

  return (
    <li
      className="flex items-center justify-between px-4 py-3 hover:bg-neutral-b02 cursor-pointer border-b border-neutral-l01 last:border-0"
      onClick={() => onClick(meeting.id)}
      data-sign="meetingHistoryItem"
    >
      <div className="flex flex-col flex-1 min-w-0 mr-2">
        <span className="text-body2 text-neutral-f06 truncate font-medium">{title}</span>
        {timeLabel ? (
          <span className="text-caption1 text-neutral-f04 mt-0.5">{timeLabel}</span>
        ) : null}
      </div>
      {meeting.hasRecording ? (
        <span className="text-caption1 text-interactive-f01 shrink-0 ml-2">Recording</span>
      ) : null}
    </li>
  );
}
