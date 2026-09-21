/**
 * Directory member the CX agent just dialed. RingEX telephony uses
 * `to.extensionId`; presence active calls use `toName`. Early Ringing
 * events often have neither, and show from/to as the account main number.
 */
export type CxExBridgeHint = {
  readonly extensionId: string;
  readonly name: string;
  readonly mainNumber: string;
};

type CxExBridgeParty = {
  readonly phoneNumber?: string;
  readonly extensionNumber?: string;
  readonly extensionId?: string | number;
  readonly name?: string;
};

type CxExBridgePartySource = CxExBridgeParty | string;

type CxExBridgeSessionParty = {
  readonly direction?: string;
  readonly from?: CxExBridgeParty;
  readonly to?: CxExBridgeParty;
};

/**
 * A RingEX telephony session or presence active call that may be the agent
 * ghost leg of a CX corporate-directory dial.
 */
export type CxExBridgeCall = {
  readonly direction?: string;
  readonly from?: CxExBridgePartySource;
  readonly to?: CxExBridgePartySource;
  readonly toName?: string;
  readonly parties?: ReadonlyArray<CxExBridgeSessionParty>;
};

const MIN_PHONE_NUMBER_DIGIT_COUNT = 7;

/**
 * Whether a RingEX session or presence call is the outbound ghost of a CX
 * internal directory dial.
 */
export function isCxRcExtExBridgeCall({
  call,
  hints,
}: {
  call: CxExBridgeCall;
  hints: readonly CxExBridgeHint[];
}): boolean {
  if (hints.length === 0) {
    return false;
  }
  const resolved = resolveCallParties(call);
  if (!isOutboundDirection(resolved.direction)) {
    return false;
  }
  const fromNumbers = listPartyNumbers(resolved.from);
  const toNumbers = listPartyNumbers(resolved.to);
  const toExtensionIds = listToExtensionIds(call, resolved.to);
  const toNames = listToNames(call, resolved.to);
  return hints.some((hint) =>
    isDirectoryGhost({
      fromNumbers,
      toNumbers,
      toExtensionIds,
      toNames,
      hint,
    }),
  );
}

function resolveCallParties(call: CxExBridgeCall): {
  direction?: string;
  from?: CxExBridgePartySource;
  to?: CxExBridgePartySource;
} {
  const outboundParty = call.parties?.find((party) =>
    isOutboundDirection(party.direction),
  );
  const party = outboundParty ?? call.parties?.[0];
  if (call.from !== undefined || call.to !== undefined) {
    return {
      direction: call.direction ?? party?.direction,
      from: call.from,
      to: call.to,
    };
  }
  return {
    direction: call.direction ?? party?.direction,
    from: party?.from,
    to: party?.to,
  };
}

function isOutboundDirection(direction: string | undefined): boolean {
  return direction?.toLowerCase() === 'outbound';
}

function isDirectoryGhost({
  fromNumbers,
  toNumbers,
  toExtensionIds,
  toNames,
  hint,
}: {
  fromNumbers: readonly string[];
  toNumbers: readonly string[];
  toExtensionIds: readonly string[];
  toNames: readonly string[];
  hint: CxExBridgeHint;
}): boolean {
  if (
    hint.extensionId &&
    toExtensionIds.some((extensionId) => extensionId === hint.extensionId)
  ) {
    return true;
  }
  if (hint.name) {
    const normalizedHintName = normalizePersonName(hint.name);
    if (
      toNames.some((name) => normalizePersonName(name) === normalizedHintName)
    ) {
      return true;
    }
  }
  const hasIdentity = toExtensionIds.length > 0 || toNames.length > 0;
  if (hasIdentity) {
    return false;
  }
  return isMainToMainGhost({ fromNumbers, toNumbers, hint });
}

function isMainToMainGhost({
  fromNumbers,
  toNumbers,
  hint,
}: {
  fromNumbers: readonly string[];
  toNumbers: readonly string[];
  hint: CxExBridgeHint;
}): boolean {
  if (!hint.mainNumber || fromNumbers.length === 0 || toNumbers.length === 0) {
    return false;
  }
  const fromMatchesMain = fromNumbers.some((number) =>
    arePhoneNumbersEqual(number, hint.mainNumber),
  );
  if (!fromMatchesMain) {
    return false;
  }
  return toNumbers.some((number) =>
    arePhoneNumbersEqual(number, hint.mainNumber),
  );
}

function listToExtensionIds(
  call: CxExBridgeCall,
  to: CxExBridgePartySource | undefined,
): string[] {
  const extensionIds = [
    readPartyExtensionId(to),
    ...(call.parties ?? []).map((party) => readPartyExtensionId(party.to)),
  ].filter((extensionId): extensionId is string => Boolean(extensionId));
  return [...new Set(extensionIds)];
}

function listToNames(
  call: CxExBridgeCall,
  to: CxExBridgePartySource | undefined,
): string[] {
  const names = [
    call.toName,
    readPartyName(to),
    ...(call.parties ?? []).map((party) => readPartyName(party.to)),
  ].filter((name): name is string => Boolean(name));
  return [...new Set(names)];
}

function listPartyNumbers(party: CxExBridgePartySource | undefined): string[] {
  if (typeof party === 'string') {
    return party ? [party] : [];
  }
  return [party?.phoneNumber, party?.extensionNumber].filter(
    (number): number is string => Boolean(number),
  );
}

function readPartyExtensionId(
  party: CxExBridgePartySource | undefined,
): string | undefined {
  if (!party || typeof party === 'string' || party.extensionId == null) {
    return undefined;
  }
  const extensionId = String(party.extensionId).trim();
  return extensionId || undefined;
}

function readPartyName(
  party: CxExBridgePartySource | undefined,
): string | undefined {
  if (!party || typeof party === 'string') {
    return undefined;
  }
  const name = party.name?.trim();
  return name || undefined;
}

function normalizePersonName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function arePhoneNumbersEqual(left: string, right: string): boolean {
  const leftDigits = left.replace(/\D/g, '');
  const rightDigits = right.replace(/\D/g, '');
  if (!leftDigits || !rightDigits) {
    return false;
  }
  if (leftDigits === rightDigits) {
    return true;
  }
  if (
    leftDigits.length < MIN_PHONE_NUMBER_DIGIT_COUNT ||
    rightDigits.length < MIN_PHONE_NUMBER_DIGIT_COUNT
  ) {
    return false;
  }
  return leftDigits.endsWith(rightDigits) || rightDigits.endsWith(leftDigits);
}
