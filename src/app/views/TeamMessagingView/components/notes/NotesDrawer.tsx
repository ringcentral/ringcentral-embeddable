import { SanitizeHtml } from '@ringcentral-integration/next-widgets/components';
import { StickyNoteMd } from '@ringcentral/spring-icon';
import {
  CircularProgressIndicator,
  Drawer,
  EmptyState,
  Text,
} from '@ringcentral/spring-ui';
import React, { type ReactNode } from 'react';

import type { TeamMessagingNote } from '../../../../services/TeamMessaging';
import { t } from '../../i18n';
import type { NotesDrawerProps } from '../../TeamMessaging.view.interface';
import { NoteCard } from './NoteCard';

/** "Updated by Da Kong · 10:42", or who created it when never edited. */
function getNoteByline({
  note,
  getMembers,
  getMemberName,
  formatTime,
}: { note: TeamMessagingNote } & Pick<
  NotesDrawerProps,
  'getMembers' | 'getMemberName' | 'formatTime'
>): string | undefined {
  const authorId = note.lastModifiedBy?.id ?? note.creator?.id;
  const time = note.lastModifiedTime ?? note.creationTime;
  if (!authorId || !time) {
    return undefined;
  }
  const name = getMemberName(getMembers([authorId])[0]);
  const values = { name, time: formatTime(new Date(time).getTime()) };
  return note.lastModifiedBy
    ? t('noteUpdated', values)
    : t('noteCreated', values);
}

/** A note: its title, who changed it last, and its body. */
function NoteDetails({
  note,
  ...authorProps
}: { note: TeamMessagingNote } & Pick<
  NotesDrawerProps,
  'getMembers' | 'getMemberName' | 'formatTime'
>): React.ReactElement {
  const byline = getNoteByline({ note, ...authorProps });
  return (
    <div
      className="flex flex-auto flex-col gap-3 overflow-y-auto p-4"
      data-sign="noteDetails"
    >
      <div className="flex flex-col gap-1">
        <span className="typography-title break-words text-neutral-b0">
          {note.title}
        </span>
        {byline ? (
          <Text className="typography-descriptor text-neutral-b2">
            {byline}
          </Text>
        ) : null}
      </div>
      {note.body === undefined ? (
        <div className="flex justify-center py-4">
          <CircularProgressIndicator size="small" color="primary" />
        </div>
      ) : (
        <SanitizeHtml
          content={note.body}
          className="typography-mainText block text-neutral-b0 [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc"
          data-sign="noteBody"
        />
      )}
    </div>
  );
}

/** The chat's published notes. */
function NoteList({
  notes,
  isLoading,
  onOpenNote,
}: Pick<NotesDrawerProps, 'notes' | 'isLoading' | 'onOpenNote'>): React.ReactElement {
  if (isLoading && notes.length === 0) {
    return (
      <div className="flex flex-auto items-center justify-center">
        <CircularProgressIndicator size="large" color="primary" />
      </div>
    );
  }
  if (notes.length === 0) {
    return <EmptyState icon={StickyNoteMd} title={t('noNotes')} />;
  }
  return (
    <div className="flex flex-auto flex-col overflow-y-auto">
      {notes.map((note) => (
        <div key={note.id} className="border-b border-neutral-b4">
          <NoteCard
            bordered={false}
            note={note}
            onOpen={() => onOpenNote(note.id!)}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * The chat's notes in a drawer over the chat: the list and a note. The chat
 * header serves as its header.
 */
export function NotesDrawer({
  open,
  container,
  onClose,
  notes,
  isLoading,
  note,
  isNoteMissing,
  getMembers,
  getMemberName,
  formatTime,
  onOpenNote,
}: NotesDrawerProps): React.ReactElement {
  const renderBody = (): ReactNode => {
    if (note) {
      return (
        <NoteDetails
          note={note}
          getMembers={getMembers}
          getMemberName={getMemberName}
          formatTime={formatTime}
        />
      );
    }
    if (isNoteMissing) {
      return <EmptyState icon={StickyNoteMd} title={t('noteNotFound')} />;
    }
    return (
      <NoteList notes={notes} isLoading={isLoading} onOpenNote={onOpenNote} />
    );
  };
  return (
    <Drawer
      open={open}
      anchor="right"
      container={container}
      onClose={onClose}
      classes={{
        body: '!w-full !max-w-full',
        content: '!p-0 !overflow-hidden flex min-h-0 flex-1 flex-col',
      }}
      bodyProps={{ 'data-sign': 'notesDrawer' }}
    >
      <div className="flex h-full flex-col overflow-hidden">
        {renderBody()}
      </div>
    </Drawer>
  );
}
