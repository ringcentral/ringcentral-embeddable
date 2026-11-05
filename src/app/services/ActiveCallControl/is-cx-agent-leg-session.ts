/**
 * Party meta id RingCX stamps on the agent's own RingEX party when it places
 * a call for the agent, such as the consult leg of an Ask First transfer to a
 * directory user, or a corporate directory dial.
 */
const CX_IDS_META_ID = 'rcx-ids';

type CxAgentLegMeta = {
  readonly values?: ReadonlyArray<{ readonly id?: string }>;
};

type CxAgentLegParty = {
  readonly direction?: string;
  readonly extensionId?: string | number;
  readonly meta?: ReadonlyArray<CxAgentLegMeta>;
};

/** A RingEX telephony session that may be a RingCX agent leg. */
export type CxAgentLegSession = {
  readonly extensionId?: string | number;
  readonly party?: CxAgentLegParty;
  readonly parties?: ReadonlyArray<CxAgentLegParty>;
};

/**
 * Whether a RingEX telephony session is an outbound leg RingCX placed for the
 * agent. It belongs to the CX call, so it must not show as a RingEX call.
 */
export function isCxAgentLegSession(session: CxAgentLegSession): boolean {
  const ownParty = session.party ?? findOwnParty(session);
  if (ownParty?.direction?.toLowerCase() !== 'outbound') {
    return false;
  }
  return (ownParty.meta ?? []).some((meta) =>
    (meta.values ?? []).some((value) => value.id === CX_IDS_META_ID),
  );
}

function findOwnParty(
  session: CxAgentLegSession,
): CxAgentLegParty | undefined {
  if (session.extensionId == null) {
    return undefined;
  }
  const extensionId = String(session.extensionId);
  return session.parties?.find(
    (party) =>
      party.extensionId != null && String(party.extensionId) === extensionId,
  );
}
