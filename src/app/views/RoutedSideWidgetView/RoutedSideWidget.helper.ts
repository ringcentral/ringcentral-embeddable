import type { ThirdPartyWidgetContact } from '../../services/ThirdParty';

interface Party {
  extensionNumber?: string;
  name?: string;
  phoneNumber?: string;
}

interface MatchedContact {
  id?: string;
  name?: string;
  phoneNumber?: string;
  phoneNumbers?: ThirdPartyWidgetContact['phoneNumbers'];
}

interface ConversationContactSource {
  correspondents?: Party[];
  correspondentMatches?: MatchedContact[];
  correspondentMatchesList?: MatchedContact[][];
  direction?: string;
  from?: Party;
  to?: Party[];
}

interface CallContactSource {
  direction?: string;
  from?: Party | string;
  fromMatches?: MatchedContact[];
  to?: Party | string;
  toMatches?: MatchedContact[];
}

export function getRoutedConversationContact(
  conversation?: ConversationContactSource,
): ThirdPartyWidgetContact | null {
  if (!conversation) {
    return null;
  }
  const singleCorrespondent =
    conversation.correspondents?.length === 1
      ? conversation.correspondents[0]
      : undefined;
  const party =
    singleCorrespondent ??
    (conversation.direction === 'Inbound'
      ? conversation.from
      : conversation.to?.[0]);
  const partyMatches = conversation.correspondentMatchesList?.[0];
  const flatMatches = conversation.correspondentMatches;
  let matchedContact: MatchedContact | undefined;
  if (partyMatches?.length === 1) {
    [matchedContact] = partyMatches;
  } else if (flatMatches?.length === 1) {
    [matchedContact] = flatMatches;
  }
  const phoneNumber = party?.phoneNumber ?? party?.extensionNumber;
  if (!phoneNumber && !matchedContact?.id) {
    return null;
  }
  return {
    ...matchedContact,
    name: matchedContact?.name ?? party?.name,
    phoneNumber,
  };
}

export function getRoutedCallContact(
  call?: CallContactSource | null,
): ThirdPartyWidgetContact | null {
  if (!call) {
    return null;
  }
  const isInbound = call.direction === 'Inbound';
  const matches = isInbound ? call.fromMatches : call.toMatches;
  const matchedContact = matches?.length === 1 ? matches[0] : undefined;
  const party = isInbound ? call.from : call.to;
  const phoneNumber =
    typeof party === 'string'
      ? party
      : party?.phoneNumber ?? party?.extensionNumber;
  if (!phoneNumber && !matchedContact?.id) {
    return null;
  }
  return {
    ...matchedContact,
    phoneNumber: matchedContact?.phoneNumber ?? phoneNumber,
  };
}
