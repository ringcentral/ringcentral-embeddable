/**
 * Where the wrap-up page's call log form comes from.
 *
 * - `prepare`: the host opted in with `callLoggerPrepareLogForm` and builds
 *   its form on a `prepareLogForm` request.
 * - `page`: the host's current `$LOG-CALL` form, or the default one, as the
 *   log page shows it. For `showLogModal` hosts, and for a host that opened
 *   its own log page for the call (Rule A).
 * - `none`: no call log form on the wrap-up page.
 */
export type CxWrapUpLogMode = 'prepare' | 'page' | 'none';

/** The host's call log form for a `prepare` wrap-up. */
export type CxWrapUpFormStatus = 'idle' | 'loading' | 'ready' | 'none';

/**
 * The call log of a wrap-up page. `queued` is a form submitted during the
 * call, saved when it ends. `skipped` is Log later or Submit without logging:
 * the call stays Unlogged in history.
 */
export type CxWrapUpLogStatus =
  | 'pending'
  | 'queued'
  | 'saving'
  | 'saved'
  | 'failed'
  | 'skipped';

export interface CxWrapUpLogEntry {
  /**
   * The page opened with a disposition to submit. Names its side widget tab,
   * and is kept while the agent is on the page.
   */
  hasDispositionStep: boolean;
  formStatus: CxWrapUpFormStatus;
  /** The host's `noLogForm` reason. */
  noLogFormReason?: string;
  logStatus: CxWrapUpLogStatus;
  /** The host's `error` for a failed save. */
  logError?: string;
  /**
   * The call log form submitted during the call, sent when it ends. Kept
   * after a failed save, so the page shows it again.
   */
  queuedFormData?: Record<string, unknown>;
  /** The host opened its own log page for this call. */
  hostOpened?: boolean;
}

export interface CxWrapUpLogMapping {
  [callId: string]: CxWrapUpLogEntry;
}
