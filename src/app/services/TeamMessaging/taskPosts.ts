import type {
  TeamMessagingPost,
  TeamMessagingTask,
} from './TeamMessaging.interface';

const TASK_TYPE = 'Task';

/**
 * A task attachment posted after its task was created is an activity, such
 * as completing it, not the task post itself.
 */
const ACTIVITY_DELAY_MS = 5000;

/** What a task activity post did, when its post says so. */
export interface TaskActivity {
  taskId: string;
  subject?: string;
  /** Known only for an activity that came as an event. */
  status?: TeamMessagingTask['status'];
}

function getTime(value?: string): number {
  return value ? new Date(value).getTime() : 0;
}

function isTaskAttachment(
  attachment: NonNullable<TeamMessagingPost['attachments']>[number],
): boolean {
  return attachment.type === TASK_TYPE && !!attachment.id;
}

/** The tasks attached to posts, with all their details. */
export function getTaskAttachments(
  posts: readonly TeamMessagingPost[],
): TeamMessagingTask[] {
  return posts.flatMap((post) =>
    (post.attachments ?? []).filter(isTaskAttachment),
  ) as unknown as TeamMessagingTask[];
}

/** The task of a post that created a task. */
export function getPostTask(
  post: TeamMessagingPost,
): TeamMessagingTask | undefined {
  if (getTaskActivity(post)) {
    return undefined;
  }
  return getTaskAttachments([post])[0];
}

/**
 * The task activity of a post, such as "completed the task". A fetched
 * activity post has no text or attachments, only a mention of the task; the
 * same post as an event carries the task as it is now.
 */
export function getTaskActivity(
  post: TeamMessagingPost,
): TaskActivity | undefined {
  const task = getTaskAttachments([post])[0];
  if (task) {
    const isLater =
      getTime(post.creationTime) - getTime(task.creationTime) >
      ACTIVITY_DELAY_MS;
    return isLater
      ? { taskId: task.id!, subject: task.subject, status: task.status }
      : undefined;
  }
  if (post.text || post.attachments?.length) {
    return undefined;
  }
  const mention = post.mentions?.find(({ type }) => type === TASK_TYPE);
  return mention?.id
    ? { taskId: mention.id, subject: mention.name }
    : undefined;
}
