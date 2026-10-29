import { SingleFilter } from '@ringcentral-integration/micro-message/src/app/components';
import { TasksMd } from '@ringcentral/spring-icon';
import {
  Checkbox,
  CircularProgressIndicator,
  Drawer,
  EmptyState,
  Text,
} from '@ringcentral/spring-ui';
import React, { type ReactNode } from 'react';

import type {
  TeamMessagingTask,
  TeamMessagingTaskFilter,
} from '../../../../services/TeamMessaging';
import { t } from '../../i18n';
import type { TasksDrawerProps } from '../../TeamMessaging.view.interface';
import { PersonAvatar } from '../ChatAvatar';
import { PostMarkdown } from '../PostMarkdown';
import {
  canToggleTask,
  getTaskProgress,
  isTaskCompleted,
  TaskCard,
} from './TaskCard';
import { getTaskColorClass } from './taskColors';

const STATUS_LABELS: Record<NonNullable<TeamMessagingTask['status']>, string> =
  {
    Pending: 'statusPending',
    InProgress: 'statusInProgress',
    Completed: 'statusCompleted',
  };

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <Text className="typography-descriptor text-neutral-b2">{label}</Text>
      <div className="typography-mainText text-neutral-b0">{children}</div>
    </div>
  );
}

/** A task's details, with a checkbox to complete or reopen it. */
function TaskDetails({
  task,
  taskActions,
  formatTime,
  getMemberName,
}: { task: TeamMessagingTask } & Pick<
  TasksDrawerProps,
  'taskActions' | 'formatTime' | 'getMemberName'
>): React.ReactElement {
  const completed = isTaskCompleted(task);
  const assignees = taskActions.getMembers(
    (task.assignees ?? []).map(({ id }) => id),
  );
  const progress = getTaskProgress(task);
  return (
    <div
      className="flex flex-auto flex-col gap-4 overflow-y-auto p-4"
      data-sign="taskDetails"
    >
      <div
        className={`flex gap-2 border-l-4 pl-2 ${getTaskColorClass(task.color)}`}
        data-sign="taskDetailsSubject"
      >
        <span className="flex-none pt-0.5">
          <Checkbox
            checked={completed}
            disabled={!canToggleTask(task)}
            inputProps={{
              'aria-label': completed ? t('reopenTask') : t('completeTask'),
              'data-sign': 'toggleTaskCheckbox',
            }}
            onChange={(event) =>
              taskActions.toggleTask(task.id!, event.target.checked)
            }
          />
        </span>
        <div className="flex min-w-0 flex-auto flex-col">
          <span
            className={
              completed
                ? 'typography-title break-words text-neutral-b2 line-through'
                : 'typography-title break-words text-neutral-b0'
            }
          >
            {task.subject}
          </span>
          <Text className="typography-descriptor text-neutral-b2">
            {t(STATUS_LABELS[task.status ?? 'Pending'] as 'statusPending')}
            {progress && task.status !== 'InProgress' ? ` · ${progress}` : ''}
          </Text>
        </div>
      </div>
      {task.dueDate ? (
        <DetailRow label={t('dueDateLabel')}>
          {formatTime(new Date(task.dueDate).getTime())}
        </DetailRow>
      ) : null}
      <DetailRow label={t('assignees')}>
        {assignees.length === 0 ? (
          t('unassigned')
        ) : (
          <div className="flex flex-col gap-2">
            {assignees.map((member) => (
              <span key={member.id} className="flex items-center gap-2">
                <PersonAvatar member={member} size="xsmall" />
                <span className="truncate">{getMemberName(member)}</span>
              </span>
            ))}
          </div>
        )}
      </DetailRow>
      {task.description ? (
        <DetailRow label={t('description')}>
          <PostMarkdown text={task.description} renderMention={() => null} />
        </DetailRow>
      ) : null}
    </div>
  );
}

/** The chat's open or completed tasks. */
function TaskList({
  filter,
  onFilterChange,
  tasks,
  isLoading,
  taskActions,
  formatTime,
  onOpenTask,
}: Pick<
  TasksDrawerProps,
  | 'filter'
  | 'onFilterChange'
  | 'tasks'
  | 'isLoading'
  | 'taskActions'
  | 'formatTime'
  | 'onOpenTask'
>): React.ReactElement {
  const filters = [
    { label: t('openTasks'), value: 'Open' },
    { label: t('completedTasks'), value: 'Completed' },
  ];
  const renderContent = (): ReactNode => {
    if (isLoading && tasks.length === 0) {
      return (
        <div className="flex flex-auto items-center justify-center">
          <CircularProgressIndicator size="large" color="primary" />
        </div>
      );
    }
    if (tasks.length === 0) {
      return (
        <EmptyState
          icon={TasksMd}
          title={filter === 'Open' ? t('noOpenTasks') : t('noCompletedTasks')}
        />
      );
    }
    return (
      <div className="flex flex-auto flex-col overflow-y-auto">
        {tasks.map((task) => (
          <div key={task.id} className="border-b border-neutral-b4">
            <TaskCard
              bordered={false}
              task={task}
              assignees={taskActions.getMembers(
                (task.assignees ?? []).map(({ id }) => id),
              )}
              formatTime={formatTime}
              onToggle={(completed) =>
                taskActions.toggleTask(task.id!, completed)
              }
              onOpen={() => onOpenTask(task.id!)}
            />
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className="flex flex-auto flex-col overflow-hidden">
      <div className="flex-none px-3 py-1" data-sign="taskFilter">
        <SingleFilter
          data={filters}
          visibleCount={2}
          value={filter}
          onSelect={(value) => onFilterChange(value as TeamMessagingTaskFilter)}
        />
      </div>
      {renderContent()}
    </div>
  );
}

/**
 * The chat's tasks in a drawer over the chat: open or completed tasks, and
 * a task's details. The chat header serves as its header.
 */
export function TasksDrawer({
  open,
  container,
  onClose,
  filter,
  onFilterChange,
  tasks,
  isLoading,
  task,
  isTaskMissing,
  taskActions,
  formatTime,
  getMemberName,
  onOpenTask,
}: TasksDrawerProps): React.ReactElement {
  const renderBody = (): ReactNode => {
    if (task) {
      return (
        <TaskDetails
          task={task}
          taskActions={taskActions}
          formatTime={formatTime}
          getMemberName={getMemberName}
        />
      );
    }
    if (isTaskMissing) {
      return <EmptyState icon={TasksMd} title={t('taskNotFound')} />;
    }
    return (
      <TaskList
        filter={filter}
        onFilterChange={onFilterChange}
        tasks={tasks}
        isLoading={isLoading}
        taskActions={taskActions}
        formatTime={formatTime}
        onOpenTask={onOpenTask}
      />
    );
  };
  return (
    <Drawer
      open={open}
      anchor="right"
      container={container}
      onClose={onClose}
      classes={{
        body: '!w-full !max-w-full',
        content: '!p-0 !overflow-hidden flex min-h-0 flex-1 flex-col',
      }}
      bodyProps={{ 'data-sign': 'tasksDrawer' }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {renderBody()}
      </div>
    </Drawer>
  );
}
