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
  TeamMessagingChats,
  type TeamMessagingMember,
  type TeamMessagingNote,
  TeamMessagingNotes,
  TeamMessagingPersons,
  TeamMessagingPosts,
  type TeamMessagingResult,
} from '../../services/TeamMessaging';
import { CreateNoteContent } from './components/notes/CreateNoteContent';
import { noteHtmlToText } from './components/notes/noteHtmlToText';
import { NotesDrawer } from './components/notes/NotesDrawer';
import { textToNoteHtml } from './components/notes/textToNoteHtml';
import { t } from './i18n';
import type {
  HeaderMenuAction,
  NoteActions,
  NoteFormValues,
  NotesViewProps,
} from './TeamMessaging.view.interface';

function getTime(value?: string): number {
  return value ? new Date(value).getTime() : 0;
}

/**
 * A chat's published notes: those the drawer listed and those its posts
 * carry, so the drawer agrees with the chat before the list loads. Newest
 * changes first.
 */
function getChatNotes({
  chatId,
  listedIds = [],
  notesMap,
}: {
  chatId: string;
  listedIds?: string[];
  notesMap: Record<string, TeamMessagingNote>;
}): TeamMessagingNote[] {
  const ids = new Set(listedIds);
  Object.values(notesMap).forEach((note) => {
    if (note.id && note.status === 'Active' && note.chatIds?.includes(chatId)) {
      ids.add(note.id);
    }
  });
  return Array.from(ids)
    .map((id) => notesMap[id])
    .filter((note): note is TeamMessagingNote => !!note)
    .sort(
      (first, second) =>
        getTime(second.lastModifiedTime) - getTime(first.lastModifiedTime),
    );
}

/**
 * Chat notes: the "Create note" dialog, note actions for posts, and the
 * notes drawer over a chat.
 */
