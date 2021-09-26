import callDirections from '@ringcentral-integration/commons/enums/callDirections';

export function getWebphoneSessionContactMatch(session, contactMapping) {
  if (session.contactMatch) {
    return session.contactMatch;
  }
  const fromMatches =
      (contactMapping && contactMapping[session.from]) || [];
  const toMatches =
    (contactMapping && contactMapping[session.to]) || [];
  const nameMatches =
    session.direction === callDirections.outbound
      ? toMatches
      : fromMatches;
  return nameMatches[0];
}
