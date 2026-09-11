import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  ReferenceMenuList,
  type SelectedIdMap,
  type SimpleCrmObject,
} from '@ringcentral-integration/micro-phone/src/app/components/ReferenceWidgetSpring';
import { useConnector, useContainer } from '@ringcentral-integration/next-core';
import { Menu, Tag } from '@ringcentral/spring-ui';
import React, { useCallback, useMemo, useState } from 'react';

import type {
  MatchedContactSelection,
  MatchedContactSelectionScope,
} from '../../services/MatchedContactSelection';

import i18n from './i18n';

const stopPropagation = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

/** The shared shape of an `Entity` and a `CorrespondentMatch`. */
export interface MatchedContactOption {
  id?: string;
  name?: string;
  type?: string;
}

export interface MatchedContactsTagProps {
  scope: MatchedContactSelectionScope;
  /** `sessionId` for calls, `conversationId` for conversations. */
  recordKey?: string | null;
  matches?: MatchedContactOption[];
  /**
   * Whether the user may pick a match. Fax, voicemail and multi-correspondent
   * conversations are display-only: the framework suppresses `selections` for
   * them, so a pick would never resolve.
   *
   * @default true
   */
  selectable?: boolean;
}

/**
 * The `N matches` indicator, as an affordance for choosing which of several
 * matched contacts a record belongs to.
 *
 * The framework's own `matchCounts` tag is inert, and its match count collapses
 * to `selections.length` once a selection exists — so callers pass
 * `matchCounts: false` to `DisplayName` and render this instead, keeping the
 * count anchored to the real number of matches.
 */
export const MatchedContactsTag: React.FC<MatchedContactsTagProps> = ({
  scope,
  recordKey,
  matches,
  selectable = true,
}) => {
  const { t } = useLocale(i18n);
  const matchedContactSelection = useContainer<MatchedContactSelection>(
    'MatchedContactSelection'
  );
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const selectedEntityId = useConnector(() =>
    recordKey
      ? matchedContactSelection.getSelectedEntityId(scope, recordKey)
      : undefined
  );

  const selectedMap = useMemo<SelectedIdMap>(
    () => (selectedEntityId ? { [selectedEntityId]: true } : {}),
    [selectedEntityId]
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleItemClick = useCallback(
    (item: SimpleCrmObject, checked: boolean) => {
      setAnchorEl(null);
      if (!recordKey || !item.id) {
        return;
      }
      // Clicking the current pick clears it, returning the record to the
      // framework's `Maybe: <guess>` rendering.
      if (!checked) {
        void matchedContactSelection.clear({ scope, key: recordKey });
        return;
      }
      void matchedContactSelection.select({
        scope,
        key: recordKey,
        entityId: item.id,
      });
    },
    [matchedContactSelection, recordKey, scope]
  );

  const list = useMemo(
    () => (matches ?? []).filter((match) => Boolean(match?.id)),
    [matches]
  );

  if (list.length <= 1) {
    return null;
  }

  const tag = (
    <Tag
      color="neutral"
      variant="inverted"
      className="shrink-0 w-fit max-w-20 my-1"
    >
      {t('matches', { numberOfMatches: list.length })}
    </Tag>
  );

  if (!selectable || !recordKey) {
    return <span data-sign="matchCounts">{tag}</span>;
  }

  return (
    <>
      <button
        type="button"
        aria-label={t('selectMatch')}
        data-sign="matchCountsButton"
        className="shrink-0 max-w-full cursor-pointer"
        onClick={(event) => {
          // The surrounding list item navigates on click.
          event.stopPropagation();
          event.preventDefault();
          setAnchorEl(event.currentTarget);
        }}
      >
        {tag}
      </button>
      {/*
        The menu renders through a portal, so its DOM sits outside the list
        item — but React events still bubble up this component tree into the
        item's onClick, which navigates. `display: contents` keeps this
        event boundary out of the surrounding flex layout.
      */}
      <div
        className="contents"
        onClick={stopPropagation}
        onMouseDown={stopPropagation}
      >
        <Menu open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={handleClose}>
          <ReferenceMenuList
            showGroupLabel
            label={t('suggested')}
            list={list}
            selectedMap={selectedMap}
            onItemClick={handleItemClick}
          />
        </Menu>
      </div>
    </>
  );
};
