import type TMNoteList from '@rc-ex/core/lib/definitions/TMNoteList';
import {
  AppFeatures,
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
  TeamMessagingNote,
  TeamMessagingPost,
  TeamMessagingResult,
} from './TeamMessaging.interface';
import { TeamMessagingPersons } from './TeamMessagingPersons';

/** Notes listed in the notes drawer. */
const NOTES_PER_PAGE = 100;

const NOTE_TYPE = 'Note';

function getNoteTime(note?: TeamMessagingNote): number {
  return note?.lastModifiedTime ? new Date(note.lastModifiedTime).getTime() : 0;
}

/** The notes attached to posts. A note post carries no body. */
export function getNoteAttachments(
  posts: readonly TeamMessagingPost[],
): TeamMessagingNote[] {
  return posts.flatMap((post) =>
    (post.attachments ?? []).filter(
      (attachment) => attachment.type === NOTE_TYPE && !!attachment.id,
    ),
  ) as unknown as TeamMessagingNote[];
}

/**
 * Notes by id, kept in memory. A published note posts its title and preview;
 * the body is loaded when the note opens. Editing a note sends no event, so
 * notes refresh when posts load and when a note opens. Editing locks the
 * note, so two people never edit it at once.
 */
@injectable({
  name: 'TeamMessagingNotes',
})
export class TeamMessagingNotes extends RcModule {
  constructor(
    protected _client: Client,
    protected _appFeatures: AppFeatures,
    protected _teamMessagingPersons: TeamMessagingPersons,
  ) {
    super();
  }

  @state
  notesMap: Record<string, TeamMessagingNote> = {};

  /** Published note ids of each chat, as the notes drawer last listed them. */
  @state
  listedNoteIds: Record<string, string[]> = {};

  @state
  loadingChatIds: Record<string, boolean> = {};

  @action
  private _saveNotes(notes: TeamMessagingNote[]): void {
    notes.forEach((note) => {
      if (!note.id) {
        return;
      }
      const existing = this.notesMap[note.id];
      if (getNoteTime(note) >= getNoteTime(existing)) {
        // A listed or posted note has no body; keep a loaded one.
        this.notesMap[note.id] = {
          ...note,
          body: note.body ?? existing?.body,
        };
      }
    });
  }

  @action
  private _removeNote(noteId: string): void {
    delete this.notesMap[noteId];
    Object.keys(this.listedNoteIds).forEach((chatId) => {
      this.listedNoteIds[chatId] = this.listedNoteIds[chatId].filter(
        (id) => id !== noteId,
      );
    });
  }

  @action
  private _setListedNoteIds(chatId: string, ids: string[]): void {
    this.listedNoteIds[chatId] = ids;
  }

  @action
  private _setLoading(chatId: string, loading: boolean): void {
    this.loadingChatIds[chatId] = loading;
  }

  @action
  private _reset(): void {
    this.notesMap = {};
    this.listedNoteIds = {};
    this.loadingChatIds = {};
  }

  override onReset(): void {
    this._reset();
  }

  private _loadAuthors(notes: TeamMessagingNote[]): void {
    void this._teamMessagingPersons.loadPersons(
      notes.flatMap((note) =>
        [note.creator?.id, note.lastModifiedBy?.id].filter(Boolean),
      ) as string[],
    );
  }

  /** Keep the notes that posts carry, unless a newer copy is known. */
  saveFromPosts(posts: readonly TeamMessagingPost[]): void {
    const notes = getNoteAttachments(posts);
    if (notes.length > 0) {
      this._saveNotes(notes);
      this._loadAuthors(notes);
    }
  }

  /**
   * Create a note and publish it, which posts it to the chat. A new note is a
   * draft that only its author sees.
   */
  @delegate('server')
  async createNote(
    chatId: string,
    { title, body }: { title: string; body: string },
  ): Promise<TeamMessagingResult> {
    try {
      const platform = this._client.service.platform();
      const response = await platform.post(
        `${TEAM_MESSAGING_API_PATH}/chats/${chatId}/notes`,
        { title, body },
      );
      const note = (await response.json()) as TeamMessagingNote;
      // Publishing answers with an empty body, unlike its spec.
      await platform.post(`${TEAM_MESSAGING_API_PATH}/notes/${note.id}/publish`);
      this._saveNotes([{ ...note, body, status: 'Active' }]);
      return { ok: true, id: note.id };
    } catch (error) {
      this.logger.error('create note failed', error);
      return { ok: false };
    }
  }

