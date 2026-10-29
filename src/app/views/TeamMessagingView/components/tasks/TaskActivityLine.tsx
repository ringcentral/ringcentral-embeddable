import { Text } from '@ringcentral/spring-ui';
import React from 'react';

import type { TaskActivity } from '../../../../services/TeamMessaging';
import { t } from '../../i18n';

/** What an activity did, when its post tells: only an event post does. */
export function getTaskActivityText(activity: TaskActivity): string {
  if (activity.status === 'Completed') {
    return t('completedTheTask');
  }
  if (activity.status === 'Pending') {
    return t('reopenedTheTask');
  }
  return t('updatedTheTask');
}

/** "completed the task Test task"; the task name opens its details. */
export function TaskActivityLine({
  activity,
  subject,
  onOpenTask,
}: {
  activity: TaskActivity;
  /** The task's latest subject, when the task is known. */
  subject?: string;
  onOpenTask?: (taskId: string) => void;
}): React.ReactElement {
  const name = subject || activity.subject || t('task');
  return (
    <Text
      className="typography-mainText text-neutral-b2"
      data-sign="taskActivity"
    >
      {getTaskActivityText(activity)}{' '}
      {onOpenTask ? (
        <button
          type="button"
          className="text-primary-f hover:underline"
          data-sign="taskActivityName"
          onClick={() => onOpenTask(activity.taskId)}
        >
          {name}
        </button>
      ) : (
        <span className="text-neutral-b0">{name}</span>
      )}
    </Text>
  );
}
