import {
  action,
  injectable,
  RcModule,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import type {
  CxWrapUpLogEntry,
  CxWrapUpLogMapping,
} from './CxWrapUpLog.interface';

/** Wrap-up pages kept, newest last; older calls are long logged or dropped. */
const MAX_ENTRIES = 20;

const OPEN_LOG_STATUSES: ReadonlySet<CxWrapUpLogEntry['logStatus']> = new Set([
  'pending',
  'queued',
  'saving',
  'failed',
]);

/**
 * The call log part of RingCX wrap-up pages: the disposition and the host's
 * call log form on one page. Kept per call, and in storage, so the page can
 * come back after the agent left it, the next call took over, or the app
 * reloaded.
 */
@injectable({
  name: 'CxWrapUpLog',
})
export class CxWrapUpLog extends RcModule {
  constructor(private readonly _storagePlugin: StoragePlugin) {
    super();
    this._storagePlugin.enable(this);
  }

  @storage
  @state
  entries: CxWrapUpLogMapping = {};

  /** The call of the wrap-up page opened last. */
  @storage
  @state
  lastCallId = '';

  /**
   * Starts a wrap-up for a call, once. A second call keeps the first entry,
   * so the page does not lose what it already did.
   */
  @action
  open(callId: string, hasDispositionStep: boolean): void {
    this.lastCallId = callId;
    if (this.entries[callId]) {
      return;
    }
    this.entries[callId] = {
      hasDispositionStep,
      formStatus: 'idle',
      logStatus: 'pending',
    };
    const callIds = Object.keys(this.entries);
    callIds
      .slice(0, Math.max(0, callIds.length - MAX_ENTRIES))
      .forEach((id) => {
        delete this.entries[id];
      });
  }

  @action
  update(callId: string, patch: Partial<CxWrapUpLogEntry>): void {
    const entry = this.entries[callId];
    if (!entry) {
      return;
    }
    this.entries[callId] = { ...entry, ...patch };
  }

  get(callId: string): CxWrapUpLogEntry | undefined {
    return callId ? this.entries[callId] : undefined;
  }

  /** The call log is not saved yet, nor left for later. */
  isLogOpen(callId: string): boolean {
    const entry = this.get(callId);
    return !!entry && OPEN_LOG_STATUSES.has(entry.logStatus);
  }
}
