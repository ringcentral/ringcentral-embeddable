import React from 'react';
import { RcChip, RcTooltip, styled, palette2 } from '@ringcentral/juno';

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

const UnassignedChip = styled(StyledChip)`
  background-color: ${palette2('neutral', 'f02')};
  color: ${palette2('neutral', 'f01')};
  border: none;

  &:hover {
    background-color: ${palette2('neutral', 'f02')};
    color: ${palette2('neutral', 'f01')};
    border: none;
  }
`;

export function AssignedFullBadge({
  assignee,
  className,
  isAssignedToMe,
  status,
}: {
  assignee: {
    name: string;
  };
  className?: string;
  isAssignedToMe: boolean;
  status: string;
}) {
  if (status === 'Resolved') {
    return (
      <RcTooltip title="Resolved">
        <UnassignedChip label="RESOLVED" className={className} />
      </RcTooltip>
    );
  }
  if (!assignee) {
    return (
      <RcTooltip title="Unassigned">
        <UnassignedChip
          label="UNASSIGNED"
          className={className}
        />
      </RcTooltip>
    );
  }
  if (!isAssignedToMe) {
    return (
      <RcTooltip title={`Assigned to ${assignee.name}`}>
        <StyledChip
          label={`ASSIGNED TO ${(assignee.name || '').toUpperCase()}`}
          variant="outlined"
          color="action.primary"
          className={className}
        />
      </RcTooltip>
    );
  }
  return (
    <RcTooltip title="Assigned to you">
      <HighlightedChip
        label="ASSIGNED TO YOU"
        className={className}
      />
    </RcTooltip>
  );
}

export function AssignedShortBadge({
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
