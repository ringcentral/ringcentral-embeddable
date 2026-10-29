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

// Keys stand for strings; a name shows who holds a note's lock.
jest.mock('../../src/app/views/TeamMessagingView/i18n', () => ({
  t: (key, values) => (values?.name ? `${key}:${values.name}` : key),
}));

jest.mock(
  '../../src/app/views/TeamMessagingView/components/notes/CreateNoteContent',
  () => ({ CreateNoteContent: () => null }),
);

jest.mock(
  '../../src/app/views/TeamMessagingView/components/notes/NotesDrawer',
  () => ({ NotesDrawer: () => null }),
);

const {
  TeamMessagingNotesView,
} = require('../../src/app/views/TeamMessagingView/TeamMessagingNotes.view');

function createView({
  notesMap = {},
  personsMap = {},
  lockOk = true,
  closed = true,
} = {}) {
  const notes = {
    notesMap,
    loadNote: jest.fn(async () => {}),
    lockNote: jest.fn(async (id) => (lockOk ? { ok: true, id } : { ok: false })),
    unlockNote: jest.fn(async () => {}),
    updateNote: jest.fn(async (id) => ({ ok: true, id })),
    deleteNote: jest.fn(async (id) => ({ ok: true, id })),
  };
  const posts = { removeAttachmentPosts: jest.fn(async () => {}) };
  const modalView = {
    create: jest.fn((options) => options),
    open: jest.fn(() => ({ closed: Promise.resolve(closed) })),
  };
  const toast = { danger: jest.fn(), info: jest.fn(), warning: jest.fn() };
  const view = new TeamMessagingNotesView(
    { myId: 'me' },
    notes,
    posts,
    { personsMap },
    modalView,
    toast,
  );
  return { view, notes, posts, modalView, toast };
}

function note(overrides = {}) {
  return { id: 'note-1', title: 'Plan', status: 'Active', ...overrides };
}

describe('TeamMessagingNotesView editing', () => {
  test('edits a plain note as text while holding its lock', async () => {
    const { view, notes, modalView } = createView({
      notesMap: { 'note-1': note({ body: 'line one<br />A &amp; B' }) },
    });

    await view.openEditNote('note-1');

    expect(notes.lockNote).toHaveBeenCalledWith('note-1');
    expect(view.editNote).toEqual({
      id: 'note-1',
      values: { title: 'Plan', text: 'line one\nA & B' },
    });
    expect(modalView.open).toHaveBeenCalledWith(view._editNoteModal);
    // Saving unlocks the note itself.
    expect(notes.unlockNote).not.toHaveBeenCalled();
  });

  test('unlocks a note when its dialog closes without saving', async () => {
    const { view, notes } = createView({
      notesMap: { 'note-1': note({ body: 'Text' }) },
      closed: false,
    });

    await view.openEditNote('note-1');

    expect(notes.unlockNote).toHaveBeenCalledWith('note-1');
  });

  test('loads the body of a note that has none yet', async () => {
    const notesMap = { 'note-1': note() };
    const { view, notes } = createView({ notesMap });
    notes.loadNote.mockImplementation(async () => {
      notesMap['note-1'] = note({ body: 'Loaded' });
    });

    await view.openEditNote('note-1');

    expect(notes.loadNote).toHaveBeenCalledWith('note-1');
    expect(view.editNote.values.text).toBe('Loaded');
  });

  test('reports a note that could not be loaded', async () => {
    const { view, notes, toast } = createView({ notesMap: {} });

    await view.openEditNote('note-1');

    expect(toast.danger).toHaveBeenCalledWith({
      message: 'updateNoteFailed',
    });
    expect(notes.lockNote).not.toHaveBeenCalled();
  });

  test('sends a note with formatting to the RingCentral app', async () => {
    const { view, notes, toast, modalView } = createView({
      notesMap: { 'note-1': note({ body: '<b>Bold</b> text' }) },
    });

    await view.openEditNote('note-1');

    expect(toast.info).toHaveBeenCalledWith({
      message: 'editNoteInApp',
    });
    expect(notes.lockNote).not.toHaveBeenCalled();
    expect(modalView.open).not.toHaveBeenCalled();
  });

  test('tells who is editing a note someone else locked', async () => {
    const { view, notes, toast } = createView({
      notesMap: {
        'note-1': note({ body: 'Text', lockedBy: { id: 'person-2' } }),
      },
      personsMap: { 'person-2': { id: 'person-2', firstName: 'Da', lastName: 'Kong' } },
    });

    await view.openEditNote('note-1');

    expect(toast.warning).toHaveBeenCalledWith({
      message: 'noteLockedBy:Da Kong',
    });
    expect(notes.lockNote).not.toHaveBeenCalled();
  });

  test('edits a note the user locked before', async () => {
    const { view, notes } = createView({
      notesMap: { 'note-1': note({ body: 'Text', lockedBy: { id: 'me' } }) },
    });

    await view.openEditNote('note-1');

    expect(notes.lockNote).toHaveBeenCalledWith('note-1');
  });

  test('tells who took the lock when locking fails', async () => {
    const notesMap = { 'note-1': note({ body: 'Text' }) };
    const { view, notes, toast, modalView } = createView({
      notesMap,
      lockOk: false,
      personsMap: { 'person-2': { id: 'person-2', firstName: 'Da' } },
    });
    notes.lockNote.mockImplementation(async () => {
      notesMap['note-1'] = note({ body: 'Text', lockedBy: { id: 'person-2' } });
      return { ok: false };
    });

    await view.openEditNote('note-1');

    expect(toast.warning).toHaveBeenCalledWith({
      message: 'noteLockedBy:Da',
    });
    expect(modalView.open).not.toHaveBeenCalled();
  });

  test('reports a lock that failed for another reason', async () => {
    const { view, toast, modalView } = createView({
      notesMap: { 'note-1': note({ body: 'Text' }) },
      lockOk: false,
    });

    await view.openEditNote('note-1');

    expect(toast.warning).toHaveBeenCalledWith({
      message: 'updateNoteFailed',
    });
    expect(modalView.open).not.toHaveBeenCalled();
  });

  test('saves the typed text as a note body', async () => {
    const { view, notes, toast } = createView();

    await expect(
      view.updateNote('note-1', { title: 'Plan', text: 'A & B\n<tag>' }),
    ).resolves.toEqual({ ok: true, id: 'note-1' });

    expect(notes.updateNote).toHaveBeenCalledWith('note-1', {
      title: 'Plan',
      body: 'A &amp; B<br>&lt;tag&gt;',
    });
    expect(toast.danger).not.toHaveBeenCalled();
  });

  test('reports a note that could not be saved', async () => {
    const { view, notes, toast } = createView();
    notes.updateNote.mockResolvedValue({ ok: false });

    await expect(
      view.updateNote('note-1', { title: 'Plan', text: 'Text' }),
    ).resolves.toEqual({ ok: false });

    expect(toast.danger).toHaveBeenCalledWith({
      message: 'updateNoteFailed',
    });
  });
});

