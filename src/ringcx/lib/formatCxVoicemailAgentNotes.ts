/** Account audio tokens start with the account id: `12345/Greeting`. */
const ACCOUNT_TOKEN = /^\d+\//;

/** A manually entered message is appended as `, app://…`. */
const MANUAL_APP_TAIL = /,\s*app:\/\//;

const VOICEMAIL_LEFT_DISPOSITIONS = ['VOICEMAIL-LEFT', 'VOICEMAIL_LEFT'];

export interface CxVoicemailAgentNotesLabels {
  manualEntry: string;
  accountAudio: string;
  globalAudio: string;
}

function getLibrarySegment(notes: string): string {
  const tail = notes.match(MANUAL_APP_TAIL);
  return (tail ? notes.slice(0, tail.index) : notes).trim();
}

function getAudioNames(segment: string): { account: string[]; global: string[] } {
  const tokens = segment
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  return {
    account: tokens
      .filter((token) => ACCOUNT_TOKEN.test(token))
      .map((token) => token.slice(token.indexOf('/') + 1)),
    global: tokens.filter((token) => !ACCOUNT_TOKEN.test(token)),
  };
}

/**
 * A lead history pass's agent notes. For a pass that left a voicemail, the
 * notes list the dropped audio, which reads better grouped by library; a
 * port of Agent One's `formatOutboundVoicemailAgentNotes`. Other notes are
 * returned as they are.
 */
export function formatCxVoicemailAgentNotes(
  agentNotes: string | undefined,
  disposition: string | undefined,
  labels: CxVoicemailAgentNotesLabels,
): string {
  const notes = agentNotes ?? '';
  if (!VOICEMAIL_LEFT_DISPOSITIONS.includes(disposition ?? '')) {
    return notes;
  }
  const trimmed = notes.trim();
  if (trimmed.startsWith('app://')) {
    return labels.manualEntry;
  }
  const { account, global } = getAudioNames(getLibrarySegment(trimmed));
  return [
    account.length ? `${labels.accountAudio}: ${account.join(', ')}` : '',
    global.length ? `${labels.globalAudio}: ${global.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
