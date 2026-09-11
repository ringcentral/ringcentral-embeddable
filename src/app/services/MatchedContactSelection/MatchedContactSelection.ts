import {
  action,
  delegate,
  injectable,
  RcModule,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import type {
  ClearMatchedContactOptions,
  MatchedContactSelectionEntry,
  MatchedContactSelectionInfo,
  MatchedContactSelectionScope,
  PendingOutboundSelection,
  SelectMatchedContactOptions,
} from './MatchedContactSelection.interface';

/** Same cap the legacy `ContactMatcher.callMatchedList` used. */
const MAX_ENTRIES = 200;

/** Below this, a number is treated as an extension and matched exactly. */
const MIN_SUFFIX_MATCH_DIGITS = 7;

/**
 * Compares what a record displayed as its dial number with what the resulting
 * call reports.
 *
 * The two are formatted independently — one may be national and the other
 * E.164 — so the longer is matched by suffix. Extensions are too short for that
 * to be safe, so they must match exactly.
 */
function isSameNumber(a?: string, b?: string) {
  if (!a || !b) {
    return false;
  }
  const digitsOf = (value: string) => value.replace(/\D/g, '');
  const [shorter, longer] = [digitsOf(a), digitsOf(b)].sort(
    (x, y) => x.length - y.length
  );
  if (!shorter) {
    return false;
  }
  if (shorter.length < MIN_SUFFIX_MATCH_DIGITS) {
    return shorter === longer;
  }
  return longer.endsWith(shorter);
}

/**
 * Remembers which of several matched contacts the user picked for a given call
 * or conversation, so the UI can stop guessing with `Maybe: <name>`.
 *
 * Selections are resolved against the match list the caller already holds
 * (`fromMatches` / `toMatches` for calls, `correspondentMatches` for
 * conversations) rather than re-derived from a phone number — the matcher and
 * the display disagree on which of phone/extension number wins, so a
 * number-keyed lookup would silently miss.
 */
@injectable({
  name: 'MatchedContactSelection',
})
export class MatchedContactSelection extends RcModule {
  constructor(protected _storage: StoragePlugin) {
    super();
    this._storage.enable(this);
  }

  @storage
  @state
  selectionList: MatchedContactSelectionEntry[] = [];

  /**
   * The pick to hand to the next outbound call, so dialling a record that had
   * a chosen contact keeps that contact instead of falling back to a fresh
   * `Maybe:` guess on the new session.
   *
   * Deliberately not persisted: it is consumed by the call it was set for.
   */
  @state
  pendingOutbound: PendingOutboundSelection | null = null;

  @action
  private _setPendingOutbound(pending: PendingOutboundSelection | null) {
    this.pendingOutbound = pending;
  }

  @delegate('server')
  async setPendingOutbound(
    pending: PendingOutboundSelection | null
  ): Promise<void> {
    this._setPendingOutbound(pending);
  }

  /**
   * Adopts the pending pick for a newly placed outbound call.
   *
   * Only the entity id is recorded, so this is safe to call before contact
   * matching for the new number has resolved — the name appears as soon as the
   * matches arrive.
   */
  @delegate('server')
  async adoptPendingOutbound(sessionId: string, phoneNumber?: string) {
    const pending = this.pendingOutbound;
    if (!pending) {
      return;
    }
    this._setPendingOutbound(null);
    if (!sessionId || !isSameNumber(pending.phoneNumber, phoneNumber)) {
      return;
    }
    this._select({ scope: 'call', key: sessionId, entityId: pending.entityId });
  }

  @action
  private _select({ scope, key, entityId }: SelectMatchedContactOptions) {
    const existing = this.selectionList.find(
      (entry) => entry.scope === scope && entry.key === key
    );
    if (existing) {
      existing.entityId = entityId;
      return;
    }
    if (this.selectionList.length >= MAX_ENTRIES) {
      this.selectionList.shift();
    }
    this.selectionList.push({ scope, key, entityId });
  }

  @action
  private _clear({ scope, key }: ClearMatchedContactOptions) {
    this.selectionList = this.selectionList.filter(
      (entry) => !(entry.scope === scope && entry.key === key)
    );
  }

  /**
   * Storage is owned by the server instance, so the write has to run there —
   * an action dispatched straight from a client tab would mutate only that
   * tab's copy and never be persisted.
   */
  @delegate('server')
  async select(options: SelectMatchedContactOptions): Promise<void> {
    this._select(options);
  }

  @delegate('server')
  async clear(options: ClearMatchedContactOptions): Promise<void> {
    this._clear(options);
  }

  /**
   * The selected entity id for a record, whether or not it still resolves to a
   * live match. Used to render the picker's checked state.
   */
  getSelectedEntityId(scope: MatchedContactSelectionScope, key: string) {
    return this.selectionList.find(
      (entry) => entry.scope === scope && entry.key === key
    )?.entityId;
  }

  /**
   * Resolves a pick into the shape the framework consumes as
   * `callSelectionInfo` / `displaySelection`.
   *
   * `selections` carries the full match list rather than just the pick: the
   * framework computes the match count as `selections.length` once a selection
   * exists, so a single-element array would make the "N matches" count vanish.
   */
  resolveSelection<T extends { id?: string }>(
    scope: MatchedContactSelectionScope,
    key: string | null | undefined,
    matches: T[] | undefined
  ): MatchedContactSelectionInfo<T> | undefined {
    if (!key || !matches?.length) {
      return undefined;
    }
    const entityId = this.getSelectedEntityId(scope, key);
    if (!entityId) {
      return undefined;
    }
    const displayedSelection = matches.find((match) => match?.id === entityId);
    return displayedSelection
      ? { displayedSelection, selections: matches }
      : undefined;
  }
}
