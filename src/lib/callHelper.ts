import callDirections from '@ringcentral-integration/commons/enums/callDirections';

export function getCallContact(call) {
  if (!call) {
    return null;
  }
  const matchKey = call.direction === callDirections.inbound ? 'fromMatches' : 'toMatches';
  const numberKey = call.direction === callDirections.inbound ? 'from' : 'to';
  const matches = call[matchKey] || [];
  if (matches.length === 1) {
    return matches[0];
  }
  if (!call[numberKey]) {
    return null;
  }
  return {
    phoneNumber: call[numberKey].phoneNumber || call[numberKey].extensionNumber,
  };
}