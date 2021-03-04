import { isInbound } from 'ringcentral-integration/lib/callLogHelpers';

export function renderContactName(call) {
  return isInbound(call) ? call.from.name : call.to.name;
}
