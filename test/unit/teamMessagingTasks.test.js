import { TeamMessagingTasks } from '../../src/app/services/TeamMessaging/TeamMessagingTasks';

const API = '/team-messaging/v1';

function jsonResponse(body) {
  return { json: jest.fn(async () => body) };
}

function createTasks({ ownerId = 'me' } = {}) {
  const platform = {
    get: jest.fn(),
    post: jest.fn(async () => jsonResponse({})),
    patch: jest.fn(),
    delete: jest.fn(async () => ({})),
  };
  const persons = { loadPersons: jest.fn(async () => {}) };
  const service = new TeamMessagingTasks(
    { ownerId },
    { service: { platform: () => platform } },
    { hasGlipPermission: true },
    persons,
  );
  return { service, platform, persons };
}

function task(overrides = {}) {
  return {
    id: 'task-1',
    subject: 'Ship it',
    status: 'Pending',
    chatIds: ['chat-1'],
    lastModifiedTime: '2026-10-29T05:00:00Z',
    ...overrides,
  };
}

describe('TeamMessagingTasks', () => {
  test('keeps the newer copy when posts carry an older task', () => {
    const { service, persons } = createTasks();
    service.tasksMap['task-1'] = task({
      subject: 'Edited',
      lastModifiedTime: '2026-10-29T06:00:00Z',
    });

    service.saveFromPosts([
      { id: 'post-1', attachments: [{ type: 'Task', ...task() }] },
    ]);

    expect(service.tasksMap['task-1'].subject).toBe('Edited');
    expect(persons.loadPersons).toHaveBeenCalled();
  });

  test('updates a task and keeps the returned copy', async () => {
    const { service, platform, persons } = createTasks();
    service.tasksMap['task-1'] = task({
      lastModifiedTime: '2026-10-29T07:00:00Z',
    });
    const updated = task({
      subject: 'Ship it today',
      assignees: [{ id: 'person-1' }],
      lastModifiedTime: '2026-10-29T06:00:00Z',
    });
    platform.patch.mockResolvedValue(jsonResponse(updated));
    const request = { subject: 'Ship it today', assignees: [{ id: 'person-1' }] };

    await expect(service.updateTask('task-1', request)).resolves.toEqual({
      ok: true,
      id: 'task-1',
    });

    expect(platform.patch).toHaveBeenCalledWith(`${API}/tasks/task-1`, request);
    // The server's copy wins even when its time is not newer.
    expect(service.tasksMap['task-1']).toEqual(updated);
    expect(persons.loadPersons).toHaveBeenCalledWith(['person-1']);
  });

  test('reports a failed update and keeps the task', async () => {
    const { service, platform } = createTasks();
    service.tasksMap['task-1'] = task();
    platform.patch.mockRejectedValue(new Error('403'));

    await expect(
      service.updateTask('task-1', { subject: 'Nope' }),
    ).resolves.toEqual({ ok: false });

    expect(service.tasksMap['task-1'].subject).toBe('Ship it');
    expect(service.logger.error).toHaveBeenCalled();
  });

  test('deletes a task and drops it from every list', async () => {
    const { service, platform } = createTasks();
    service.tasksMap = { 'task-1': task(), 'task-2': task({ id: 'task-2' }) };
    service.listedTaskIds = {
      'chat-1:Open': ['task-1', 'task-2'],
      'chat-1:Completed': ['task-1'],
    };

    await expect(service.deleteTask('task-1')).resolves.toEqual({
      ok: true,
      id: 'task-1',
    });

    expect(platform.delete).toHaveBeenCalledWith(`${API}/tasks/task-1`);
    expect(Object.keys(service.tasksMap)).toEqual(['task-2']);
    expect(service.listedTaskIds).toEqual({
      'chat-1:Open': ['task-2'],
      'chat-1:Completed': [],
    });
  });

  test('keeps a task whose deletion failed', async () => {
    const { service, platform } = createTasks();
    service.tasksMap = { 'task-1': task() };
    service.listedTaskIds = { 'chat-1:Open': ['task-1'] };
    platform.delete.mockRejectedValue(new Error('403'));

    await expect(service.deleteTask('task-1')).resolves.toEqual({ ok: false });

    expect(service.tasksMap['task-1']).toBeDefined();
    expect(service.listedTaskIds['chat-1:Open']).toEqual(['task-1']);
  });

  test('completes a task at once and reloads it', async () => {
    const { service, platform } = createTasks();
    service.tasksMap['task-1'] = task();
    platform.get.mockResolvedValue(jsonResponse(task({ status: 'Completed' })));

    const pending = service.setCompleted('task-1', true);
    expect(service.tasksMap['task-1'].status).toBe('Completed');

    await expect(pending).resolves.toEqual({ ok: true, id: 'task-1' });
    expect(platform.post).toHaveBeenCalledWith(
      `${API}/tasks/task-1/complete`,
      { status: 'Complete' },
    );
    expect(platform.get).toHaveBeenCalledWith(`${API}/tasks/task-1`);
  });

  test('completes only my part of a task every assignee completes', async () => {
    const { service, platform } = createTasks({ ownerId: 'me' });
    service.tasksMap['task-1'] = task({ completenessCondition: 'AllAssignees' });
    platform.get.mockResolvedValue(jsonResponse(task()));

    await service.setCompleted('task-1', true);

    expect(platform.post).toHaveBeenCalledWith(
      `${API}/tasks/task-1/complete`,
      { status: 'Complete', assignees: [{ id: 'me' }] },
    );
  });

  test('restores the status when reopening fails', async () => {
    const { service, platform } = createTasks();
    service.tasksMap['task-1'] = task({ status: 'Completed' });
    platform.post.mockRejectedValue(new Error('failed'));

    await expect(service.setCompleted('task-1', false)).resolves.toEqual({
      ok: false,
    });

    expect(platform.post).toHaveBeenCalledWith(
      `${API}/tasks/task-1/complete`,
      { status: 'Incomplete' },
    );
    expect(service.tasksMap['task-1'].status).toBe('Completed');
  });

  test('lists a chat filter and settles an unloaded list on failure', async () => {
    const { service, platform } = createTasks();
    platform.get.mockResolvedValueOnce(
      jsonResponse({ records: [task(), task({ id: 'task-2' })] }),
    );

    await service.loadChatTasks('chat-1', 'Open');

    expect(platform.get).toHaveBeenCalledWith(`${API}/chats/chat-1/tasks`, {
      status: ['Pending', 'InProgress'],
      recordCount: 100,
    });
    expect(service.listedTaskIds['chat-1:Open']).toEqual(['task-1', 'task-2']);
    expect(service.loadingLists['chat-1:Open']).toBe(false);

    platform.get.mockRejectedValueOnce(new Error('rate limited'));
    await service.loadChatTasks('chat-1', 'Completed');

    expect(service.listedTaskIds['chat-1:Completed']).toEqual([]);
    expect(service.loadingLists['chat-1:Completed']).toBe(false);
  });
});
