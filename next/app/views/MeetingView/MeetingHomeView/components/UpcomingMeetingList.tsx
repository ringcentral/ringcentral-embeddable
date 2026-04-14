import React from 'react';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  Button,
  List,
  ListItem,
  ListItemText,
  Text,
} from '@ringcentral/spring-ui';
import i18n from '../i18n';

export interface UpcomingMeeting {
  readonly id: string;
  readonly title: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly location?: string;
}

interface UpcomingMeetingListProps {
  meetings: UpcomingMeeting[];
  onJoin: (meetingId: string) => void;
  currentLocale: string;
}

function formatTime(timeStr: string, locale: string): string {
  try {
    return new Date(timeStr).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timeStr;
  }
}

function formatDate(timeStr: string, locale: string): string {
  try {
    return new Date(timeStr).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return timeStr;
  }
}

function formatMeetingTimeLabel(meeting: UpcomingMeeting, locale: string): string | undefined {
  if (!meeting.startTime) {
    return undefined;
  }

  return `${formatDate(meeting.startTime, locale)} ${formatTime(meeting.startTime, locale)}`;
}

export function UpcomingMeetingList({
  meetings,
  onJoin,
  currentLocale,
}: UpcomingMeetingListProps): React.ReactElement {
  const { t } = useLocale(i18n);

  return (
    <List className="px-2 py-1">
      {meetings.map((meeting, index) => {
        const timeLabel = formatMeetingTimeLabel(meeting, currentLocale);

        return (
          <ListItem
            key={meeting.id}
            divider={index < meetings.length - 1}
            hoverable
            className="rounded-xl"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ListItemText
                className="min-w-0 flex-1"
                primary={(
                  <Text noWrap titleWhenOverflow={500} className="text-neutral-f06">
                    {meeting.title}
                  </Text>
                )}
                secondary={timeLabel ? (
                  <Text className="text-neutral-f04">{timeLabel}</Text>
                ) : undefined}
              />
              <Button
                variant="text"
                color="primary"
                size="small"
                className="shrink-0"
                onClick={() => onJoin(meeting.id)}
              >
                {t('join')}
              </Button>
            </div>
          </ListItem>
        );
      })}
    </List>
  );
}