describe('TeamMessagingNotesView deleting', () => {
  test('deletes a note once confirmed and removes its post', async () => {
    const { view, notes, posts, modalView } = createView();
    const onDeleted = jest.fn();

    await view.confirmDeleteNote('note-1', onDeleted);

    expect(modalView.open).toHaveBeenCalledWith(view._deleteNoteModal);
    expect(notes.deleteNote).toHaveBeenCalledWith('note-1');
    expect(posts.removeAttachmentPosts).toHaveBeenCalledWith('note-1');
    expect(onDeleted).toHaveBeenCalled();
  });

  test('keeps a note when deleting is canceled', async () => {
    const { view, notes } = createView({ closed: false });
    const onDeleted = jest.fn();

    await view.confirmDeleteNote('note-1', onDeleted);

    expect(notes.deleteNote).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  test('stays on a note that could not be deleted', async () => {
    const { view, notes, posts, toast } = createView();
    notes.deleteNote.mockResolvedValue({ ok: false });
    const onDeleted = jest.fn();

    await view.confirmDeleteNote('note-1', onDeleted);

    expect(toast.danger).toHaveBeenCalledWith({
      message: 'deleteNoteFailed',
    });
    expect(posts.removeAttachmentPosts).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  test('offers edit and delete in the note header menu', () => {
    const { view } = createView();
    const openEditNote = jest
      .spyOn(view, 'openEditNote')
      .mockResolvedValue(undefined);
    const confirmDeleteNote = jest
      .spyOn(view, 'confirmDeleteNote')
      .mockResolvedValue(undefined);
    const onDeleted = jest.fn();

    const actions = view.getNoteMenuActions('note-1', onDeleted);
    expect(actions.map(({ key, label }) => [key, label])).toEqual([
      ['edit', 'edit'],
      ['delete', 'delete'],
    ]);

    actions[0].onClick();
    actions[1].onClick();
    expect(openEditNote).toHaveBeenCalledWith('note-1');
    expect(confirmDeleteNote).toHaveBeenCalledWith('note-1', onDeleted);
  });
});
