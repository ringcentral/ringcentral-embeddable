import {
  StarFilledMd,
  StarMd,
  StickyNoteMd,
  TasksMd,
} from '@ringcentral/spring-icon';
import React from 'react';

import { t } from '../i18n';
import type { HeaderMenuAction } from '../TeamMessaging.view.interface';
import { HeaderMoreMenu } from './HeaderMoreMenu';

/**
 * The chat header's "More" menu: tasks, notes and favorites, so the chat
 * name keeps the header's width.
 */
export function ChatHeaderMenu({
  isFavorite,
  onToggleFavorite,
  onOpenTasks,
  onOpenNotes,
}: {
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenTasks?: () => void;
  onOpenNotes?: () => void;
}): React.ReactElement {
  const actions: HeaderMenuAction[] = [
    ...(onOpenTasks
      ? [{ key: 'tasks', symbol: TasksMd, label: t('tasks'), onClick: onOpenTasks }]
      : []),
    ...(onOpenNotes
      ? [{ key: 'notes', symbol: StickyNoteMd, label: t('notes'), onClick: onOpenNotes }]
      : []),
    {
      key: 'favorite',
      symbol: isFavorite ? StarFilledMd : StarMd,
      label: isFavorite ? t('removeFromFavorites') : t('addToFavorites'),
      onClick: onToggleFavorite,
    },
  ];
  return <HeaderMoreMenu actions={actions} dataSign="chatHeader" />;
}
