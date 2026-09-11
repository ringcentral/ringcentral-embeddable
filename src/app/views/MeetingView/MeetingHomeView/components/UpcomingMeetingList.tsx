import React from 'react';
import { handleCopy } from '@ringcentral-integration/widgets/lib/handleCopy';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { CopyMd, InfoMd } from '@ringcentral/spring-icon';
import {
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Text,
  Tooltip,
} from '@ringcentral/spring-ui';
import i18n from '../i18n';

export interface UpcomingMeeting {
  readonly id: string;
  readonly title: string;
  readonly startTime?: string;
  readonly endTime?: string;
  readonly isAllDay?: boolean;
  readonly editEventUrl?: string;
  readonly location?: string;
  readonly description?: string;
  readonly joinUri?: string;
}

interface UpcomingMeetingListProps {
  meetings: UpcomingMeeting[];
  onJoin: (meetingId: string) => void;
  currentLocale: string;
}

interface UpcomingMeetingGroup {
  readonly key: string;
  readonly label?: string;
  readonly meetings: UpcomingMeeting[];
}

interface JoinTarget {
  readonly meetingId: string;
  readonly meetingUri: string;
}

function isSameDate(firstDate: Date, secondDate: Date): boolean {
  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate();
}

function parseMeetingDate(timeStr?: string): Date | null {
  if (!timeStr) {
    return null;
  }

  const meetingDate = new Date(timeStr);

  if (Number.isNaN(meetingDate.getTime())) {
    return null;
  }

  return meetingDate;
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

function formatDateGroupLabel(
  timeStr: string,
  locale: string,
  todayLabel: string,
  tomorrowLabel: string,
): string | undefined {
  const meetingDate = parseMeetingDate(timeStr);

  if (!meetingDate) {
    return undefined;
  }

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (isSameDate(meetingDate, today)) {
    return todayLabel;
  }

  if (isSameDate(meetingDate, tomorrow)) {
    return tomorrowLabel;
  }

  return formatDate(timeStr, locale);
}

function getDateGroupKey(timeStr?: string): string | undefined {
  const meetingDate = parseMeetingDate(timeStr);

  if (!meetingDate) {
    return undefined;
  }

  return `${meetingDate.getFullYear()}-${meetingDate.getMonth()}-${meetingDate.getDate()}`;
}

function groupMeetingsByDate(
  meetings: UpcomingMeeting[],
  locale: string,
  todayLabel: string,
  tomorrowLabel: string,
): UpcomingMeetingGroup[] {
  const groups = new Map<string, UpcomingMeetingGroup>();

  meetings.forEach((meeting) => {
    const groupKey = getDateGroupKey(meeting.startTime) ?? 'unknown';
    const existingGroup = groups.get(groupKey);

    if (existingGroup) {
      existingGroup.meetings.push(meeting);
      return;
    }

    groups.set(groupKey, {
      key: groupKey,
      label: meeting.startTime
        ? formatDateGroupLabel(meeting.startTime, locale, todayLabel, tomorrowLabel)
        : undefined,
      meetings: [meeting],
    });
  });

  return [...groups.values()];
}

function extractJoinUri(source?: string): string {
  if (!source || !source.includes('/join/')) {
    return '';
  }

  const matchedUri = source.match(/https?:\/\/[^\s<>"']*\/join\/[^\s<>"']*/i)?.[0];

  if (!matchedUri) {
    return '';
  }

  return matchedUri
    .replace(/[),.;]+$/, '')
    .replace(/&amp;/g, '&');
}

function getMeetingUri(meeting: UpcomingMeeting): string {
  if (meeting.joinUri) {
    return meeting.joinUri;
  }

  return extractJoinUri(meeting.location) || extractJoinUri(meeting.description);
}

function getJoinTarget(meeting: UpcomingMeeting): JoinTarget {
  const meetingUri = getMeetingUri(meeting);

  if (!meetingUri) {
    return {
      meetingId: '',
      meetingUri: '',
    };
  }

  let meetingId = meetingUri.split('/join/')[1] ?? '';

  if (meetingId.indexOf('?') > 0) {
    meetingId = meetingId.split('?')[0] ?? '';
  }

  return {
    meetingId,
    meetingUri,
  };
}

function formatMeetingTimeLabel(meeting: UpcomingMeeting, locale: string): string | undefined {
  if (meeting.isAllDay) {
    return i18n.getString('allDay');
  }

  if (!meeting.startTime) {
    return undefined;
  }

  const startTimeLabel = formatTime(meeting.startTime, locale);

  if (!meeting.endTime) {
    return startTimeLabel;
  }

  return `${startTimeLabel} - ${formatTime(meeting.endTime, locale)}`;
}

function renderHoverActions({
  editEventUrl,
  meetingId,
  meetingUri,
  onJoin,
  t,
}: {
  readonly editEventUrl?: string;
  readonly meetingId: string;
  readonly meetingUri: string;
  readonly onJoin: (meetingId: string) => void;
  readonly t: (key: 'join' | 'details' | 'copy') => string;
}): React.ReactNode {
  const joinTarget = meetingUri || meetingId;
  const hasJoinAction = Boolean(meetingId);
  const hasCopyAction = Boolean(meetingUri);
  const hasDetailsAction = Boolean(editEventUrl);

  if (!hasJoinAction && !hasCopyAction && !hasDetailsAction) {
    return undefined;
  }

  return (
    <div className="flex items-center gap-1">
      {hasDetailsAction ? (
        <Tooltip title={t('details')}>
          <IconButton
            symbol={InfoMd}
            label={t('details')}
            title={t('details')}
            size="medium"
            color="secondary"
            variant="contained"
            onClick={() => {
              window.open(editEventUrl);
            }}
            className="mr-1"
          />
        </Tooltip>
      ) : null}
      {hasCopyAction ? (
        <Tooltip title={t('copy')}>
          <IconButton
            symbol={CopyMd}
            label={t('copy')}
            title={t('copy')}
            size="medium"
            color="secondary"
            variant="contained"
            onClick={() => {
              void handleCopy(meetingUri);
            }}
            className="mr-1"
          />
        </Tooltip>
      ) : null}
      {hasJoinAction ? (
        <Button
          color="primary"
          size="small"
          onClick={() => onJoin(joinTarget)}
        >
          {t('join')}
        </Button>
      ) : null}
    </div>
  );
}

export function UpcomingMeetingList({
  meetings,
  onJoin,
  currentLocale,
}: UpcomingMeetingListProps): React.ReactElement {
  const { t } = useLocale(i18n);
  const meetingGroups = groupMeetingsByDate(
    meetings,
    currentLocale,
    t('today'),
    t('tomorrow'),
  );

  return (
    <List className="py-1 pb-2">
      {meetingGroups.map((meetingGroup) => (
        <React.Fragment key={meetingGroup.key}>
          {meetingGroup.label ? (
            <Text className="px-3 pt-2 pb-1 typography-mainText" component="div">
              {meetingGroup.label}
            </Text>
          ) : null}
          {meetingGroup.meetings.map((meeting, index) => {
            const timeLabel = formatMeetingTimeLabel(meeting, currentLocale);
            const { meetingId, meetingUri } = getJoinTarget(meeting);

            return (
              <ListItem
                key={meeting.id}
                size="auto"
                hoverable
                hoverActions={renderHoverActions({
                  editEventUrl: meeting.editEventUrl,
                  meetingId,
                  meetingUri,
                  onJoin,
                  t,
                })}
                className="group rounded-xl"
                classes={{
                  content: 'bg-inherit !px-3 !py-2',
                }}
              >
                <ListItemText
                  primary={meeting.title}
                  secondary={timeLabel}
                />
              </ListItem>
            );
          })}
        </React.Fragment>
      ))}
    </List>
  );
}
