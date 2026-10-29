import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import { ModalView } from '@ringcentral-integration/micro-core/src/app/views';
import {
  action,
  injectable,
  portal,
  RcViewModule,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import { EditMd, TrashMd } from '@ringcentral/spring-icon';
import React, { useEffect, useMemo, useState } from 'react';

import {
  getMember,
  getPersonName,
  getTaskListKey,
  TeamMessagingChats,
  type TeamMessagingMember,
  TeamMessagingPersons,
  TeamMessagingPosts,
  type TeamMessagingResult,
  type TeamMessagingTask,
  type TeamMessagingTaskFilter,
  TeamMessagingTasks,
} from '../../services/TeamMessaging';
import { CreateTaskContent } from './components/tasks/CreateTaskContent';
import { TasksDrawer } from './components/tasks/TasksDrawer';
import { t } from './i18n';
import type {
  CreateTaskValues,
  CreateTeamContact,
  HeaderMenuAction,
  TaskActions,
  TaskFormInitialValues,
  TasksViewProps,
} from './TeamMessaging.view.interface';

function getTime(value?: string): number {
  return value ? new Date(value).getTime() : 0;
}

/**
 * A chat's tasks for a filter: those the drawer listed and those its posts
 * carry, so the drawer agrees with the chat before the list loads. Newest
 * first.
 */
function getChatTasks({
  chatId,
  filter,
  listedIds = [],
  tasksMap,
}: {
  chatId: string;
  filter: TeamMessagingTaskFilter;
  listedIds?: string[];
  tasksMap: Record<string, TeamMessagingTask>;
}): TeamMessagingTask[] {
  const ids = new Set(listedIds);
  Object.values(tasksMap).forEach((task) => {
    if (task.id && task.chatIds?.includes(chatId)) {
      ids.add(task.id);
    }
  });
  // A task completed or reopened here moves between the lists at once.
  return Array.from(ids)
    .map((id) => tasksMap[id])
    .filter(
      (task): task is TeamMessagingTask =>
        !!task && (task.status === 'Completed') === (filter === 'Completed'),
    )
    .sort(
      (first, second) =>
        getTime(second.creationTime) - getTime(first.creationTime),
    );
}

/**
 * Chat tasks: the "Create task" dialog, task actions for posts, and the
 * tasks drawer over a chat.
 */
@injectable({
  name: 'TeamMessagingTasksView',
})
export class TeamMessagingTasksView extends RcViewModule {
  constructor(
    private _teamMessagingChats: TeamMessagingChats,
    private _teamMessagingTasks: TeamMessagingTasks,
    private _teamMessagingPosts: TeamMessagingPosts,
    private _teamMessagingPersons: TeamMessagingPersons,
    private _modalView: ModalView,
    private _toast: Toast,
  ) {
    super();
    // The chat list is fetched on demand; a failed fetch must not keep this
    // view, and the app view that renders it, from initializing.
    const readiness = this as unknown as {
      _ignoreModuleReadiness(dep: object): void;
    };
    readiness._ignoreModuleReadiness(_teamMessagingChats);
  }

  /** The chat the "Create task" dialog creates in. */
  @state
  createTaskChatId: string | null = null;

  @action
  private _setCreateTaskChatId(chatId: string | null): void {
    this.createTaskChatId = chatId;
  }

  @portal
  private _createTaskModal = this._modalView.create({
    view: () => {
      const chatId = useConnector(() => this.createTaskChatId) ?? '';
      return (
        <CreateTaskContent
          searchMembers={(searchText) => this.searchMembers(chatId, searchText)}
          onSubmit={(values) => this.createTask(chatId, values)}
          onCancel={() => undefined}
        />
      );
    },
    props: () => ({
      header: t('createTask'),
      'data-sign': 'createTaskModal',
    }),
  });

  /** The task the "Edit task" dialog edits. */
  @state
  editTaskId: string | null = null;

  @action
  private _setEditTaskId(taskId: string | null): void {
    this.editTaskId = taskId;
  }

  @portal
  private _editTaskModal = this._modalView.create({
    view: () => {
      const { taskId, task } = useConnector(() => ({
        taskId: this.editTaskId ?? '',
        task: this.editTaskId
          ? this._teamMessagingTasks.tasksMap[this.editTaskId]
          : undefined,
      }));
      const chatId = task?.chatIds?.[0] ?? '';
      // The form takes its values once, from the task as it was opened.
      const [initialValues] = useState(() => this._getFormValues(task));
      return (
        <CreateTaskContent
          searchMembers={(searchText) => this.searchMembers(chatId, searchText)}
          initialValues={initialValues}
          submitLabel={t('save')}
          onSubmit={(values) => this.updateTask(taskId, values)}
          onCancel={() => undefined}
        />
      );
    },
    props: () => ({
      header: t('editTask'),
      'data-sign': 'editTaskModal',
    }),
  });

  @portal
  private _deleteTaskModal = this._modalView.create({
    props: () => ({
      header: t('deleteTask'),
      variant: 'confirm' as const,
      content: t('deleteTaskConfirm'),
      confirmButtonText: t('delete'),
      confirmButtonProps: { color: 'danger' as const },
      cancelButtonText: t('cancel'),
      'data-sign': 'deleteTaskModal',
    }),
  });

  private _getFormValues(
    task?: TeamMessagingTask,
  ): TaskFormInitialValues | undefined {
    if (!task) {
      return undefined;
    }
    const assignees = this.getMembers(
      (task.assignees ?? []).map(({ id }) => id),
    ).map((member) => ({
      id: member.id,
      name: getPersonName(member),
      email: member.email ?? '',
      avatarUrl: member.avatar ?? undefined,
    }));
    return {
      subject: task.subject ?? '',
      assignees,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      description: task.description ?? '',
    };
  }

  openCreateTask(chatId: string): void {
    this._setCreateTaskChatId(chatId);
    this._modalView.open(this._createTaskModal);
  }

  /** Chat members, the user included, whose name or email matches. */
  searchMembers(chatId: string, searchText: string): CreateTeamContact[] {
    const search = searchText.trim().toLowerCase();
    const members = this._teamMessagingChats.getChatItem(chatId)?.members ?? [];
    return members
      .filter((member) => !!member.email)
      .map((member) => ({
        id: member.id,
        name: getPersonName(member),
        email: member.email!,
        avatarUrl: member.avatar ?? undefined,
      }))
      .filter(
        (contact) =>
          contact.name.toLowerCase().includes(search) ||
          contact.email.toLowerCase().includes(search),
      );
  }

  async createTask(
    chatId: string,
    { subject, assigneeIds, dueDate, description }: CreateTaskValues,
  ): Promise<TeamMessagingResult> {
    const result = await this._teamMessagingTasks.createTask(chatId, {
      subject,
      assignees: assigneeIds.map((id) => ({ id })),
      ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
      ...(description ? { description } : {}),
    });
    if (!result?.ok) {
      this._toast.danger({ message: t('createTaskFailed') });
      return { ok: false };
    }
    // Without live events, the task post shows once the posts reload.
    void this._teamMessagingPosts.fetchPosts(chatId);
    return result;
  }

  openEditTask(taskId: string): void {
    this._setEditTaskId(taskId);
    this._modalView.open(this._editTaskModal);
  }

  async updateTask(
    taskId: string,
    { subject, assigneeIds, dueDate, description }: CreateTaskValues,
  ): Promise<TeamMessagingResult> {
    const result = await this._teamMessagingTasks.updateTask(taskId, {
      subject,
      assignees: assigneeIds.map((id) => ({ id })),
      ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
      description,
    });
    if (!result?.ok) {
      this._toast.danger({ message: t('updateTaskFailed') });
      return { ok: false };
    }
    return result;
  }

  /** Ask before deleting a task; `onDeleted` runs once it is deleted. */
  async confirmDeleteTask(
    taskId: string,
    onDeleted: () => void,
  ): Promise<void> {
    const confirmed = await this._modalView.open(this._deleteTaskModal).closed;
    if (!confirmed) {
      return;
    }
    const result = await this._teamMessagingTasks.deleteTask(taskId);
    if (!result?.ok) {
      this._toast.danger({ message: t('deleteTaskFailed') });
      return;
    }
    void this._teamMessagingPosts.removeAttachmentPosts(taskId);
    onDeleted();
  }

  /** The task header's "More" menu: edit and delete the task. */
  getTaskMenuActions(
    taskId: string,
    onDeleted: () => void,
  ): HeaderMenuAction[] {
    return [
      {
        key: 'edit',
        symbol: EditMd,
        label: t('edit'),
        onClick: () => this.openEditTask(taskId),
      },
      {
        key: 'delete',
        symbol: TrashMd,
        label: t('delete'),
        onClick: () => void this.confirmDeleteTask(taskId, onDeleted),
      },
    ];
  }

  async toggleTask(taskId: string, completed: boolean): Promise<void> {
    const result = await this._teamMessagingTasks.setCompleted(
      taskId,
      completed,
    );
    if (!result?.ok) {
      this._toast.danger({ message: t('updateTaskFailed') });
    }
  }

  getMembers(ids: string[]): TeamMessagingMember[] {
    const personsMap = this._teamMessagingPersons.personsMap;
    const myId = this._teamMessagingChats.myId;
    return ids.map((id) => getMember({ id, personsMap, myId }));
  }

  /** Task actions for posts; `openTask` shows a task in the drawer. */
  useTaskActions(openTask: (taskId: string) => void): TaskActions {
    // Posts re-render when tasks or persons change.
    const tasksMap = useConnector(() => this._teamMessagingTasks.tasksMap);
    const personsMap = useConnector(
      () => this._teamMessagingPersons.personsMap,
    );
    return useMemo(
      () => ({
        getTask: (taskId: string) => tasksMap[taskId],
        getMembers: (ids: string[]) => this.getMembers(ids),
        toggleTask: (taskId: string, completed: boolean) =>
          void this.toggleTask(taskId, completed),
        openTask,
      }),
      // personsMap changes the members getMembers returns.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [tasksMap, personsMap, openTask],
    );
  }

  /** Load the listed tasks when the list shows, or the task asked for. */
  private _useLoadTasks({
    chatId,
    open,
    taskId,
    filter,
  }: Pick<TasksViewProps, 'chatId' | 'open' | 'taskId'> & {
    filter: TeamMessagingTaskFilter;
  }): boolean {
    const [taskChecked, setTaskChecked] = useState(false);
    useEffect(() => {
      if (open && !taskId) {
        void this._teamMessagingTasks.loadChatTasks(chatId, filter);
      }
    }, [chatId, open, taskId, filter]);
    useEffect(() => {
      if (!open || !taskId) {
        return undefined;
      }
      let active = true;
      setTaskChecked(false);
      void this._teamMessagingTasks
        .loadTask(taskId)
        .finally(() => active && setTaskChecked(true));
      return () => {
        active = false;
      };
    }, [open, taskId]);
    return taskChecked;
  }

  component(props: TasksViewProps): React.ReactElement {
    const { chatId, open, taskId } = props;
    const [filter, setFilter] = useState<TeamMessagingTaskFilter>('Open');
    const taskChecked = this._useLoadTasks({ chatId, open, taskId, filter });
    const { tasks, isLoading, task } = useConnector(() => {
      const key = getTaskListKey(chatId, filter);
      const tasksMap = this._teamMessagingTasks.tasksMap;
      return {
        tasks: getChatTasks({
          chatId,
          filter,
          listedIds: this._teamMessagingTasks.listedTaskIds[key],
          tasksMap,
        }),
        // Never listed yet counts as loading, not as an empty list.
        isLoading:
          !!this._teamMessagingTasks.loadingLists[key] ||
          !this._teamMessagingTasks.listedTaskIds[key],
        task: taskId ? tasksMap[taskId] : undefined,
      };
    });
    return (
      <TasksDrawer
        {...props}
        filter={filter}
        onFilterChange={setFilter}
        tasks={tasks}
        isLoading={isLoading}
        task={task}
        isTaskMissing={!!taskId && !task && taskChecked}
      />
    );
  }
}
