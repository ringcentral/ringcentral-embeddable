import React from 'react';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import { CirclePlayMd } from '@ringcentral/spring-icon';
import {
  IconButton,
  ListItem,
  ListItemText,
  Text,
  Tooltip,
} from '@ringcentral/spring-ui';

interface MeetingRecordingMetadata {
  readonly duration?: number;
}

interface MeetingRecording {
  readonly metadata?: MeetingRecordingMetadata;
}

interface MeetingHostInfo {
  readonly displayName?: string;
}

export interface MeetingHistoryItem {
  readonly id: string;
  readonly displayName?: string;
  readonly topic?: string;
  readonly name?: string;
  readonly startTime: string;
  readonly endTime?: string;
  readonly duration?: number;
  readonly hasRecording?: boolean;
  readonly hostInfo?: MeetingHostInfo;
  readonly recordings?: readonly MeetingRecording[];
}

interface MeetingItemProps {
  readonly meeting: MeetingHistoryItem;
  readonly divider?: boolean;
  readonly type?: string;
  readonly onClick: (meetingId: string) => void;
  readonly formatDateTime: (startTime: string) => string;
  readonly t: (key: 'play') => string;
}

function getMeetingTitle(meeting: MeetingHistoryItem): string {
  return meeting.displayName || meeting.topic || meeting.name || 'Meeting';
}

function getDurationLabel(meeting: MeetingHistoryItem, type?: string): string {
  const recordingDuration = meeting.recordings?.[0]?.metadata?.duration;
  const duration = type === 'recordings' && recordingDuration !== undefined
    ? recordingDuration
    : meeting.duration;

  return formatDuration(duration);
}

function renderHoverActions({
  hasRecording,
  meetingId,
  onClick,
  t,
}: {
  readonly hasRecording: boolean;
  readonly meetingId: string;
  readonly onClick: (meetingId: string) => void;
  readonly t: (key: 'play') => string;
}): React.ReactNode {
  if (!hasRecording) {
    return undefined;
  }

  return (
    <Tooltip title={t('play')}>
      <IconButton
        symbol={CirclePlayMd}
        label={t('play')}
        title={t('play')}
        size="medium"
        variant="contained"
        color="secondary"
        onClick={() => {
          onClick(meetingId);
        }}
        className="mr-1"
      />
    </Tooltip>
  );
}

export function MeetingItem({
  meeting,
  divider = false,
  type,
  onClick,
  formatDateTime,
  t,
}: MeetingItemProps): React.ReactElement {
  const title = getMeetingTitle(meeting);
  const timeLabel = meeting.startTime ? formatDateTime(meeting.startTime) : '';
  const durationLabel = getDurationLabel(meeting, type);
  const hostLabel = meeting.hostInfo?.displayName;
  const hasRecording = Boolean(meeting.recordings?.[0] || meeting.hasRecording);

  return (
    <ListItem
      divider={divider}
      hoverable={hasRecording}
      hoverActions={renderHoverActions({
        hasRecording,
        meetingId: meeting.id,
        onClick,
        t,
      })}
      className="group rounded-xl"
      size="auto"
      classes={{
        content: 'bg-inherit !px-3 !py-2',
      }}
      data-sign="meetingHistoryItem"
    >
      <ListItemText
        className="min-w-0 flex-1 px-2 py-1"
        primary={title}
        secondary={(
          <div className="flex min-w-0 items-center gap-3 pt-1">
            <div className="flex min-w-0 flex-1 items-center overflow-hidden">
              <Text className="shrink-0 text-neutral-f04">{durationLabel}</Text>
              {hostLabel ? (
                <>
                  <div className="mx-1 h-4 w-px shrink-0 bg-neutral-l03" />
                  <Text
                    noWrap
                    titleWhenOverflow={500}
                    className="min-w-0 truncate text-neutral-f04"
                  >
                    {hostLabel}
                  </Text>
                </>
              ) : null}
            </div>
            {timeLabel ? (
              <Text className="shrink-0 text-neutral-f04">{timeLabel}</Text>
            ) : null}
          </div>
        )}
      />
    </ListItem>
  );
}
