import { Checkbox, Text } from '@ringcentral/spring-ui';
import clsx from 'clsx';
import React from 'react';

import type {
  TeamMessagingMember,
  TeamMessagingTask,
} from '../../../../services/TeamMessaging';
import { t } from '../../i18n';
import { PersonAvatar } from '../ChatAvatar';
import { getTaskColorClass } from './taskColors';

/** Assignee avatars shown before "+N". */
const MAX_AVATARS = 3;

/** Whether a task is completed. */
export function isTaskCompleted(task: TeamMessagingTask): boolean {
  return task.status === 'Completed';
}

/** Whether the checkbox can complete the task; a percentage task cannot. */
export function canToggleTask(task: TeamMessagingTask): boolean {
  return task.completenessCondition !== 'Percentage';
}

function isOverdue(task: TeamMessagingTask): boolean {
  return (
    !!task.dueDate &&
    !isTaskCompleted(task) &&
    new Date(task.dueDate).getTime() < Date.now()
  );
}

/** "In progress", "50% complete" or nothing for a pending task. */
export function getTaskProgress(task: TeamMessagingTask): string | undefined {
  if (task.completenessCondition === 'Percentage' && !isTaskCompleted(task)) {
    return t('percentComplete', { percent: task.completenessPercentage ?? 0 });
  }
  return task.status === 'InProgress' ? t('inProgress') : undefined;
}

export function TaskAssignees({
  assignees,
}: {
  assignees: TeamMessagingMember[];
}): React.ReactElement {
  if (assignees.length === 0) {
    return (
      <Text className="typography-descriptor text-neutral-b2">
        {t('unassigned')}
      </Text>
    );
  }
  const extra = assignees.length - MAX_AVATARS;
  return (
    <span className="flex items-center gap-0.5" data-sign="taskAssignees">
      {assignees.slice(0, MAX_AVATARS).map((member) => (
        <PersonAvatar key={member.id} member={member} size="xsmall" />
      ))}
      {extra > 0 ? (
        <Text className="typography-descriptor pl-1 text-neutral-b2">
          +{extra}
        </Text>
      ) : null}
    </span>
  );
}

/**
 * A task: its color bar, a checkbox to complete or reopen it, the subject,
 * the due date (red when overdue) and the assignees. Clicking it opens the
 * task's details.
 */
export function TaskCard({
  task,
  assignees,
  formatTime,
  onToggle,
  onOpen,
  bordered = true,
}: {
  task: TeamMessagingTask;
  assignees: TeamMessagingMember[];
  formatTime: (utcTimestamp: number) => string;
  onToggle: (completed: boolean) => void;
  onOpen: () => void;
  /** A card in a post; a row in the tasks list has no border. */
  bordered?: boolean;
}): React.ReactElement {
  const completed = isTaskCompleted(task);
  const progress = getTaskProgress(task);
  return (
    <div
      role="button"
      tabIndex={0}
      className={clsx(
        'flex cursor-pointer gap-2 border-l-4 py-2 pl-2 pr-3 hover:bg-neutral-b5',
        getTaskColorClass(task.color),
        bordered && 'mt-1 rounded border-y border-r border-y-neutral-b4 border-r-neutral-b4',
      )}
      data-sign="taskCard"
      onClick={onOpen}
      onKeyDown={(event) => event.key === 'Enter' && onOpen()}
    >
      <span
        className="flex-none pt-0.5"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <Checkbox
          checked={completed}
          disabled={!canToggleTask(task)}
          inputProps={{
            'aria-label': completed ? t('reopenTask') : t('completeTask'),
            'data-sign': 'taskCheckbox',
          }}
          onChange={(event) => onToggle(event.target.checked)}
        />
      </span>
      <div className="flex min-w-0 flex-auto flex-col gap-1">
        <span
          className={clsx(
            'typography-subtitleMini break-words',
            completed ? 'text-neutral-b2 line-through' : 'text-neutral-b0',
          )}
          data-sign="taskSubject"
        >
          {task.subject}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <TaskAssignees assignees={assignees} />
          {task.dueDate ? (
            <Text
              className={clsx(
                'typography-descriptor',
                isOverdue(task) ? 'text-danger' : 'text-neutral-b2',
              )}
              data-sign="taskDueDate"
            >
              {t('dueDate', {
                date: formatTime(new Date(task.dueDate).getTime()),
              })}
            </Text>
          ) : null}
          {progress ? (
            <Text className="typography-descriptor text-primary-f">
              {progress}
            </Text>
          ) : null}
        </span>
      </div>
    </div>
  );
}
