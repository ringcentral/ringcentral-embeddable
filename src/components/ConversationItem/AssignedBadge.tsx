import React from 'react';
import { RcChip, styled, palette2 } from '@ringcentral/juno';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join('');
}

const StyledChip = styled(RcChip)`
  height: 20px;
  line-height: 20px;
  padding: 0;
  font-size: 0.75rem;

  .MuiChip-label {
    padding: 0 8px;
  }
`;

const HighlightedChip = styled(StyledChip)`
  background-color: ${palette2('highlight', 'b03')};
  color: ${palette2('neutral', 'f01')};
  border: none;

  &:hover {
    background-color: ${palette2('highlight', 'b03')};
    color: ${palette2('neutral', 'f01')};
    border: none;
  }
`;

export function AssignedBadge({
  assignee,
  isAssignedToMe,
  className,
}: {
  assignee: {
    name: string;
  };
  isAssignedToMe: boolean;
  className?: string;
}) {
  if (!assignee) {
    return null;
  }
  const initials = getInitials(assignee.name);
  if (!isAssignedToMe) {
    return (
      <StyledChip
        label={initials}
        variant="outlined"
        color="action.primary"
        className={className}
      />
    );
  }
  return (
    <HighlightedChip
      label={initials}
      className={className}
    />
  );
}
