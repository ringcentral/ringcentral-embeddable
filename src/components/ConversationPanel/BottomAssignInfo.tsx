import React from 'react';
import { styled, palette2, RcTypography, RcLink } from '@ringcentral/juno';

const Root = styled(RcTypography)`
  background-color: ${palette2('informative', 'b01')};
  color: ${palette2('interactive', 'f01')};
  border: 1px solid ${palette2('informative', 'f01')};
  border-radius: 4px;
  padding: 8px;
  margin: 16px;
  font-size: 0.875rem;
`;

const Link = styled(RcLink)`
  font-weight: bold;
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: underline;
`;

export function BottomAssignInfo({
  assignee,
  isAssignedToMe,
  onAssignToMe,
  onAssign,
  onReply,
  status,
  busy,
}) {
  if (status === 'Resolved') {
    return (
      <Root variant='caption1'>
        This conversation is resolved. <Link variant="inherit" disabled={busy} onClick={onReply}>Reply</Link>
      </Root>
    );
  }
  if (assignee && !isAssignedToMe) {
    return (
      <Root variant='caption1'>
        This conversation is assigned to {assignee.name}. <Link variant="inherit" disabled={busy} onClick={onAssignToMe}>Assign to me</Link>
      </Root>
    );
  }
  if (!assignee) {
    return (
      <Root variant='caption1'>
        This conversation is unassigned. <Link variant="inherit" onClick={onReply} disabled={busy}>Reply</Link> or <Link variant="inherit" onClick={onAssign} disabled={busy}>Assign</Link>
      </Root>
    );
  }
  return null;
}
