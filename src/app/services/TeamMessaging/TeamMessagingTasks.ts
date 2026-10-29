import type TMCreateTaskRequest from '@rc-ex/core/lib/definitions/TMCreateTaskRequest';
import type TMTaskList from '@rc-ex/core/lib/definitions/TMTaskList';
import type TMUpdateTaskRequest from '@rc-ex/core/lib/definitions/TMUpdateTaskRequest';
import {
  AppFeatures,
  Auth,
  Client,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  action,
  delegate,
  injectable,
  RcModule,
  state,
} from '@ringcentral-integration/next-core';

import { TEAM_MESSAGING_API_PATH } from './TeamMessaging.constants';
import type {
  TeamMessagingPost,
  TeamMessagingResult,
  TeamMessagingTask,
  TeamMessagingTaskFilter,
} from './TeamMessaging.interface';
import { getTaskAttachments } from './taskPosts';
import { TeamMessagingPersons } from './TeamMessagingPersons';

/** Tasks listed per page in the tasks drawer. */
const TASKS_PER_PAGE = 100;

/** Statuses of each filter: an in-progress task is still open. */
const FILTER_STATUSES: Record<TeamMessagingTaskFilter, string[]> = {
  Open: ['Pending', 'InProgress'],
  Completed: ['Completed'],
};

function getTaskTime(task?: TeamMessagingTask): number {
  return task?.lastModifiedTime ? new Date(task.lastModifiedTime).getTime() : 0;
}

/**
 * Tasks by id, kept in memory. A task post carries its task, and completing
 * or reopening a task posts an activity with the task's new state, so the
 * posts keep this up to date; the tasks drawer lists a chat's tasks on demand
 * because listing is in the Heavy rate group.
 */
@injectable({
  name: 'TeamMessagingTasks',
})
export class TeamMessagingTasks extends RcModule {
  constructor(
    protected _auth: Auth,
    protected _client: Client,
    protected _appFeatures: AppFeatures,
    protected _teamMessagingPersons: TeamMessagingPersons,
  ) {
    super();
  }

  @state
  tasksMap: Record<string, TeamMessagingTask> = {};

  /** Task ids of each chat and filter, as the tasks drawer last listed them. */
  @state
  listedTaskIds: Record<string, string[]> = {};

  @state
  loadingLists: Record<string, boolean> = {};

  @action
  private _saveTasks(tasks: TeamMessagingTask[], force = false): void {
    tasks.forEach((task) => {
      const existing = task.id ? this.tasksMap[task.id] : undefined;
      if (task.id && (force || getTaskTime(task) >= getTaskTime(existing))) {
        this.tasksMap[task.id] = task;
      }
    });
  }

  @action
  private _setTaskStatus(taskId: string, status: TeamMessagingTask['status']): void {
    const task = this.tasksMap[taskId];
    if (task) {
      task.status = status;
    }
  }

  @action
  private _removeTask(taskId: string): void {
    delete this.tasksMap[taskId];
    Object.keys(this.listedTaskIds).forEach((key) => {
      this.listedTaskIds[key] = this.listedTaskIds[key].filter(
        (id) => id !== taskId,
      );
    });
  }

  @action
  private _setListedTaskIds(key: string, ids: string[]): void {
    this.listedTaskIds[key] = ids;
  }

  @action
  private _setLoading(key: string, loading: boolean): void {
    this.loadingLists[key] = loading;
  }

  @action
  private _reset(): void {
    this.tasksMap = {};
    this.listedTaskIds = {};
    this.loadingLists = {};
  }

  override onReset(): void {
    this._reset();
  }

  /** Keep the tasks that posts carry, unless a newer copy is known. */
  saveFromPosts(posts: readonly TeamMessagingPost[]): void {
    const tasks = getTaskAttachments(posts);
    if (tasks.length > 0) {
      this._saveTasks(tasks);
      void this._teamMessagingPersons.loadPersons(
        tasks.flatMap((task) => (task.assignees ?? []).map(({ id }) => id)),
      );
    }
  }

  /** Create a task in a chat. Its task post arrives like any post. */
  @delegate('server')
  async createTask(
    chatId: string,
    request: TMCreateTaskRequest,
  ): Promise<TeamMessagingResult> {
    try {
      const response = await this._client.service
        .platform()
        .post(`${TEAM_MESSAGING_API_PATH}/chats/${chatId}/tasks`, request);
      const task = (await response.json()) as TeamMessagingTask;
      this._saveTasks([task], true);
      return { ok: true, id: task.id };
    } catch (error) {
      this.logger.error('create task failed', error);
      return { ok: false };
    }
  }