@injectable({
  name: 'TeamMessagingNotesView',
})
export class TeamMessagingNotesView extends RcViewModule {
  constructor(
    private _teamMessagingChats: TeamMessagingChats,
    private _teamMessagingNotes: TeamMessagingNotes,
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

  /** The chat the "Create note" dialog creates in. */
  @state
  createNoteChatId: string | null = null;

  @action
  private _setCreateNoteChatId(chatId: string | null): void {
    this.createNoteChatId = chatId;
  }

  @portal
  private _createNoteModal = this._modalView.create({
    view: () => {
      const chatId = useConnector(() => this.createNoteChatId) ?? '';
      return (
        <CreateNoteContent
          onSubmit={(values) => this.createNote(chatId, values)}
          onCancel={() => undefined}
        />
      );
    },
    props: () => ({
      header: t('createNote'),
      'data-sign': 'createNoteModal',
    }),
  });

  /** The note the "Edit note" dialog edits, with its text as it opened. */
  @state
  editNote: { id: string; values: NoteFormValues } | null = null;

  @action
  private _setEditNote(editNote: { id: string; values: NoteFormValues } | null): void {
    this.editNote = editNote;
  }

  @portal
  private _editNoteModal = this._modalView.create({
    view: () => {
      const editNote = useConnector(() => this.editNote);
      return (
        <CreateNoteContent
          initialValues={editNote?.values}
          submitLabel={t('save')}
          onSubmit={(values) => this.updateNote(editNote?.id ?? '', values)}
          onCancel={() => undefined}
        />
      );
    },
    props: () => ({
      header: t('editNote'),
      'data-sign': 'editNoteModal',
    }),
  });

  @portal
  private _deleteNoteModal = this._modalView.create({
    props: () => ({
      header: t('deleteNote'),
      variant: 'confirm' as const,
      content: t('deleteNoteConfirm'),
      confirmButtonText: t('delete'),
      confirmButtonProps: { color: 'danger' as const },
      cancelButtonText: t('cancel'),
      'data-sign': 'deleteNoteModal',
    }),
  });

  /** Someone else editing a note, who holds its lock. */
  private _getLockHolder(note?: TeamMessagingNote): string | undefined {
    const holderId = note?.lockedBy?.id;
    if (!holderId || holderId === this._teamMessagingChats.myId) {
      return undefined;
    }
    return getPersonName(this.getMembers([holderId])[0]);
  }

  /**
   * Edit a note as plain text while holding its lock, which is released
   * when the dialog closes without saving. A note with formatting is edited
   * in the RingCentral app, so the formatting is never lost.
   */
  async openEditNote(noteId: string): Promise<void> {
    if (this._teamMessagingNotes.notesMap[noteId]?.body === undefined) {
      await this._teamMessagingNotes.loadNote(noteId);
    }
    const note = this._teamMessagingNotes.notesMap[noteId];
    if (!note || note.body === undefined) {
      this._toast.danger({ message: t('updateNoteFailed') });
      return;
    }
    const text = noteHtmlToText(note.body);
    if (text === null) {
      this._toast.info({ message: t('editNoteInApp') });
      return;
    }
    const lockHolder = this._getLockHolder(note);
    if (lockHolder) {
      this._toast.warning({ message: t('noteLockedBy', { name: lockHolder }) });
      return;
    }
    const locked = await this._teamMessagingNotes.lockNote(noteId);
    if (!locked?.ok) {
      const holder = this._getLockHolder(this._teamMessagingNotes.notesMap[noteId]);
      this._toast.warning({
        message: holder
          ? t('noteLockedBy', { name: holder })
          : t('updateNoteFailed'),
      });
      return;
    }
    this._setEditNote({ id: noteId, values: { title: note.title ?? '', text } });
    const saved = await this._modalView.open(this._editNoteModal).closed;
    if (!saved) {
      void this._teamMessagingNotes.unlockNote(noteId);
    }
  }

  async updateNote(
    noteId: string,
    { title, text }: NoteFormValues,
  ): Promise<TeamMessagingResult> {
    const result = await this._teamMessagingNotes.updateNote(noteId, {
      title,
      body: textToNoteHtml(text),
    });
    if (!result?.ok) {
      this._toast.danger({ message: t('updateNoteFailed') });
      return { ok: false };
    }
    return result;
  }

  /** Ask before deleting a note; `onDeleted` runs once it is deleted. */
  async confirmDeleteNote(
    noteId: string,
    onDeleted: () => void,
  ): Promise<void> {
    const confirmed = await this._modalView.open(this._deleteNoteModal).closed;
    if (!confirmed) {
      return;
    }
    const result = await this._teamMessagingNotes.deleteNote(noteId);
    if (!result?.ok) {
      this._toast.danger({ message: t('deleteNoteFailed') });
      return;
    }
    void this._teamMessagingPosts.removeAttachmentPosts(noteId);
    onDeleted();
  }

  /** The note header's "More" menu: edit and delete the note. */
  getNoteMenuActions(
    noteId: string,
    onDeleted: () => void,
  ): HeaderMenuAction[] {
    return [
      {
        key: 'edit',
        symbol: EditMd,
        label: t('edit'),
        onClick: () => void this.openEditNote(noteId),
      },
      {
        key: 'delete',
        symbol: TrashMd,
        label: t('delete'),
        onClick: () => void this.confirmDeleteNote(noteId, onDeleted),
      },
    ];
  }

  openCreateNote(chatId: string): void {
    this._setCreateNoteChatId(chatId);
    this._modalView.open(this._createNoteModal);
  }

  async createNote(
    chatId: string,
    { title, text }: NoteFormValues,
  ): Promise<TeamMessagingResult> {
    const result = await this._teamMessagingNotes.createNote(chatId, {
      title,
      body: textToNoteHtml(text),
    });
    if (!result?.ok) {
      this._toast.danger({ message: t('createNoteFailed') });
      return { ok: false };
    }
    // Without live events, the note post shows once the posts reload.
    void this._teamMessagingPosts.fetchPosts(chatId);
    return result;
  }

  getMembers(ids: string[]): TeamMessagingMember[] {
    const personsMap = this._teamMessagingPersons.personsMap;
    const myId = this._teamMessagingChats.myId;
    return ids.map((id) => getMember({ id, personsMap, myId }));
  }

  /** Note actions for posts; `openNote` shows a note in the drawer. */
  useNoteActions(openNote: (noteId: string) => void): NoteActions {
    const notesMap = useConnector(() => this._teamMessagingNotes.notesMap);
    return useMemo(
      () => ({
        getNote: (noteId: string) => notesMap[noteId],
        openNote,
      }),
      [notesMap, openNote],
    );
  }

  /** Load the list when it shows, or the note asked for with its body. */
  private _useLoadNotes({
    chatId,
    open,
    noteId,
  }: Pick<NotesViewProps, 'chatId' | 'open' | 'noteId'>): boolean {
    const [noteChecked, setNoteChecked] = useState(false);
    useEffect(() => {
      if (open && !noteId) {
        void this._teamMessagingNotes.loadChatNotes(chatId);
      }
    }, [chatId, open, noteId]);
    useEffect(() => {
      if (!open || !noteId) {
        return undefined;
      }
      let active = true;
      setNoteChecked(false);
      // Notes change without events, so an opened note is always reloaded.
      void this._teamMessagingNotes
        .loadNote(noteId)
        .finally(() => active && setNoteChecked(true));
      return () => {
        active = false;
      };
    }, [open, noteId]);
    return noteChecked;
  }

  component(props: NotesViewProps): React.ReactElement {
    const { chatId, open, noteId } = props;
    const noteChecked = this._useLoadNotes({ chatId, open, noteId });
    const { notes, isLoading, note } = useConnector(() => {
      const notesMap = this._teamMessagingNotes.notesMap;
      return {
        notes: getChatNotes({
          chatId,
          listedIds: this._teamMessagingNotes.listedNoteIds[chatId],
          notesMap,
        }),
        // Never listed yet counts as loading, not as an empty list.
        isLoading:
          !!this._teamMessagingNotes.loadingChatIds[chatId] ||
          !this._teamMessagingNotes.listedNoteIds[chatId],
        note: noteId ? notesMap[noteId] : undefined,
      };
    });
    // Re-render authors as their profiles load.
    useConnector(() => this._teamMessagingPersons.personsMap);
    return (
      <NotesDrawer
        {...props}
        notes={notes}
        isLoading={isLoading}
        note={note}
        isNoteMissing={!!noteId && !note && noteChecked}
        getMembers={(ids) => this.getMembers(ids)}
      />
    );
  }
}
