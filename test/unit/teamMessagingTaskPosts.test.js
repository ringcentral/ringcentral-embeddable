import {
  getPostTask,
  getTaskActivity,
  getTaskAttachments,
} from '../../src/app/services/TeamMessaging/taskPosts';

const TASK_TIME = '2026-01-01T00:00:00.000Z';
const SOON = '2026-01-01T00:00:05.000Z';
const LATER = '2026-01-01T00:00:05.001Z';

const task = {
  id: 'task-1',
  type: 'Task',
  subject: 'Write tests',
  status: 'Completed',
  creationTime: TASK_TIME,
};

describe('getTaskAttachments', () => {
  test('collects task attachments with an id from all posts', () => {
    expect(
      getTaskAttachments([
        { attachments: [task, { type: 'File', id: 'f' }, { type: 'Task' }] },
        {},
        { attachments: [{ ...task, id: 'task-2' }] },
      ]),
    ).toEqual([task, { ...task, id: 'task-2' }]);
    expect(getTaskAttachments([])).toEqual([]);
  });
});

describe('getTaskActivity', () => {
  test('a task posted with its task is not an activity', () => {
    expect(getTaskActivity({ creationTime: TASK_TIME, attachments: [task] })).toBeUndefined();
    expect(getTaskActivity({ creationTime: SOON, attachments: [task] })).toBeUndefined();
  });

  test('a task posted more than 5 seconds after the task is an activity', () => {
    expect(getTaskActivity({ creationTime: LATER, attachments: [task] })).toEqual({
      taskId: 'task-1',
      subject: 'Write tests',
      status: 'Completed',
    });
  });

  test('a fetched activity is a post with only a task mention', () => {
    expect(
      getTaskActivity({
        mentions: [
          { type: 'Person', id: 'p', name: 'Ada' },
          { type: 'Task', id: 'task-1', name: 'Write tests' },
        ],
      }),
    ).toEqual({ taskId: 'task-1', subject: 'Write tests' });
  });

  test('a post with text, other attachments, or no task mention is not an activity', () => {
    const mentions = [{ type: 'Task', id: 'task-1', name: 'Write tests' }];
    expect(getTaskActivity({ text: 'hi', mentions })).toBeUndefined();
    expect(
      getTaskActivity({ attachments: [{ type: 'File', id: 'f' }], mentions }),
    ).toBeUndefined();
    expect(getTaskActivity({ mentions: [{ type: 'Task', name: 'No id' }] })).toBeUndefined();
    expect(getTaskActivity({})).toBeUndefined();
  });
});

describe('getPostTask', () => {
  test('returns the task of a post that created it', () => {
    expect(getPostTask({ creationTime: TASK_TIME, attachments: [task] })).toBe(task);
  });

  test('returns nothing for an activity post or a post without a task', () => {
    expect(getPostTask({ creationTime: LATER, attachments: [task] })).toBeUndefined();
    expect(getPostTask({ text: 'hi' })).toBeUndefined();
  });
});
