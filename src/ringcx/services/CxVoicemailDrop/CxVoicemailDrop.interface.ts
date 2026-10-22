/**
 * A running voicemail drop on a CX call, with what the call page needs to show
 * its progress. Times are epoch milliseconds; the page ticks on its own, so
 * the shared state only changes when the drop moves to another phase.
 */
export interface CxVoicemailDropState {
  status: string;
  /** When the drop started waiting for the greeting to end. */
  startedAt: number;
  /** When the message started playing. */
  sendingStartedAt?: number;
  /** The message length in seconds, known once it plays. */
  messageDuration?: number;
}