  /**
   * Lock a note for editing, so no one else edits it meanwhile. When the lock
   * fails, the note reloads to tell who holds it.
   */
  @delegate('server')
  async lockNote(noteId: string): Promise<TeamMessagingResult> {
    try {
      await this._client.service
        .platform()
        .post(`${TEAM_MESSAGING_API_PATH}/notes/${noteId}/lock`);
      return { ok: true, id: noteId };
    } catch (error) {
      this.logger.error('lock note failed', error);
      await this.loadNote(noteId);
      return { ok: false };
    }
  }

  @delegate('server')
  async unlockNote(noteId: string): Promise<void> {
    try {
      await this._client.service
        .platform()
        .post(`${TEAM_MESSAGING_API_PATH}/notes/${noteId}/unlock`);
    } catch (error) {
      this.logger.error('unlock note failed', error);
    }
  }

  /**
   * Save a locked note and unlock it. Saving keeps the lock even when asked
   * to release it, so the note unlocks on its own request.
   */
  @delegate('server')
  async updateNote(
    noteId: string,
    { title, body }: { title: string; body: string },
  ): Promise<TeamMessagingResult> {
    try {
      const response = await this._client.service
        .platform()
        .patch(`${TEAM_MESSAGING_API_PATH}/notes/${noteId}`, { title, body });
      const note = (await response.json()) as TeamMessagingNote;
      await this.unlockNote(noteId);
      this._saveNotes([{ ...note, body, lockedBy: undefined }]);
      return { ok: true, id: noteId };
    } catch (error) {
      this.logger.error('update note failed', error);
      return { ok: false };
    }
  }

  /** Delete a note. Its post is removed, which posts learn from an event. */
  @delegate('server')
  async deleteNote(noteId: string): Promise<TeamMessagingResult> {
    try {
      await this._client.service
        .platform()
        .delete(`${TEAM_MESSAGING_API_PATH}/notes/${noteId}`);
      this._removeNote(noteId);
      return { ok: true, id: noteId };
    } catch (error) {
      this.logger.error('delete note failed', error);
      return { ok: false };
    }
  }

  /** Load a note with its body. */
  @delegate('server')
  async loadNote(noteId: string): Promise<void> {
    try {
      const response = await this._client.service
        .platform()
        .get(`${TEAM_MESSAGING_API_PATH}/notes/${noteId}`);
      const note = (await response.json()) as TeamMessagingNote;
      this._saveNotes([note]);
      this._loadAuthors([note]);
    } catch (error) {
      this.logger.error('load note failed', error);
    }
  }

  /** List a chat's published notes, for the notes drawer. */
  @delegate('server')
  async loadChatNotes(chatId: string): Promise<void> {
    if (!this._appFeatures.hasGlipPermission) {
      return;
    }
    this._setLoading(chatId, true);
    try {
      const response = await this._client.service
        .platform()
        .get(`${TEAM_MESSAGING_API_PATH}/chats/${chatId}/notes`, {
          status: 'Active',
          recordCount: NOTES_PER_PAGE,
        });
      const { records = [] } = (await response.json()) as TMNoteList;
      const notes = records as TeamMessagingNote[];
      this._saveNotes(notes);
      this._setListedNoteIds(
        chatId,
        notes.map(({ id }) => id).filter(Boolean) as string[],
      );
      this._loadAuthors(notes);
    } catch (error) {
      this.logger.error('load chat notes failed', error);
      // Settle a list that never loaded, so the drawer stops loading.
      if (!this.listedNoteIds[chatId]) {
        this._setListedNoteIds(chatId, []);
      }
    } finally {
      this._setLoading(chatId, false);
    }
  }
}
