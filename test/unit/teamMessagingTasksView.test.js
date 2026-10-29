jest.mock('../../src/app/services/TeamMessaging', () => {
  // The barrel's data fetchers need modules the test mocks lack.
  const items = jest.requireActual(
    '../../src/app/services/TeamMessaging/getChatItems',
  );
  return {
    getMember: items.getMember,
    getPersonName: items.getPersonName,
    getTaskListKey: (chatId, filter) => `${chatId}:${filter}`,
    TeamMessagingChats: class TeamMessagingChats {},
    TeamMessagingNotes: class TeamMessagingNotes {},
    TeamMessagingPersons: class TeamMessagingPersons {},
    TeamMessagingPosts: class TeamMessagingPosts {},
    TeamMessagingTasks: class TeamMessagingTasks {},
  };
});

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {},
  useModalItemView: () => ({}),
}));

jest.mock(
  '../../src/app/views/TeamMessagingView/components/tasks/CreateTaskContent',
  () => ({ CreateTaskContent: () => null }),
);

jest.mock(
  '../../src/app/views/TeamMessagingView/components/tasks/TasksDrawer',
  () => ({ TasksDrawer: () => null }),
);

const {
  TeamMessagingTasksView,
} = require('../../src/app/views/TeamMessagingView/TeamMessagingTasks.view');

function createView({ tasksMap = {}, personsMap = {}, closed = true } = {}) {
  const tasks = {
    tasksMap,
    updateTask: jest.fn(async (id) => ({ ok: true, id })),
    deleteTask: jest.fn(async (id) => ({ ok: true, id })),
    setCompleted: jest.fn(async (id) => ({ ok: true, id })),
  };
  const posts = {
    fetchPosts: jest.fn(async () => {}),
    removeAttachmentPosts: jest.fn(async () => {}),
  };
  const modalView = {
    create: jest.fn((options) => options),
    open: jest.fn(() => ({ closed: Promise.resolve(closed) })),
  };
  const toast = { danger: jest.fn() };
  const view = new TeamMessagingTasksView(
    { myId: 'me', getChatItem: jest.fn() },
    tasks,
    posts,
    { personsMap },
    modalView,
    toast,
  );
  return { view, tasks, posts, modalView, toast };
}

describe('TeamMessagingTasksView editing', () => {
  test('opens the edit dialog on a task', () => {
    const { view, modalView } = createView();

    view.openEditTask('task-1');

    expect(view.editTaskId).toBe('task-1');
    expect(modalView.open).toHaveBeenCalledWith(view._editTaskModal);
  });

  test('fills the edit form from a task', () => {
    const { view } = createView({
      personsMap: {
        'person-1': {
          id: 'person-1',
          firstName: 'Da',
          lastName: 'Kong',
          email: 'da@example.com',
          avatar: 'https://avatar',
        },
      },
    });

    expect(
      view._getFormValues({
        id: 'task-1',
        subject: 'Ship it',
        assignees: [{ id: 'person-1' }],
        dueDate: '2026-10-31T17:00:00.000Z',
        description: 'Before Friday',
      }),
    ).toEqual({
      subject: 'Ship it',
      assignees: [
        {
          id: 'person-1',
          name: 'Da Kong',
          email: 'da@example.com',
          avatarUrl: 'https://avatar',
        },
      ],
      dueDate: new Date('2026-10-31T17:00:00.000Z'),
      description: 'Before Friday',
    });
    expect(view._getFormValues({ id: 'task-2' })).toEqual({
      subject: '',
      assignees: [],
      dueDate: undefined,
      description: '',
    });
    expect(view._getFormValues(undefined)).toBeUndefined();
  });

  test('saves the form as the task', async () => {
    const { view, tasks, toast } = createView();
    const dueDate = new Date('2026-10-31T17:00:00.000Z');

    await expect(
      view.updateTask('task-1', {
        subject: 'Ship it',
        assigneeIds: ['person-1'],
        dueDate,
        description: '',
      }),
    ).resolves.toEqual({ ok: true, id: 'task-1' });

    expect(tasks.updateTask).toHaveBeenCalledWith('task-1', {
      subject: 'Ship it',
      assignees: [{ id: 'person-1' }],
      dueDate: '2026-10-31T17:00:00.000Z',
      description: '',
    });
    expect(toast.danger).not.toHaveBeenCalled();
  });

  test('saves a task without a due date and reports a failure', async () => {
    const { view, tasks, toast } = createView();
    tasks.updateTask.mockResolvedValue({ ok: false });

    await expect(
      view.updateTask('task-1', {
        subject: 'Ship it',
        assigneeIds: [],
        description: 'Notes',
      }),
    ).resolves.toEqual({ ok: false });

    expect(tasks.updateTask).toHaveBeenCalledWith('task-1', {
      subject: 'Ship it',
      assignees: [],
      description: 'Notes',
    });
    expect(toast.danger).toHaveBeenCalledWith({
      message: 'updateTaskFailed',
    });
  });
});

describe('TeamMessagingTasksView deleting', () => {
  test('deletes a task once confirmed and removes its post', async () => {
    const { view, tasks, posts, modalView } = createView();
    const onDeleted = jest.fn();

    await view.confirmDeleteTask('task-1', onDeleted);

    expect(modalView.open).toHaveBeenCalledWith(view._deleteTaskModal);
    expect(tasks.deleteTask).toHaveBeenCalledWith('task-1');
    expect(posts.removeAttachmentPosts).toHaveBeenCalledWith('task-1');
    expect(onDeleted).toHaveBeenCalled();
  });

  test('keeps a task when deleting is canceled', async () => {
    const { view, tasks } = createView({ closed: null });
    const onDeleted = jest.fn();

    await view.confirmDeleteTask('task-1', onDeleted);

    expect(tasks.deleteTask).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  test('stays on a task that could not be deleted', async () => {
    const { view, tasks, posts, toast } = createView();
    tasks.deleteTask.mockResolvedValue({ ok: false });
    const onDeleted = jest.fn();

    await view.confirmDeleteTask('task-1', onDeleted);

    expect(toast.danger).toHaveBeenCalledWith({
      message: 'deleteTaskFailed',
    });
    expect(posts.removeAttachmentPosts).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  test('asks with a danger button before deleting', () => {
    const { view } = createView();

    expect(view._deleteTaskModal.props()).toEqual(
      expect.objectContaining({
        header: 'deleteTask',
        content: 'deleteTaskConfirm',
        confirmButtonText: 'delete',
        confirmButtonProps: { color: 'danger' },
      }),
    );
  });

  test('offers edit and delete in the task header menu', () => {
    const { view } = createView();
    const openEditTask = jest.spyOn(view, 'openEditTask');
    const confirmDeleteTask = jest
      .spyOn(view, 'confirmDeleteTask')
      .mockResolvedValue(undefined);
    const onDeleted = jest.fn();

    const actions = view.getTaskMenuActions('task-1', onDeleted);
    expect(actions.map(({ key, label }) => [key, label])).toEqual([
      ['edit', 'edit'],
      ['delete', 'delete'],
    ]);

    actions[0].onClick();
    actions[1].onClick();
    expect(openEditTask).toHaveBeenCalledWith('task-1');
    expect(confirmDeleteTask).toHaveBeenCalledWith('task-1', onDeleted);
  });
});