  /** Change a task. Editing sends no event, so its post shows the copy here. */
  @delegate('server')
  async updateTask(
    taskId: string,
    request: TMUpdateTaskRequest,
  ): Promise<TeamMessagingResult> {
    try {
      const response = await this._client.service
        .platform()
        .patch(`${TEAM_MESSAGING_API_PATH}/tasks/${taskId}`, request);
      const task = (await response.json()) as TeamMessagingTask;
      this._saveTasks([task], true);
      void this._teamMessagingPersons.loadPersons(
        (task.assignees ?? []).map(({ id }) => id),
      );
      return { ok: true, id: taskId };
    } catch (error) {
      this.logger.error('update task failed', error);
      return { ok: false };
    }
  }

  /** Delete a task. Its post is removed, which posts learn from an event. */
  @delegate('server')
  async deleteTask(taskId: string): Promise<TeamMessagingResult> {
    try {
      await this._client.service
        .platform()
        .delete(`${TEAM_MESSAGING_API_PATH}/tasks/${taskId}`);
      this._removeTask(taskId);
      return { ok: true, id: taskId };
    } catch (error) {
      this.logger.error('delete task failed', error);
      return { ok: false };
    }
  }

  /**
   * Complete or reopen a task. It changes at once and is restored when the
   * request fails. For a task every assignee must complete, the user
   * completes their own part.
   */
  @delegate('server')
  async setCompleted(
    taskId: string,
    completed: boolean,
  ): Promise<TeamMessagingResult> {
    const task = this.tasksMap[taskId];
    const previousStatus = task?.status;
    this._setTaskStatus(taskId, completed ? 'Completed' : 'Pending');
    const myId = this._auth.ownerId;
    const ownPart =
      task?.completenessCondition === 'AllAssignees' && myId
        ? { assignees: [{ id: myId }] }
        : {};
    try {
      await this._client.service
        .platform()
        .post(`${TEAM_MESSAGING_API_PATH}/tasks/${taskId}/complete`, {
          status: completed ? 'Complete' : 'Incomplete',
          ...ownPart,
        });
      void this.loadTask(taskId);
      return { ok: true, id: taskId };
    } catch (error) {
      this.logger.error('complete task failed', error);
      this._setTaskStatus(taskId, previousStatus);
      return { ok: false };
    }
  }

  /** Reload one task, such as after completing it. */
  @delegate('server')
  async loadTask(taskId: string): Promise<void> {
    try {
      const response = await this._client.service
        .platform()
        .get(`${TEAM_MESSAGING_API_PATH}/tasks/${taskId}`);
      this._saveTasks([(await response.json()) as TeamMessagingTask], true);
    } catch (error) {
      this.logger.error('load task failed', error);
    }
  }

  /** List a chat's open or completed tasks, for the tasks drawer. */
  @delegate('server')
  async loadChatTasks(
    chatId: string,
    filter: TeamMessagingTaskFilter,
  ): Promise<void> {
    if (!this._appFeatures.hasGlipPermission) {
      return;
    }
    const key = getTaskListKey(chatId, filter);
    this._setLoading(key, true);
    try {
      const response = await this._client.service
        .platform()
        .get(`${TEAM_MESSAGING_API_PATH}/chats/${chatId}/tasks`, {
          status: FILTER_STATUSES[filter],
          recordCount: TASKS_PER_PAGE,
        });
      const { records = [] } = (await response.json()) as TMTaskList;
      this._saveTasks(records, true);
      this._setListedTaskIds(
        key,
        records.map(({ id }) => id).filter(Boolean) as string[],
      );
      void this._teamMessagingPersons.loadPersons(
        records.flatMap((task) => (task.assignees ?? []).map(({ id }) => id)),
      );
    } catch (error) {
      this.logger.error('load chat tasks failed', error);
      // Settle a list that never loaded, so the drawer stops loading.
      if (!this.listedTaskIds[key]) {
        this._setListedTaskIds(key, []);
      }
    } finally {
      this._setLoading(key, false);
    }
  }
}

/** The key of a chat's task list for a filter. */
export function getTaskListKey(
  chatId: string,
  filter: TeamMessagingTaskFilter,
): string {
  return `${chatId}:${filter}`;
}
