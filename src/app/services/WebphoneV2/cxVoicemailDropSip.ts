import { getHeader, getPeerNumber } from './WebphoneV2Session';

/** How long a hint waits for the transferred INVITE before it expires. */
export const CX_VOICEMAIL_DROP_HINT_TTL = 20_000;

/**
 * A RingCX voicemail drop waiting for its transferred call.
 *
 * Registered right before the CX call is cold-transferred to the agent's own
 * RingEX extension. The INVITE that transfer produces carries the customer's
 * number in `From` and `<main>*<extension>` in `To`, and nothing custom: CX
 * transfer `sipHeaders` do not reach it (`plans/cx-voicemail-drop`, S2).
 */
export interface CxVoicemailDropHint {
  readonly id: string;
  /** The customer's number, as dialed on the CX call. */
  readonly customerNumber: string;
  /** The agent's own RingEX extension number, the transfer target. */
  readonly extensionNumber: string;
  /** Pre-recorded message to drop once the call is answered. */
  readonly messageId: string;
  readonly expiresAt: number;
}

/** A live transferred call that plays, or is about to play, a voicemail. */
export interface CxVoicemailDropCall {
  readonly sessionId: string;
  readonly telephonySessionId: string | null;
  readonly messageId: string;
  readonly ringing: boolean;
  /** Not dropping yet, so kept out of every call list. */
  readonly hidden: boolean;
}

const toDigits = (value: string) => value.replace(/\D/g, '');

/**
 * Whether a telephony or presence call is the transferred call a pending hint
 * waits for: inbound, from the hint's customer. Used before the INVITE is
 * matched, when call lists may already hear about the call.
 */
export const isCxVoicemailDropHintCall = ({
  hints,
  direction,
  fromNumber,
}: {
  hints: readonly CxVoicemailDropHint[];
  direction?: string;
  fromNumber?: string;
}): boolean => {
  if (
    hints.length === 0 ||
    direction !== 'Inbound' ||
    typeof fromNumber !== 'string' ||
    !fromNumber
  ) {
    return false;
  }
  const fromDigits = toDigits(fromNumber);
  return hints.some((hint) => toDigits(hint.customerNumber) === fromDigits);
};

/** Whether the INVITE `From` is the hint's customer number. */
const isFromCustomer = (fromNumber: string, hint: CxVoicemailDropHint) => {
  const fromDigits = toDigits(fromNumber);
  return fromDigits !== '' && fromDigits === toDigits(hint.customerNumber);
};

/**
 * Whether the INVITE `To` targets the hint's extension.
 *
 * The user part is `<mainNumberDigits>*<extension>`; only the extension is
 * compared, so a main number written with or without `+` still matches.
 */
const isToExtension = (toUser: string, hint: CxVoicemailDropHint) => {
  const extension = toUser.split('*').pop() ?? '';
  return extension !== '' && extension === hint.extensionNumber;
};

/**
 * Finds the live hint an inbound INVITE answers, if any.
 *
 * Reads the raw `From` and `To` headers, because a later `P-Asserted-Identity`
 * UPDATE can rewrite the session's displayed numbers.
 */
export const findCxVoicemailDropHint = ({
  hints,
  inviteMessage,
  now = Date.now(),
}: {
  hints: readonly CxVoicemailDropHint[];
  inviteMessage: unknown;
  now?: number;
}): CxVoicemailDropHint | undefined => {
  if (hints.length === 0) {
    return undefined;
  }
  const fromNumber = getPeerNumber(getHeader(inviteMessage, 'From'));
  const toUser = getPeerNumber(getHeader(inviteMessage, 'To'));
  return hints.find(
    (hint) =>
      hint.expiresAt >= now &&
      isFromCustomer(fromNumber, hint) &&
      isToExtension(toUser, hint),
  );
};
