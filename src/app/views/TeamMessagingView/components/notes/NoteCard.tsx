import { StickyNoteMd } from '@ringcentral/spring-icon';
import { Icon } from '@ringcentral/spring-ui';
import React from 'react';

import type { TeamMessagingNote } from '../../../../services/TeamMessaging';
import { t } from '../../i18n';

/** A note: its title and preview. Clicking it opens the note. */
export function NoteCard({
  note,
  onOpen,
  bordered = true,
}: {
  note: TeamMessagingNote;
  onOpen: () => void;
  /** A card in a post; a row in the notes list has no border. */
  bordered?: boolean;
}): React.ReactElement {
  return (
    <div
      role="button"
      tabIndex={0}
      title={t('openNote')}
      className={
        bordered
          ? 'mt-1 flex cursor-pointer gap-2 rounded border border-neutral-b4 px-3 py-2 hover:bg-neutral-b5'
          : 'flex cursor-pointer gap-2 px-3 py-2 hover:bg-neutral-b5'
      }
      data-sign="noteCard"
      onClick={onOpen}
      onKeyDown={(event) => event.key === 'Enter' && onOpen()}
    >
      <Icon
        symbol={StickyNoteMd}
        size="medium"
        className="flex-none text-extra-mango"
      />
      <div className="flex min-w-0 flex-auto flex-col">
        <span
          className="typography-subtitleMini truncate text-neutral-b0"
          data-sign="noteTitle"
        >
          {note.title}
        </span>
        {note.preview?.trim() ? (
          <span className="typography-descriptor line-clamp-2 break-words text-neutral-b2">
            {note.preview.trim()}
          </span>
        ) : null}
      </div>
    </div>
  );
}
