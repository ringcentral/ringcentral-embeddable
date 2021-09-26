import { isInbound } from '@ringcentral-integration/commons/lib/callLogHelpers';

export function renderContactName(call) {
  const matches = isInbound(call) ? call.fromMatches : call.toMatches;
  if (matches && matches.length === 1) {
    return matches[0].name;
  }
  return isInbound(call) ? call.from.name : call.to.name;
}
