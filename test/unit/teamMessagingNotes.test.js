import { TeamMessagingNotes } from '../../src/app/services/TeamMessaging/TeamMessagingNotes';

const API = '/team-messaging/v1';

function jsonResponse(body) {
  return { json: jest.fn(async () => body) };
}

function createNotes() {
  const platform = {
    get: jest.fn(),
    post: jest.fn(async () => jsonResponse({})),
    patch: jest.fn(),
    delete: jest.fn(async () => ({})),
  };
  const persons = { loadPersons: jest.fn(async () => {}) };
  const service = new TeamMessagingNotes(
    { service: { platform: () => platform } },
    { hasGlipPermission: true },
    persons,
  );
  return { service, platform, persons };
}

function note(overrides = {}) {
  return {
    id: 'note-1',
    title: 'Plan',
    status: 'Active',
    chatIds: ['chat-1'],
    creator: { id: 'person-1' },
    lastModifiedTime: '2026-10-29T05:00:00Z',
    ...overrides,
  };
}

describe('TeamMessagingNotes', () => {
  test('keeps a loaded body when a post carries the note without it', () => {
    const { service } = createNotes();
    service.notesMap['note-1'] = note({ body: 'Body' });

    service.saveFromPosts([
      {
        id: 'post-1',
        attachments: [
          { type: 'Note', ...note({ lastModifiedTime: '2026-10-29T06:00:00Z' }) },
        ],
      },
    ]);

    expect(service.notesMap['note-1']).toEqual(
      expect.objectContaining({ body: 'Body', lastModifiedTime: '2026-10-29T06:00:00Z' }),
    );
  });

  test('creates a note and publishes it', async () => {
    const { service, platform } = createNotes();
    platform.post
      .mockResolvedValueOnce(jsonResponse(note({ status: 'Draft' })))
      .mockResolvedValueOnce(jsonResponse(undefined));

    await expect(
      service.createNote('chat-1', { title: 'Plan', body: 'Body' }),
    ).resolves.toEqual({ ok: true, id: 'note-1' });

    expect(platform.post).toHaveBeenNthCalledWith(1, `${API}/chats/chat-1/notes`, {
      title: 'Plan',
      body: 'Body',
    });
    expect(platform.post).toHaveBeenNthCalledWith(2, `${API}/notes/note-1/publish`);
    expect(service.notesMap['note-1']).toEqual(
      expect.objectContaining({ body: 'Body', status: 'Active' }),
    );
  });

  test('locks a note for editing', async () => {
    const { service, platform } = createNotes();

    await expect(service.lockNote('note-1')).resolves.toEqual({
      ok: true,
      id: 'note-1',
    });

    expect(platform.post).toHaveBeenCalledWith(`${API}/notes/note-1/lock`);
    expect(platform.get).not.toHaveBeenCalled();
  });

  test('reloads a note it could not lock, to tell who holds the lock', async () => {
    const { service, platform } = createNotes();
    platform.post.mockRejectedValue(new Error('locked'));
    platform.get.mockResolvedValue(
      jsonResponse(note({ lockedBy: { id: 'person-2' }, body: 'Body' })),
    );

    await expect(service.lockNote('note-1')).resolves.toEqual({ ok: false });

    expect(platform.get).toHaveBeenCalledWith(`${API}/notes/note-1`);
    expect(service.notesMap['note-1'].lockedBy).toEqual({ id: 'person-2' });
  });

  test('saves a note and unlocks it', async () => {
    const { service, platform } = createNotes();
    service.notesMap['note-1'] = note({ body: 'Old', lockedBy: { id: 'me' } });
    platform.patch.mockResolvedValue(
      jsonResponse(
        note({
          title: 'New plan',
          lockedBy: { id: 'me' },
          lastModifiedTime: '2026-10-29T06:00:00Z',
        }),
      ),
    );

    await expect(
      service.updateNote('note-1', { title: 'New plan', body: 'New' }),
    ).resolves.toEqual({ ok: true, id: 'note-1' });

    expect(platform.patch).toHaveBeenCalledWith(`${API}/notes/note-1`, {
      title: 'New plan',
      body: 'New',
    });
    // Saving keeps the lock, so the note is unlocked on its own request.
    expect(platform.post).toHaveBeenCalledWith(`${API}/notes/note-1/unlock`);
    expect(service.notesMap['note-1']).toEqual(
      expect.objectContaining({ title: 'New plan', body: 'New', lockedBy: undefined }),
    );
  });

  test('reports a failed save and keeps the note', async () => {
    const { service, platform } = createNotes();
    service.notesMap['note-1'] = note({ body: 'Old' });
    platform.patch.mockRejectedValue(new Error('403'));

    await expect(
      service.updateNote('note-1', { title: 'New plan', body: 'New' }),
    ).resolves.toEqual({ ok: false });

    expect(service.notesMap['note-1'].body).toBe('Old');
    expect(platform.post).not.toHaveBeenCalled();
  });

  test('unlocks a note and logs a failed unlock', async () => {
    const { service, platform } = createNotes();

    await service.unlockNote('note-1');
    expect(platform.post).toHaveBeenCalledWith(`${API}/notes/note-1/unlock`);

    platform.post.mockRejectedValueOnce(new Error('gone'));
    await expect(service.unlockNote('note-1')).resolves.toBeUndefined();
    expect(service.logger.error).toHaveBeenCalled();
  });

  test('deletes a note and drops it from every list', async () => {
    const { service, platform } = createNotes();
    service.notesMap = { 'note-1': note(), 'note-2': note({ id: 'note-2' }) };
    service.listedNoteIds = { 'chat-1': ['note-1', 'note-2'] };

    await expect(service.deleteNote('note-1')).resolves.toEqual({
      ok: true,
      id: 'note-1',
    });

    expect(platform.delete).toHaveBeenCalledWith(`${API}/notes/note-1`);
    expect(Object.keys(service.notesMap)).toEqual(['note-2']);
    expect(service.listedNoteIds['chat-1']).toEqual(['note-2']);
  });

  test('keeps a note whose deletion failed', async () => {
    const { service, platform } = createNotes();
    service.notesMap = { 'note-1': note() };
    platform.delete.mockRejectedValue(new Error('403'));

    await expect(service.deleteNote('note-1')).resolves.toEqual({ ok: false });

    expect(service.notesMap['note-1']).toBeDefined();
  });

  test('lists active notes and settles an unloaded list on failure', async () => {
    const { service, platform, persons } = createNotes();
    platform.get.mockResolvedValueOnce(jsonResponse({ records: [note()] }));

    await service.loadChatNotes('chat-1');

    expect(platform.get).toHaveBeenCalledWith(`${API}/chats/chat-1/notes`, {
      status: 'Active',
      recordCount: 100,
    });
    expect(service.listedNoteIds['chat-1']).toEqual(['note-1']);
    expect(persons.loadPersons).toHaveBeenCalledWith(['person-1']);

    platform.get.mockRejectedValueOnce(new Error('rate limited'));
    await service.loadChatNotes('chat-2');

    expect(service.listedNoteIds['chat-2']).toEqual([]);
    expect(service.loadingChatIds['chat-2']).toBe(false);
  });
});
